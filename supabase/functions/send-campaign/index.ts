import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;

function hexToInt(hex: string): number { return parseInt(hex.replace("#", ""), 16) || 0x5865f2; }

async function discordReq(path: string, init: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(`https://discord.com/api/v10${path}`, {
      ...init,
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
    });
    if (res.status === 429) {
      const data = await res.json().catch(() => ({ retry_after: 1 }));
      await new Promise((r) => setTimeout(r, ((data.retry_after as number) || 1) * 1000));
      continue;
    }
    return res;
  }
  throw new Error("rate_limit");
}

// Categoriza erro do Discord em buckets pra métricas estilo Meta Ads
function classifyError(status: number, body: string): { reason: string; bucket: "blocked" | "dm_closed" | "deleted" | "other" } {
  // 50007 = Cannot send messages to this user (DM fechada ou bloqueado)
  // 10013 = Unknown user (deletada)
  // 10003 = Unknown channel
  if (body.includes("50007")) {
    // Não dá pra distinguir "bloqueado" de "DM fechada" pela API; assumimos DM fechada quando o erro vem na criação do canal,
    // e "bloqueado" quando o canal abre mas a mensagem falha. Como simplificação:
    return { reason: "dm_closed_or_blocked", bucket: "dm_closed" };
  }
  if (body.includes("10013")) return { reason: "user_deleted", bucket: "deleted" };
  if (status === 403) return { reason: "forbidden_blocked", bucket: "blocked" };
  if (status === 404) return { reason: "not_found", bucket: "deleted" };
  return { reason: `http_${status}`, bucket: "other" };
}

// Sincroniza guilds antes de cada envio (mantém tudo "automático" pro usuário)
async function syncGuilds(admin: any) {
  try {
    let after = "0";
    const seen = new Set<string>();
    while (true) {
      const r = await discordReq(`/users/@me/guilds?limit=200&after=${after}`);
      if (!r.ok) {
        console.error("guilds list failed", r.status, await r.text());
        break;
      }
      const guilds = await r.json() as Array<{ id: string; name: string; icon: string | null; approximate_member_count?: number }>;
      console.log(`syncGuilds: bot está em ${guilds.length} guilds (page after=${after})`);
      if (!guilds.length) break;
      for (const g of guilds) {
        seen.add(g.id);
        // Buscar contagem real
        const detailRes = await discordReq(`/guilds/${g.id}?with_counts=true`);
        const detail = detailRes.ok ? await detailRes.json() : {};
        const memberCount = detail.approximate_member_count ?? g.approximate_member_count ?? 0;
        const iconUrl = g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null;
        await admin.from("discord_servers").upsert({
          guild_id: g.id, name: g.name, icon_url: iconUrl,
          member_count: memberCount, bot_in_server: true,
          last_synced_at: new Date().toISOString(),
        }, { onConflict: "guild_id" });
      }
      after = guilds[guilds.length - 1].id;
      if (guilds.length < 200) break;
    }
    // Marcar guilds que não vimos mais como inativas (excluindo as que vimos)
    if (seen.size > 0) {
      const seenArr = Array.from(seen);
      // PostgREST: usar .not().in() pega valores nativos
      await admin.from("discord_servers")
        .update({ bot_in_server: false })
        .not("guild_id", "in", `(${seenArr.join(",")})`);
    }
    return seen.size;
  } catch (e) {
    console.error("syncGuilds error", e);
    return 0;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = userData.user.id;

    const { campaign_id } = await req.json();
    if (!campaign_id) return new Response(JSON.stringify({ error: "campaign_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: campaign, error: cErr } = await admin.from("campaigns").select("*").eq("id", campaign_id).eq("user_id", userId).single();
    if (cErr || !campaign) return new Response(JSON.stringify({ error: "campaign_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (campaign.status === "sent" || campaign.status === "sending") {
      return new Response(JSON.stringify({ error: "already_sent" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const targetCount = campaign.target_count || 100;
    const requiredCoins = Math.ceil(targetCount / 10);

    const { data: profile } = await admin.from("profiles").select("credits").eq("id", userId).single();
    if (!profile || profile.credits < requiredCoins) {
      return new Response(JSON.stringify({ error: "insufficient_credits", required: requiredCoins, have: profile?.credits ?? 0 }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await admin.from("campaigns").update({ status: "sending" }).eq("id", campaign_id);

    // Sync silencioso da rede
    await syncGuilds(admin);

    // Buscar servidores da rede (filtrados pelos nichos selecionados)
    const niches: string[] = Array.isArray(campaign.target_niches) ? campaign.target_niches : [];
    let servers: any[] = [];

    if (niches.length > 0) {
      const { data } = await admin.from("discord_servers").select("guild_id, name, niche")
        .eq("bot_in_server", true).in("niche", niches);
      servers = data ?? [];
    }
    // Fallback: se nenhum servidor com o nicho exato, usa toda a rede ativa
    if (servers.length === 0) {
      const { data } = await admin.from("discord_servers").select("guild_id, name, niche")
        .eq("bot_in_server", true);
      servers = data ?? [];
      console.log(`Fallback: nenhum servidor com nichos [${niches.join(",")}], usando rede inteira (${servers.length})`);
    }

    if (servers.length === 0) {
      await admin.from("campaigns").update({
        status: "failed",
        error_message: "O bot não está em nenhum servidor ativo. Adicione o bot a servidores primeiro.",
      }).eq("id", campaign_id);
      return new Response(JSON.stringify({
        error: "O bot não está em nenhum servidor. Adicione o bot a um servidor Discord primeiro.",
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Coletar membros únicos até atingir targetCount
    const recipients = new Map<string, string>();
    let memberFetchFailed = false;
    outer: for (const s of servers) {
      let after = "0";
      while (true) {
        const r = await discordReq(`/guilds/${s.guild_id}/members?limit=1000&after=${after}`);
        if (!r.ok) {
          const txt = await r.text();
          console.error(`members fetch failed for ${s.guild_id}`, r.status, txt);
          if (r.status === 403) memberFetchFailed = true;
          break;
        }
        const members = await r.json() as Array<{ user: { id: string; bot?: boolean } }>;
        if (!members.length) break;
        for (const m of members) {
          if (m.user.bot) continue;
          if (!recipients.has(m.user.id)) {
            recipients.set(m.user.id, s.guild_id);
            if (recipients.size >= targetCount) break outer;
          }
        }
        after = members[members.length - 1].user.id;
        if (members.length < 1000) break;
      }
    }

    const targets = Array.from(recipients.entries());
    const targeted = targets.length;
    if (targeted === 0) {
      const reason = memberFetchFailed
        ? "O bot não tem o intent 'SERVER MEMBERS' habilitado no Discord Developer Portal. Ative ele para conseguir listar membros."
        : `A rede tem ${servers.length} servidor(es), mas nenhum membro humano foi encontrado. Adicione o bot a servidores maiores.`;
      await admin.from("campaigns").update({ status: "failed", error_message: reason }).eq("id", campaign_id);
      return new Response(JSON.stringify({ error: reason }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    await admin.from("campaigns").update({ total_targeted: targeted }).eq("id", campaign_id);

    const trackBase = `${SUPABASE_URL}/functions/v1/track-click`;
    let delivered = 0;
    const failBuckets = { blocked: 0, dm_closed: 0, deleted: 0, other: 0 };

    for (const [discordId, guildId] of targets) {
      try {
        const dmRes = await discordReq("/users/@me/channels", { method: "POST", body: JSON.stringify({ recipient_id: discordId }) });
        if (!dmRes.ok) {
          const txt = await dmRes.text();
          const cls = classifyError(dmRes.status, txt);
          failBuckets[cls.bucket]++;
          await admin.from("campaign_deliveries").insert({
            campaign_id, user_id: userId, recipient_discord_id: discordId, guild_id: guildId,
            status: "failed", failure_reason: cls.reason, error_message: txt.slice(0, 200),
          });
          continue;
        }
        const dm = await dmRes.json();

        const embed: any = { color: hexToInt(campaign.embed_color || "#5865F2") };
        if (campaign.title) embed.title = campaign.title;
        if (campaign.message) embed.description = campaign.message;
        if (campaign.image_url) embed.image = { url: campaign.image_url };

        const components: any[] = [];
        if (campaign.button_url && campaign.button_label) {
          const trackUrl = `${trackBase}?d=${encodeURIComponent(campaign_id)}&r=${encodeURIComponent(discordId)}`;
          components.push({ type: 1, components: [{ type: 2, style: 5, label: campaign.button_label.slice(0, 80), url: trackUrl }] });
        }

        const sendRes = await discordReq(`/channels/${dm.id}/messages`, { method: "POST", body: JSON.stringify({ embeds: [embed], components }) });
        if (sendRes.ok) {
          delivered++;
          await admin.from("campaign_deliveries").insert({
            campaign_id, user_id: userId, recipient_discord_id: discordId, guild_id: guildId,
            status: "delivered", delivered_at: new Date().toISOString(),
          });
        } else {
          const txt = await sendRes.text();
          const cls = classifyError(sendRes.status, txt);
          // Se canal abriu mas mensagem foi recusada com 50007, é bloqueio efetivo
          if (txt.includes("50007")) { failBuckets.blocked++; cls.bucket = "blocked"; cls.reason = "blocked_bot"; }
          else failBuckets[cls.bucket]++;
          await admin.from("campaign_deliveries").insert({
            campaign_id, user_id: userId, recipient_discord_id: discordId, guild_id: guildId,
            status: "failed", failure_reason: cls.reason, error_message: txt.slice(0, 200),
          });
        }
      } catch (e) {
        failBuckets.other++;
        const msg = e instanceof Error ? e.message : "unknown";
        await admin.from("campaign_deliveries").insert({
          campaign_id, user_id: userId, recipient_discord_id: discordId, guild_id: guildId,
          status: "failed", failure_reason: "exception", error_message: msg.slice(0, 200),
        });
      }
      await new Promise((r) => setTimeout(r, 80));
    }

    const totalFailed = failBuckets.blocked + failBuckets.dm_closed + failBuckets.deleted + failBuckets.other;
    const coinsSpent = Math.ceil(delivered / 10);
    const newBalance = profile.credits - coinsSpent;

    await admin.from("profiles").update({ credits: newBalance }).eq("id", userId);
    if (coinsSpent > 0) {
      await admin.from("credit_transactions").insert({
        user_id: userId, amount: -coinsSpent, type: "campaign_spend",
        description: `Campanha: ${campaign.name} (${delivered} DMs)`, campaign_id, balance_after: newBalance,
      });
    }

    await admin.from("campaigns").update({
      status: "sent", sent_at: new Date().toISOString(),
      total_delivered: delivered, total_failed: totalFailed,
      failed_blocked: failBuckets.blocked, failed_dm_closed: failBuckets.dm_closed,
      failed_deleted: failBuckets.deleted, failed_other: failBuckets.other,
      credits_spent: coinsSpent, error_message: null,
    }).eq("id", campaign_id);

    return new Response(JSON.stringify({ success: true, targeted, delivered, failed: totalFailed, breakdown: failBuckets, coins_spent: coinsSpent }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("send-campaign error", err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

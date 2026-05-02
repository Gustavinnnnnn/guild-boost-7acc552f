// Dispara DMs para os membros do servidor do usuário usando o BOT DELE.
// Limite: 3 disparos/dia.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const DAILY_LIMIT = 3;

async function fetchAllMembers(token: string, guildId: string, max = 5000) {
  const out: any[] = [];
  let after = "0";
  let page = 0;
  while (out.length < max && page < 20) {
    const url = `https://discord.com/api/v10/guilds/${guildId}/members?limit=1000&after=${after}`;
    const r = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error(`[fetchMembers] HTTP ${r.status}:`, errText);
      // 401/403 geralmente = falta intent ou bot fora do servidor
      return { members: out, error: r.status, errorBody: errText };
    }
    const batch = await r.json() as any[];
    if (!Array.isArray(batch) || !batch.length) break;
    out.push(...batch);
    after = batch[batch.length - 1].user.id;
    page++;
    if (batch.length < 1000) break;
    await new Promise(r => setTimeout(r, 500)); // gentle pacing
  }
  return { members: out.filter(m => !m.user?.bot), error: null };
}

async function dmUser(token: string, userId: string, embed: any, components: any[]) {
  // 1) Cria DM channel
  const ch = await fetch("https://discord.com/api/v10/users/@me/channels", {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!ch.ok) return { ok: false, code: ch.status, stage: "channel" };
  const channel = await ch.json();

  // 2) Envia mensagem
  const msg = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed], components }),
  });
  return { ok: msg.ok, code: msg.status, stage: "message" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "no_auth" }, 401);

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthenticated" }, 401);

    const { data: bot } = await supa.from("user_bots").select("*").eq("user_id", user.id).maybeSingle();
    if (!bot) return json({ error: "no_bot", message: "Conecte seu bot primeiro." }, 400);
    if (!bot.guild_id || !bot.bot_token) return json({ error: "no_guild", message: "Selecione o servidor onde o bot está." }, 400);

    // Limite diário
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supa.from("bot_broadcasts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id).gte("created_at", since);
    if ((count ?? 0) >= DAILY_LIMIT) {
      return json({ error: "daily_limit", message: `Você atingiu o limite de ${DAILY_LIMIT} divulgações nas últimas 24h.` }, 429);
    }

    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "").slice(0, 256);
    const message = String(body.message || "").slice(0, 4000);
    const image_url = body.image_url || null;
    const button_label = body.button_label || null;
    const button_url = body.button_url || null;
    const embed_color = body.embed_color || "#5865F2";
    if (!message) return json({ error: "missing_message", message: "Escreva a mensagem." }, 400);

    // Cria registro
    const { data: bc, error: bcErr } = await supa.from("bot_broadcasts").insert({
      user_id: user.id, user_bot_id: bot.id, guild_id: bot.guild_id,
      title, message, image_url, button_label, button_url, embed_color, status: "sending",
    }).select().single();
    if (bcErr) return json({ error: bcErr.message }, 400);

    // Lista membros
    console.log(`[broadcast ${bc.id}] fetching members of guild ${bot.guild_id}`);
    const { members, error: memErr, errorBody } = await fetchAllMembers(bot.bot_token, bot.guild_id, 5000);

    if (memErr || !members.length) {
      const detailMsg = memErr === 401 || memErr === 403
        ? "O bot não tem permissão. Ative SERVER MEMBERS INTENT no Discord Developer Portal e dê role com permissão de ler membros."
        : memErr
          ? `Discord respondeu HTTP ${memErr}. Verifique se o bot ainda está no servidor.`
          : "Não consegui listar membros. Ative SERVER MEMBERS INTENT no Discord Developer Portal.";

      await supa.from("bot_broadcasts").update({
        status: "failed",
        finished_at: new Date().toISOString(),
      }).eq("id", bc.id);

      return json({
        error: "no_members",
        message: detailMsg,
        debug: { discord_status: memErr, body: errorBody?.slice(0, 200) },
      }, 400);
    }

    console.log(`[broadcast ${bc.id}] ${members.length} members ready`);
    await supa.from("bot_broadcasts").update({ total_targeted: members.length }).eq("id", bc.id);

    const colorInt = parseInt(String(embed_color).replace("#", ""), 16) || 0x5865F2;
    const embed: any = { description: message, color: colorInt };
    if (title) embed.title = title;
    if (image_url) embed.image = { url: image_url };

    const components = button_label && button_url
      ? [{ type: 1, components: [{ type: 2, style: 5, label: String(button_label).slice(0, 80), url: button_url }] }]
      : [];

    // Dispara em background
    const work = (async () => {
      let delivered = 0, failed = 0;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        try {
          const r = await dmUser(bot.bot_token, m.user.id, embed, components);
          if (r.ok) delivered++; else { failed++;
            if (i < 3) console.log(`[broadcast ${bc.id}] fail ${r.stage} ${r.code} for ${m.user.id}`);
          }
        } catch (e) { failed++; }

        // Update a cada 5
        if ((i + 1) % 5 === 0 || i === members.length - 1) {
          await supa.from("bot_broadcasts").update({
            total_delivered: delivered, total_failed: failed,
          }).eq("id", bc.id);
        }
        await new Promise(r => setTimeout(r, 1100)); // rate-limit safe (~55/min)
      }
      await supa.from("bot_broadcasts").update({
        status: "sent", total_delivered: delivered, total_failed: failed,
        finished_at: new Date().toISOString(),
      }).eq("id", bc.id);

      // Atualiza totais agregados no bot
      const { data: fresh } = await supa.from("user_bots").select("total_broadcasts,total_dms_sent,total_dms_failed").eq("id", bot.id).single();
      await supa.from("user_bots").update({
        total_broadcasts: (fresh?.total_broadcasts ?? 0) + 1,
        total_dms_sent: (fresh?.total_dms_sent ?? 0) + delivered,
        total_dms_failed: (fresh?.total_dms_failed ?? 0) + failed,
      }).eq("id", bot.id);
      console.log(`[broadcast ${bc.id}] DONE delivered=${delivered} failed=${failed}`);
    })();
    // @ts-ignore
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(work);

    return json({ success: true, broadcast_id: bc.id, total_targeted: members.length });
  } catch (e) {
    console.error("user-bot-broadcast fatal:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

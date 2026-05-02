// Dispara DMs em massa usando uma CONTA DE USUÁRIO Discord (selfbot).
// ⚠️ Viola os ToS do Discord. Conta pode ser banida permanentemente.
//
// Fluxo:
// 1. Lê selfbot do usuário (token + guild selecionado)
// 2. Lista membros do guild via /guilds/{id}/members
// 3. Cria broadcast no banco
// 4. Em background (EdgeRuntime.waitUntil): para cada membro, abre DM e manda mensagem com delay
// 5. Atualiza contadores no fim
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function discordFetch(url: string, token: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: token, "Content-Type": "application/json" },
  });
}

async function listGuildMembers(token: string, guildId: string, max = 1000): Promise<string[]> {
  const ids: string[] = [];
  let after = "0";
  while (ids.length < max) {
    const limit = Math.min(1000, max - ids.length);
    const res = await discordFetch(`https://discord.com/api/v9/guilds/${guildId}/members?limit=${limit}&after=${after}`, token);
    if (!res.ok) break;
    const batch = await res.json() as any[];
    if (!batch.length) break;
    for (const m of batch) {
      if (m.user && !m.user.bot) ids.push(m.user.id);
    }
    after = batch[batch.length - 1].user?.id ?? after;
    if (batch.length < limit) break;
    await sleep(500); // gentil com rate limit
  }
  return ids;
}

async function sendDM(token: string, recipientId: string, message: string): Promise<boolean> {
  // 1) abre DM channel
  const ch = await discordFetch("https://discord.com/api/v9/users/@me/channels", token, {
    method: "POST",
    body: JSON.stringify({ recipient_id: recipientId }),
  });
  if (!ch.ok) return false;
  const channel = await ch.json();
  // 2) manda mensagem
  const msg = await discordFetch(`https://discord.com/api/v9/channels/${channel.id}/messages`, token, {
    method: "POST",
    body: JSON.stringify({ content: message }),
  });
  return msg.ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "no_auth" }, 401);
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthenticated" }, 401);

    // Restrito a admin
    const { data: roles } = await supa.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roles) return json({ error: "forbidden", detail: "Acesso restrito ao administrador." }, 403);

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim();
    const delay = Math.max(3, Math.min(120, Number(body.delay_seconds) || 10));
    const targetCount = Math.max(1, Math.min(500, Number(body.target_count) || 100));

    if (!message || message.length < 5) return json({ error: "message_too_short" }, 400);
    if (message.length > 2000) return json({ error: "message_too_long" }, 400);

    const { data: sb } = await supa.from("user_selfbots").select("*").eq("user_id", user.id).maybeSingle();
    if (!sb || !sb.user_token) return json({ error: "no_account", detail: "Conecte uma conta primeiro." }, 400);
    if (!sb.selected_guild_id) return json({ error: "no_guild", detail: "Escolha um servidor primeiro." }, 400);

    // Cria broadcast em sending
    const { data: bc, error: bcErr } = await supa.from("selfbot_broadcasts").insert({
      user_id: user.id,
      selfbot_id: sb.id,
      guild_id: sb.selected_guild_id,
      guild_name: sb.selected_guild_name,
      message,
      delay_seconds: delay,
      status: "sending",
      total_targeted: 0,
    }).select().single();
    if (bcErr) return json({ error: bcErr.message }, 400);

    // Roda em background pra não estourar timeout da edge
    const work = (async () => {
      try {
        const members = await listGuildMembers(sb.user_token, sb.selected_guild_id, targetCount);
        await supa.from("selfbot_broadcasts").update({ total_targeted: members.length }).eq("id", bc.id);

        let sent = 0, failed = 0;
        for (const id of members) {
          const ok = await sendDM(sb.user_token, id, message);
          if (ok) sent++; else failed++;
          // atualiza periodicamente
          if ((sent + failed) % 5 === 0) {
            await supa.from("selfbot_broadcasts").update({ total_sent: sent, total_failed: failed }).eq("id", bc.id);
          }
          await sleep(delay * 1000);
        }

        await supa.from("selfbot_broadcasts").update({
          total_sent: sent, total_failed: failed,
          status: "done", finished_at: new Date().toISOString(),
        }).eq("id", bc.id);

        await supa.from("user_selfbots").update({
          total_broadcasts: (sb.total_broadcasts || 0) + 1,
          total_dms_sent: (sb.total_dms_sent || 0) + sent,
          total_dms_failed: (sb.total_dms_failed || 0) + failed,
        }).eq("id", sb.id);
      } catch (err) {
        await supa.from("selfbot_broadcasts").update({
          status: "error",
          error_message: err instanceof Error ? err.message : "unknown",
          finished_at: new Date().toISOString(),
        }).eq("id", bc.id);
      }
    })();

    // @ts-ignore - EdgeRuntime existe no Supabase Edge
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
    else work.catch(console.error);

    return json({ success: true, broadcast_id: bc.id });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

// Conecta uma CONTA DE USUÁRIO Discord (selfbot) — valida o token e lista guilds.
// ⚠️ Selfbot viola os ToS do Discord. Risco de ban da conta.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
    const action = body.action || "connect";

    if (action === "disconnect") {
      await supa.from("user_selfbots").delete().eq("user_id", user.id);
      return json({ success: true });
    }

    if (action === "list_guilds") {
      const { data: existing } = await supa.from("user_selfbots").select("user_token").eq("user_id", user.id).maybeSingle();
      if (!existing?.user_token) return json({ error: "no_account" }, 400);
      const gRes = await fetch("https://discord.com/api/v9/users/@me/guilds?with_counts=true", {
        headers: { Authorization: existing.user_token },
      });
      if (!gRes.ok) return json({ error: "discord_error", detail: "Token inválido ou expirado." }, 400);
      const guilds = await gRes.json();
      return json({
        success: true,
        guilds: (guilds as any[]).map((g) => ({
          id: g.id, name: g.name,
          member_count: g.approximate_member_count || 0,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        })),
      });
    }

    if (action === "select_guild") {
      const { guild_id, guild_name, guild_member_count } = body;
      const { data, error } = await supa.from("user_selfbots").update({
        selected_guild_id: guild_id,
        selected_guild_name: guild_name,
        selected_guild_member_count: guild_member_count || 0,
      }).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, selfbot: { ...data, user_token: undefined } });
    }

    if (action === "clear_guild") {
      const { data, error } = await supa.from("user_selfbots").update({
        selected_guild_id: null, selected_guild_name: null, selected_guild_member_count: 0,
      }).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, selfbot: { ...data, user_token: undefined } });
    }

    // action === "connect"
    const token = String(body.token || "").trim();
    if (!token || token.length < 50) return json({ error: "invalid_token" }, 400);

    // Valida em /users/@me com header de USUÁRIO (sem "Bot ")
    const meRes = await fetch("https://discord.com/api/v9/users/@me", {
      headers: { Authorization: token },
    });
    if (!meRes.ok) {
      return json({ error: "discord_unauthorized", detail: "Token inválido. Pegue o token da CONTA (não do bot) no DevTools → Network → header Authorization." }, 400);
    }
    const me = await meRes.json();

    const gRes = await fetch("https://discord.com/api/v9/users/@me/guilds?with_counts=true", {
      headers: { Authorization: token },
    });
    const guilds = gRes.ok ? await gRes.json() : [];

    const avatar = me.avatar
      ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png`
      : null;
    const username = `${me.username}${me.discriminator && me.discriminator !== "0" ? "#" + me.discriminator : ""}`;

    const { data: existing } = await supa.from("user_selfbots").select("id").eq("user_id", user.id).maybeSingle();
    const payload = {
      user_id: user.id,
      user_token: token,
      discord_user_id: me.id,
      discord_username: username,
      discord_avatar_url: avatar,
    };
    let selfbot;
    if (existing) {
      const { data, error } = await supa.from("user_selfbots").update(payload).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      selfbot = data;
    } else {
      const { data, error } = await supa.from("user_selfbots").insert(payload).select().single();
      if (error) return json({ error: error.message }, 400);
      selfbot = data;
    }

    return json({
      success: true,
      selfbot: { ...selfbot, user_token: undefined },
      guilds: (guilds as any[]).map((g) => ({
        id: g.id, name: g.name,
        member_count: g.approximate_member_count || 0,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      })),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

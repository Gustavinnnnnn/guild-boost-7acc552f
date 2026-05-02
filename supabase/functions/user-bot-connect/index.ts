// Conecta o bot do usuário: valida o token chamando a Discord API e
// lista os servidores em que esse bot está. Salva tudo na tabela user_bots.
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

    const body = await req.json().catch(() => ({}));
    const action = body.action || "connect";

    if (action === "disconnect") {
      await supa.from("user_bots").delete().eq("user_id", user.id);
      return json({ success: true });
    }

    if (action === "list_guilds") {
      const { data: existing } = await supa.from("user_bots").select("bot_token").eq("user_id", user.id).maybeSingle();
      if (!existing?.bot_token) return json({ error: "no_bot" }, 400);
      const gRes = await fetch("https://discord.com/api/v10/users/@me/guilds?with_counts=true", {
        headers: { Authorization: `Bot ${existing.bot_token}` },
      });
      if (!gRes.ok) return json({ error: "discord_error", detail: "Não foi possível listar servidores." }, 400);
      const guilds = await gRes.json();
      return json({
        success: true,
        guilds: (guilds as any[]).map(g => ({
          id: g.id, name: g.name, member_count: g.approximate_member_count || 0,
          icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
        })),
      });
    }

    if (action === "clear_guild") {
      const { data, error } = await supa.from("user_bots").update({
        guild_id: null, guild_name: null, guild_member_count: 0,
      }).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, bot: data });
    }

    if (action === "select_guild") {
      const { guild_id, guild_name, guild_member_count } = body;
      const { data, error } = await supa.from("user_bots").update({
        guild_id, guild_name, guild_member_count: guild_member_count || 0,
      }).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      return json({ success: true, bot: data });
    }

    // action === "connect": valida token + lista guilds
    const token = String(body.token || "").trim();
    if (!token || token.length < 50) return json({ error: "invalid_token" }, 400);

    // 1) /users/@me
    const meRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!meRes.ok) {
      return json({ error: "discord_unauthorized", detail: "Token inválido. Confira em https://discord.com/developers/applications" }, 400);
    }
    const me = await meRes.json();

    // 2) /users/@me/guilds
    const gRes = await fetch("https://discord.com/api/v10/users/@me/guilds?with_counts=true", {
      headers: { Authorization: `Bot ${token}` },
    });
    const guilds = gRes.ok ? await gRes.json() : [];

    const botAvatar = me.avatar
      ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png`
      : null;

    // Upsert
    const { data: existing } = await supa.from("user_bots").select("*").eq("user_id", user.id).maybeSingle();
    const payload = {
      user_id: user.id,
      bot_token: token,
      bot_id: me.id,
      bot_username: `${me.username}${me.discriminator && me.discriminator !== "0" ? "#" + me.discriminator : ""}`,
      bot_avatar_url: botAvatar,
      access_paid: true,
      access_paid_at: new Date().toISOString(),
    };
    let bot;
    if (existing) {
      const { data, error } = await supa.from("user_bots").update(payload).eq("user_id", user.id).select().single();
      if (error) return json({ error: error.message }, 400);
      bot = data;
    } else {
      const { data, error } = await supa.from("user_bots").insert(payload).select().single();
      if (error) return json({ error: error.message }, 400);
      bot = data;
    }

    return json({
      success: true,
      bot: { ...bot, bot_token: undefined },
      guilds: (guilds as any[]).map(g => ({
        id: g.id, name: g.name, member_count: g.approximate_member_count || 0,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      })),
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

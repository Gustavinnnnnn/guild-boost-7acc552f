import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

// Admin envia mensagem em um canal de algum servidor onde o bot está.
// Body: { guild_id, channel_id, content, embed?: { title, description, color, image_url, button_url, button_label } }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!DISCORD_BOT_TOKEN) return new Response(JSON.stringify({ error: "Bot token missing" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!userData?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action } = body;

    if (action === "list_guilds") {
      const r = await fetch("https://discord.com/api/v10/users/@me/guilds?limit=200", {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      });
      if (!r.ok) return new Response(JSON.stringify({ error: "discord_fail", detail: await r.text() }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const guilds = await r.json();
      return new Response(JSON.stringify({ success: true, guilds }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list_channels") {
      const { guild_id } = body;
      if (!guild_id) return new Response(JSON.stringify({ error: "guild_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const r = await fetch(`https://discord.com/api/v10/guilds/${guild_id}/channels`, {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      });
      if (!r.ok) return new Response(JSON.stringify({ error: "discord_fail", detail: await r.text() }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const channels = (await r.json()).filter((c: any) => c.type === 0 || c.type === 5); // text + announcement
      return new Response(JSON.stringify({ success: true, channels }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "send_message") {
      const { channel_id, content, embed } = body;
      if (!channel_id || (!content && !embed)) return new Response(JSON.stringify({ error: "channel_id + content or embed required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const payload: any = {};
      if (content) payload.content = String(content).slice(0, 2000);
      if (embed) {
        const e: any = {};
        if (embed.title) e.title = String(embed.title).slice(0, 256);
        if (embed.description) e.description = String(embed.description).slice(0, 4000);
        if (embed.image_url) e.image = { url: embed.image_url };
        if (embed.color) {
          const hex = String(embed.color).replace("#", "");
          e.color = parseInt(hex, 16) || 0x5865F2;
        }
        payload.embeds = [e];
        if (embed.button_url && embed.button_label) {
          payload.components = [{
            type: 1,
            components: [{ type: 2, style: 5, label: String(embed.button_label).slice(0, 80), url: embed.button_url }],
          }];
        }
      }

      const r = await fetch(`https://discord.com/api/v10/channels/${channel_id}/messages`, {
        method: "POST",
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const detail = await r.text();
        return new Response(JSON.stringify({ error: "discord_send_fail", detail }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const msg = await r.json();
      return new Response(JSON.stringify({ success: true, message_id: msg.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

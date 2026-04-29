import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;

// Permission bit for ADMINISTRATOR
const ADMIN_PERMISSION = 0x8n;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await admin
      .from("profiles")
      .select("discord_access_token, discord_token_expires_at")
      .eq("id", userId)
      .single();

    if (!profile?.discord_access_token) {
      return new Response(JSON.stringify({ error: "discord_not_connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's guilds from Discord
    const guildsRes = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${profile.discord_access_token}` },
    });

    if (!guildsRes.ok) {
      const err = await guildsRes.text();
      console.error("Discord guilds fetch failed:", err);
      return new Response(JSON.stringify({ error: "discord_api_error", details: err }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const guilds: any[] = await guildsRes.json();

    // Filter only guilds where user is owner OR has admin
    const owned = guilds.filter((g) => {
      if (g.owner) return true;
      try {
        const perms = BigInt(g.permissions);
        return (perms & ADMIN_PERMISSION) === ADMIN_PERMISSION;
      } catch {
        return false;
      }
    });

    // Check which ones already have the bot installed
    const enriched = await Promise.all(
      owned.map(async (g) => {
        let botInServer = false;
        try {
          const r = await fetch(`https://discord.com/api/guilds/${g.id}`, {
            headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
          });
          botInServer = r.ok;
        } catch {}
        return {
          guild_id: g.id,
          name: g.name,
          icon_url: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
          bot_in_server: botInServer,
        };
      })
    );

    return new Response(JSON.stringify({ guilds: enriched }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

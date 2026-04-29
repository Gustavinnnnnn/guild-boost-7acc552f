import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;

function hexToInt(hex: string): number {
  return parseInt(hex.replace("#", ""), 16) || 0x5865f2;
}

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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub;

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: campaign, error: cErr } = await admin
      .from("campaigns")
      .select("*, discord_servers(guild_id, name)")
      .eq("id", campaign_id)
      .eq("user_id", userId)
      .single();

    if (cErr || !campaign) {
      return new Response(JSON.stringify({ error: "campaign_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!campaign.channel_id) {
      return new Response(JSON.stringify({ error: "no_channel_selected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build embed
    const embed: any = {
      description: campaign.message,
      color: hexToInt(campaign.embed_color || "#5865F2"),
    };
    if (campaign.image_url) embed.image = { url: campaign.image_url };

    const dRes = await fetch(`https://discord.com/api/channels/${campaign.channel_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!dRes.ok) {
      const errText = await dRes.text();
      console.error("Discord send failed:", errText);
      await admin.from("campaigns").update({
        status: "failed",
        error_message: errText.slice(0, 500),
      }).eq("id", campaign_id);
      return new Response(JSON.stringify({ error: "discord_send_failed", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("campaigns").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      error_message: null,
    }).eq("id", campaign_id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

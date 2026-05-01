import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_BOT_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verifica se é admin
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Métricas
    const [
      { count: totalUsers },
      { count: totalServers },
      { count: totalCampaigns },
      { data: campaignsAgg },
      { data: depositsAgg },
      { data: recentCampaigns },
      { data: recentUsers },
    ] = await Promise.all([
      admin.from("profiles").select("*", { count: "exact", head: true }),
      admin.from("discord_servers").select("*", { count: "exact", head: true }),
      admin.from("campaigns").select("*", { count: "exact", head: true }),
      admin.from("campaigns").select("total_delivered, total_targeted, total_clicks, credits_spent, status"),
      admin.from("pending_deposits").select("amount_cents, coins, status, created_at"),
      admin.from("campaigns").select("id, name, status, total_delivered, total_targeted, credits_spent, created_at, user_id, profiles:user_id(username, avatar_url)").order("created_at", { ascending: false }).limit(15),
      admin.from("profiles").select("id, username, avatar_url, credits, discord_username, created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const totalDelivered = (campaignsAgg ?? []).reduce((s, c: any) => s + (c.total_delivered ?? 0), 0);
    const totalClicks = (campaignsAgg ?? []).reduce((s, c: any) => s + (c.total_clicks ?? 0), 0);
    const totalCreditsSpent = (campaignsAgg ?? []).reduce((s, c: any) => s + (c.credits_spent ?? 0), 0);
    const activeCampaigns = (campaignsAgg ?? []).filter((c: any) => c.status === "sending").length;

    const paidDeposits = (depositsAgg ?? []).filter((d: any) => d.status === "paid");
    const totalRevenueCents = paidDeposits.reduce((s, d: any) => s + (d.amount_cents ?? 0), 0);
    const totalCoinsSold = paidDeposits.reduce((s, d: any) => s + (d.coins ?? 0), 0);

    // Bot guilds (quantos servidores nosso bot está)
    let botGuildsCount: number | null = null;
    if (DISCORD_BOT_TOKEN) {
      try {
        const r = await fetch("https://discord.com/api/v10/users/@me/guilds?limit=200", {
          headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
        });
        if (r.ok) botGuildsCount = (await r.json()).length;
      } catch (e) { console.error("bot guilds fail", e); }
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers: totalUsers ?? 0,
        totalServersInNetwork: totalServers ?? 0,
        botGuildsCount,
        totalCampaigns: totalCampaigns ?? 0,
        activeCampaigns,
        totalDelivered,
        totalClicks,
        totalCreditsSpent,
        totalRevenueCents,
        totalCoinsSold,
        paidDepositsCount: paidDeposits.length,
      },
      recentCampaigns: recentCampaigns ?? [],
      recentUsers: recentUsers ?? [],
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

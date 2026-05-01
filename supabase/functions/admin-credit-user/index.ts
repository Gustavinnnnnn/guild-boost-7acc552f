import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Admin check
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === "search_users") {
      const q = (body.q as string || "").trim();
      let query = admin.from("profiles").select("id, username, avatar_url, credits, discord_username, discord_id, created_at").order("created_at", { ascending: false }).limit(20);
      if (q) {
        query = admin.from("profiles").select("id, username, avatar_url, credits, discord_username, discord_id, created_at").or(`username.ilike.%${q}%,discord_username.ilike.%${q}%,discord_id.ilike.%${q}%`).limit(20);
      }
      const { data, error } = await query;
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, users: data ?? [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "adjust_credits") {
      const targetUserId = body.user_id as string;
      const amount = Number(body.amount); // pode ser negativo
      const description = (body.description as string || "Ajuste manual pelo admin").slice(0, 200);
      if (!targetUserId || !Number.isFinite(amount) || amount === 0) {
        return new Response(JSON.stringify({ error: "Parâmetros inválidos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const intAmount = Math.trunc(amount);
      if (Math.abs(intAmount) > 10_000_000) {
        return new Response(JSON.stringify({ error: "Valor muito alto" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: profile, error: pErr } = await admin.from("profiles").select("id, username, credits").eq("id", targetUserId).maybeSingle();
      if (pErr || !profile) {
        return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const newBalance = (profile.credits ?? 0) + intAmount;
      if (newBalance < 0) {
        return new Response(JSON.stringify({ error: `Saldo ficaria negativo (atual: ${profile.credits})` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: upErr } = await admin.from("profiles").update({ credits: newBalance }).eq("id", targetUserId);
      if (upErr) throw upErr;

      await admin.from("credit_transactions").insert({
        user_id: targetUserId,
        amount: intAmount,
        balance_after: newBalance,
        type: intAmount > 0 ? "admin_credit" : "admin_debit",
        description: `[admin:${userData.user.email ?? userData.user.id}] ${description}`,
      });

      return new Response(JSON.stringify({
        success: true,
        user: { id: profile.id, username: profile.username, previous_credits: profile.credits, new_credits: newBalance },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error(msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PARADISE_API_KEY = Deno.env.get("PARADISE_API_KEY")!;

const PARADISE_URL = "https://multi.paradisepags.com/api/v1/transaction.php";

// 1 coin = 1 DM · 1 coin = R$ 0,05 → 5 centavos
const CENTS_PER_COIN = 5;
const MIN_COINS = 600; // R$ 30,00 mínimo

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const userEmail = userData.user.email ?? "user@coinsdm.com";

    const body = await req.json();
    const coins = Math.floor(Number(body.coins));
    const bonus = Math.max(0, Math.floor(Number(body.bonus ?? 0)));
    if (!coins || coins < MIN_COINS || coins > 1_000_000) {
      return new Response(JSON.stringify({ error: "invalid_amount", message: `Mínimo ${MIN_COINS} DMs (R$ 25,00)` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amountCents = coins * CENTS_PER_COIN;
    const totalCoins = coins + bonus;
    const reference = `dep_${userId.slice(0, 8)}_${Date.now()}`;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await admin.from("profiles").select("username").eq("id", userId).single();
    const customerName = profile?.username || "Cliente CoinsDM";

    // Cria transação na Paradise
    const paradiseRes = await fetch(PARADISE_URL, {
      method: "POST",
      headers: {
        "X-API-Key": PARADISE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountCents,
        description: `${totalCoins} DMs CoinsDM`,
        reference,
        source: "api_externa",
        customer: {
          name: customerName,
          email: userEmail,
          document: "00000000000",
          phone: "11999999999",
        },
      }),
    });

    const paradiseData = await paradiseRes.json();
    if (!paradiseRes.ok || paradiseData.status !== "success") {
      console.error("Paradise error:", paradiseData);
      return new Response(JSON.stringify({ error: "gateway_error", details: paradiseData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Salva depósito pendente
    const { error: insErr } = await admin.from("pending_deposits").insert({
      user_id: userId,
      reference,
      paradise_transaction_id: String(paradiseData.transaction_id),
      coins: totalCoins,
      amount_cents: amountCents,
      status: "pending",
      qr_code: paradiseData.qr_code,
      qr_code_base64: paradiseData.qr_code_base64,
      expires_at: paradiseData.expires_at ? new Date(paradiseData.expires_at).toISOString() : null,
    });
    if (insErr) console.error("Insert error:", insErr);

    return new Response(JSON.stringify({
      success: true,
      reference,
      transaction_id: paradiseData.transaction_id,
      qr_code: paradiseData.qr_code,
      qr_code_base64: paradiseData.qr_code_base64,
      amount_cents: amountCents,
      coins: totalCoins,
      expires_at: paradiseData.expires_at,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("create-pix-deposit error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

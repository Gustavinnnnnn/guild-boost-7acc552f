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

// 1 coin = 1 DM · 1 coin = R$ 0,20 → 20 centavos
const CENTS_PER_COIN = 20;
const MIN_COINS = 50; // mínimo do plano BÁSICO

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

    // Plans: fixed price → fixed coins (DMs)
    const PLANS: Record<string, { cents: number; coins: number; label: string }> = {
      basico: { cents: 1900, coins: 90,  label: "Plano Básico" },
      pro:    { cents: 3900, coins: 220, label: "Plano PRO" },
      elite:  { cents: 7900, coins: 500, label: "Plano Elite" },
    };

    let amountCents: number;
    let totalCoins: number;
    let planLabel: string;

    if (body.plan && PLANS[body.plan]) {
      const p = PLANS[body.plan];
      amountCents = p.cents;
      totalCoins  = p.coins;
      planLabel   = p.label;
    } else {
      const coins = Math.floor(Number(body.coins));
      const bonus = Math.max(0, Math.floor(Number(body.bonus ?? 0)));
      if (!coins || coins < MIN_COINS || coins > 1_000_000) {
        return new Response(JSON.stringify({ error: "invalid_amount", message: `Mínimo ${MIN_COINS} DMs` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      amountCents = coins * CENTS_PER_COIN;
      totalCoins  = coins + bonus;
      planLabel   = `${totalCoins} DMs`;
    }

    const reference = `dep_${userId.slice(0, 8)}_${Date.now()}`;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile } = await admin.from("profiles").select("username").eq("id", userId).single();
    const customerName = profile?.username || "Cliente CoinsDM";

    // Cria transação na Paradise — com retry (gateway às vezes responde 502)
    const callParadise = async () => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 18000);
      try {
        return await fetch(PARADISE_URL, {
          method: "POST",
          headers: {
            "X-API-Key": PARADISE_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountCents,
            description: `${planLabel} — ${totalCoins} DMs`,
            reference,
            source: "api_externa",
            customer: {
              name: customerName,
              email: userEmail,
              document: "00000000000",
              phone: "11999999999",
            },
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(t);
      }
    };

    let paradiseRes: Response | null = null;
    let paradiseData: any = null;
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        paradiseRes = await callParadise();
        paradiseData = await paradiseRes.json().catch(() => ({}));
        if (paradiseRes.ok) break;
        console.warn(`Paradise attempt ${attempt} failed:`, paradiseRes.status);
      } catch (e) {
        lastErr = e;
        console.warn(`Paradise attempt ${attempt} error:`, e);
      }
      if (attempt < 2) await new Promise(r => setTimeout(r, 600));
    }

    if (!paradiseRes || !paradiseData) {
      console.error("Paradise unreachable:", lastErr);
      return new Response(JSON.stringify({ error: "gateway_unreachable", message: "Gateway PIX indisponível. Tente em alguns segundos." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    // Paradise pode retornar campos com nomes diferentes — normaliza
    const pixCode =
      paradiseData.pix_code ||
      paradiseData.qr_code ||
      paradiseData.qrcode ||
      paradiseData.qr_code_text ||
      paradiseData.copy_paste ||
      paradiseData.emv ||
      paradiseData.payment?.pix_code ||
      paradiseData.payment?.qr_code ||
      paradiseData.data?.pix_code ||
      paradiseData.data?.qr_code ||
      "";

    const pixBase64 =
      paradiseData.qr_code_base64 ||
      paradiseData.qr_code_image ||
      paradiseData.qrcode_base64 ||
      paradiseData.payment?.qr_code_base64 ||
      paradiseData.data?.qr_code_base64 ||
      "";

    const txId =
      paradiseData.transaction_id ||
      paradiseData.id ||
      paradiseData.data?.transaction_id ||
      paradiseData.data?.id;

    const expiresAt =
      paradiseData.expires_at ||
      paradiseData.expiration ||
      paradiseData.payment?.expires_at ||
      paradiseData.data?.expires_at ||
      null;

    const isOk =
      paradiseRes.ok &&
      (paradiseData.status === "success" ||
        paradiseData.status === "pending" ||
        paradiseData.success === true ||
        !!pixCode);

    if (!isOk || !pixCode) {
      console.error("Paradise error:", paradiseData);
      return new Response(JSON.stringify({ error: "gateway_error", details: paradiseData }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Salva depósito pendente
    const { error: insErr } = await admin.from("pending_deposits").insert({
      user_id: userId,
      reference,
      paradise_transaction_id: String(txId ?? reference),
      coins: totalCoins,
      amount_cents: amountCents,
      status: "pending",
      qr_code: pixCode,
      qr_code_base64: pixBase64,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    if (insErr) console.error("Insert error:", insErr);

    return new Response(JSON.stringify({
      success: true,
      reference,
      transaction_id: txId,
      qr_code: pixCode,
      qr_code_base64: pixBase64,
      amount_cents: amountCents,
      coins: totalCoins,
      expires_at: expiresAt,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("create-pix-deposit error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

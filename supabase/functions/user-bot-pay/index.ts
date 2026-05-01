// Cria pagamento PIX único de R$10 para liberar o sistema "Meu Bot Próprio".
// action=create -> cria PIX. action=check -> consulta status na Paradise.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PARADISE = "https://multi.paradisepags.com/api/v1/transaction.php";
const ACCESS_PRICE_CENTS = 1000; // R$10,00

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "no_auth" }, 401);

    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "create";

    if (action === "check") {
      const reference = body.reference;
      if (!reference) return json({ error: "missing_reference" }, 400);
      const { data: pay } = await supa.from("user_bot_payments").select("*")
        .eq("reference", reference).eq("user_id", user.id).maybeSingle();
      if (!pay) return json({ error: "not_found" }, 404);
      if (pay.status === "approved") return json({ status: "approved" });

      if (pay.paradise_transaction_id) {
        const r = await fetch(`https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${pay.paradise_transaction_id}`, {
          headers: { "X-API-Key": Deno.env.get("PARADISE_API_KEY")! },
        });
        if (r.ok) {
          const d = await r.json();
          const newStatus = d.status;
          if (newStatus && newStatus !== pay.status) {
            await supa.from("user_bot_payments").update({
              status: newStatus,
              paid_at: newStatus === "approved" ? new Date().toISOString() : null,
            }).eq("id", pay.id);

            if (newStatus === "approved") {
              await supa.from("user_bots").update({
                access_paid: true,
                access_paid_at: new Date().toISOString(),
              }).eq("user_id", user.id);
              return json({ status: "approved" });
            }
            return json({ status: newStatus });
          }
        }
      }
      return json({ status: pay.status });
    }

    // action === "create"
    const { data: bot } = await supa.from("user_bots").select("access_paid").eq("user_id", user.id).maybeSingle();
    if (bot?.access_paid) return json({ error: "already_paid" }, 400);

    const reference = `botpay_${user.id.slice(0, 8)}_${Date.now()}`;
    const profileEmail = user.email || `user_${user.id}@bot.coinsdm.local`;

    const r = await fetch(PARADISE, {
      method: "POST",
      headers: { "X-API-Key": Deno.env.get("PARADISE_API_KEY")!, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: ACCESS_PRICE_CENTS,
        description: "Acesso vitalício - Meu Bot Próprio",
        reference,
        customer: {
          name: "Cliente CoinsDM",
          email: profileEmail,
          document: "00000000000",
          phone: "11999999999",
        },
      }),
    });
    const d = await r.json();
    const pix = d.pix_code || d.qr_code || d.qrcode || d.copy_paste || d.emv ||
      d.payment?.pix_code || d.data?.pix_code || d.data?.qr_code || "";
    const b64 = d.qr_code_base64 || d.qrcode_base64 || d.payment?.qr_code_base64 || d.data?.qr_code_base64 || "";
    const txId = d.transaction_id || d.id || d.data?.transaction_id || d.data?.id;
    const expires = d.expires_at || d.expiration || d.payment?.expires_at || d.data?.expires_at || null;

    if (!pix) return json({ error: "gateway_error", details: d }, 502);

    await supa.from("user_bot_payments").insert({
      user_id: user.id,
      reference,
      paradise_transaction_id: String(txId ?? reference),
      amount_cents: ACCESS_PRICE_CENTS,
      status: "pending",
      qr_code: pix,
      qr_code_base64: b64,
      expires_at: expires ? new Date(expires).toISOString() : null,
    });

    return json({
      success: true,
      reference,
      pix_code: pix,
      qr_code_base64: b64,
      amount_brl: "10,00",
      expires_at: expires,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

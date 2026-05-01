import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { creditAffiliateCommission } from "../_shared/affiliate-commission.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    console.log("Paradise webhook:", JSON.stringify(payload));

    const externalId: string | undefined =
      payload.external_id || payload.reference || payload.data?.external_id || payload.data?.reference;
    const rawStatus: string | undefined = payload.status || payload.data?.status;
    // Normaliza: "paid" === "approved"
    const status = rawStatus === "paid" ? "approved" : rawStatus;
    const txId = (payload.transaction_id || payload.id || payload.data?.transaction_id || payload.data?.id)
      ? String(payload.transaction_id || payload.id || payload.data?.transaction_id || payload.data?.id)
      : null;

    if (!externalId || !status) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Busca depósito
    const { data: deposit } = await admin
      .from("pending_deposits")
      .select("*")
      .eq("reference", externalId)
      .maybeSingle();

    if (!deposit) {
      console.error("Deposit not found:", externalId);
      return new Response(JSON.stringify({ ok: true, ignored: "not_found" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Já processado, ignora
    if (deposit.status === "approved" || deposit.status === "paid") {
      return new Response(JSON.stringify({ ok: true, already: "approved" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualiza status
    await admin.from("pending_deposits").update({
      status,
      paradise_transaction_id: txId ?? deposit.paradise_transaction_id,
      paid_at: status === "approved" ? new Date().toISOString() : null,
    }).eq("id", deposit.id);

    // Se aprovado, credita coins
    if (status === "approved") {
      const { data: profile } = await admin
        .from("profiles").select("credits").eq("id", deposit.user_id).single();
      const current = profile?.credits ?? 0;
      const newBalance = current + deposit.coins;

      await admin.from("profiles").update({ credits: newBalance }).eq("id", deposit.user_id);
      await admin.from("credit_transactions").insert({
        user_id: deposit.user_id,
        amount: deposit.coins,
        type: "purchase",
        description: `Depósito PIX confirmado · ${deposit.coins.toLocaleString("pt-BR")} DMs (R$ ${(deposit.amount_cents / 100).toFixed(2)})`,
        balance_after: newBalance,
      });

      // Credita comissão de afiliado (vitalício, 20%)
      try {
        await creditAffiliateCommission(admin, {
          depositId: deposit.id,
          referredUserId: deposit.user_id,
          depositAmountCents: deposit.amount_cents,
        });
      } catch (e) {
        console.error("affiliate commission error:", e);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("paradise-webhook error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

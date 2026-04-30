import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Simulação progressiva da campanha (estilo Meta Ads).
// O envio "real" é feito manualmente pelo dono da plataforma fora do app.
// Aqui apenas simulamos a entrega gradual: ~5 DMs a cada 2s, com falhas e cliques realistas.
async function simulateDelivery(admin: any, campaignId: string, userId: string, targetCount: number) {
  const BATCH = 5;          // DMs por tick
  const TICK_MS = 2000;     // intervalo entre ticks

  // Distribuição realista de resultados (totais aproximados)
  // 78% entregue, 8% bloqueado, 9% DM fechada, 3% conta deletada, 2% outros
  // Dos entregues, ~6% clica
  const finalDelivered = Math.round(targetCount * 0.78);
  const finalBlocked   = Math.round(targetCount * 0.08);
  const finalDmClosed  = Math.round(targetCount * 0.09);
  const finalDeleted   = Math.round(targetCount * 0.03);
  const finalOther     = targetCount - finalDelivered - finalBlocked - finalDmClosed - finalDeleted;
  const finalClicks    = Math.round(finalDelivered * (0.04 + Math.random() * 0.05));

  let processed = 0;
  let delivered = 0;
  let blocked = 0, dmClosed = 0, deleted = 0, other = 0;

  while (processed < targetCount) {
    const remaining = targetCount - processed;
    const step = Math.min(BATCH, remaining);

    for (let i = 0; i < step; i++) {
      processed++;
      // Decide o resultado proporcionalmente ao que falta
      const remainingTotal = targetCount - (processed - 1);
      const needDel = finalDelivered - delivered;
      const needBlk = finalBlocked - blocked;
      const needDmc = finalDmClosed - dmClosed;
      const needDel2 = finalDeleted - deleted;
      const needOth = finalOther - other;
      const r = Math.random() * remainingTotal;
      let acc = 0;
      acc += needDel; if (r < acc) { delivered++; continue; }
      acc += needBlk; if (r < acc) { blocked++; continue; }
      acc += needDmc; if (r < acc) { dmClosed++; continue; }
      acc += needDel2; if (r < acc) { deleted++; continue; }
      other++;
    }

    const totalFailed = blocked + dmClosed + deleted + other;
    // Cliques crescem proporcionalmente aos entregues
    const clicks = Math.round((delivered / Math.max(1, finalDelivered)) * finalClicks);

    await admin.from("campaigns").update({
      total_targeted: targetCount,
      total_delivered: delivered,
      total_failed: totalFailed,
      failed_blocked: blocked,
      failed_dm_closed: dmClosed,
      failed_deleted: deleted,
      failed_other: other,
      total_clicks: clicks,
    }).eq("id", campaignId);

    if (processed < targetCount) {
      await new Promise((r) => setTimeout(r, TICK_MS));
    }
  }

  return { delivered, totalFailed: blocked + dmClosed + deleted + other,
    failBuckets: { blocked, dm_closed: dmClosed, deleted, other },
    clicks: finalClicks };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;

    const { campaign_id } = await req.json();
    if (!campaign_id) {
      return new Response(JSON.stringify({ error: "campaign_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: campaign, error: cErr } = await admin.from("campaigns").select("*").eq("id", campaign_id).eq("user_id", userId).single();
    if (cErr || !campaign) {
      return new Response(JSON.stringify({ error: "campaign_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (campaign.status === "sent" || campaign.status === "sending") {
      return new Response(JSON.stringify({ error: "Campanha já foi disparada." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const targetCount = campaign.target_count || 100;
    // Custo em COINS: 1 coin = 1 DM
    const requiredCoins = targetCount;

    const { data: profile } = await admin.from("profiles").select("credits").eq("id", userId).single();
    if (!profile || profile.credits < requiredCoins) {
      return new Response(JSON.stringify({
        error: `Saldo insuficiente. Você precisa de ${requiredCoins} coins (tem ${profile?.credits ?? 0}).`,
        required: requiredCoins, have: profile?.credits ?? 0,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newBalance = profile.credits - requiredCoins;
    await admin.from("profiles").update({ credits: newBalance }).eq("id", userId);
    await admin.from("credit_transactions").insert({
      user_id: userId, amount: -requiredCoins, type: "campaign_spend",
      description: `Campanha: ${campaign.name} (${targetCount} DMs)`,
      campaign_id, balance_after: newBalance,
    });

    await admin.from("campaigns").update({
      status: "sending", sent_at: new Date().toISOString(),
      total_targeted: targetCount, credits_spent: requiredCoins,
      total_delivered: 0, total_failed: 0, total_clicks: 0,
      failed_blocked: 0, failed_dm_closed: 0, failed_deleted: 0, failed_other: 0,
      error_message: null,
    }).eq("id", campaign_id);

    // EdgeRuntime.waitUntil permite continuar a simulação após retornar resposta
    const work = (async () => {
      try {
        const result = await simulateDelivery(admin, campaign_id, userId, targetCount);
        await admin.from("campaigns").update({
          status: "sent",
        }).eq("id", campaign_id);
        console.log("campaign finished", campaign_id, result);
      } catch (e) {
        console.error("simulation error", e);
        await admin.from("campaigns").update({ status: "sent" }).eq("id", campaign_id);
      }
    })();

    // @ts-ignore EdgeRuntime global
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Campanha em entrega",
      targeted: targetCount,
      coins_spent: requiredCoins,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("send-campaign error", err);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

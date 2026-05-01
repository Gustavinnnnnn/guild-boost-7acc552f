// API exclusiva do bot Discord. Autenticada via header "x-bot-api-key".
// Roteamento interno por ?action=<nome>. Identifica usuário pelo discord_id.
//
// Endpoints (todos POST, com JSON body além de discord_id quando necessário):
//   ?action=user            { discord_id, discord_username, avatar_url? } -> profile
//   ?action=stats           { discord_id }                                -> métricas
//   ?action=buy-dms         { discord_id, dms }                           -> PIX
//   ?action=check-payment   { discord_id, reference }                     -> status
//   ?action=create-campaign { discord_id, name, message, image_url?, button_label?, button_url?, target_count, target_niches?[] } -> campaign_id
//   ?action=send-campaign   { discord_id, campaign_id }                   -> dispara
//   ?action=campaigns       { discord_id }                                -> lista campanhas
//   ?action=affiliate       { discord_id }                                -> dados afiliado
//   ?action=niches          {}                                            -> nichos disponíveis

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-api-key",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PARADISE_API_KEY = Deno.env.get("PARADISE_API_KEY")!;
const BOT_API_KEY = Deno.env.get("BOT_API_KEY")!;

const PARADISE_URL = "https://multi.paradisepags.com/api/v1/transaction.php";
const CENTS_PER_COIN = 20; // 1 DM = R$ 0,20
const MIN_DMS = 150;       // R$ 30,00 mínimo

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Cria/atualiza profile pelo discord_id e retorna o profile completo. */
async function upsertUser(discord_id: string, discord_username?: string, avatar_url?: string) {
  if (!discord_id) throw new Error("discord_id required");

  // 1) Tenta achar profile existente
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("discord_id", discord_id)
    .maybeSingle();

  if (existing) {
    // Atualiza username/avatar se vieram
    if (discord_username || avatar_url) {
      await admin.from("profiles").update({
        discord_username: discord_username ?? existing.discord_username,
        avatar_url: avatar_url ?? existing.avatar_url,
        username: discord_username ?? existing.username,
      }).eq("id", existing.id);
    }
    return existing;
  }

  // 2) Cria usuário fantasma no auth (necessário pra ter um auth.users.id estável)
  const fakeEmail = `discord_${discord_id}@bot.coinsdm.local`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: fakeEmail,
    email_confirm: true,
    user_metadata: {
      discord_id,
      provider: "discord_bot",
      full_name: discord_username,
      avatar_url,
    },
  });
  if (createErr) {
    // Se já existir (race), busca de novo
    const { data: again } = await admin
      .from("profiles").select("*").eq("discord_id", discord_id).maybeSingle();
    if (again) return again;
    throw createErr;
  }

  const userId = created.user!.id;
  // O trigger handle_new_user já cria o profile, mas garantimos os campos discord:
  await admin.from("profiles").upsert({
    id: userId,
    username: discord_username ?? `User${discord_id.slice(-4)}`,
    discord_id,
    discord_username,
    avatar_url: avatar_url ?? null,
  }, { onConflict: "id" });

  const { data: profile } = await admin
    .from("profiles").select("*").eq("id", userId).single();
  return profile!;
}

async function handleUser(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username, body.avatar_url);
  return json({
    id: profile.id,
    discord_id: profile.discord_id,
    username: profile.username,
    avatar_url: profile.avatar_url,
    credits: profile.credits ?? 0,
  });
}

async function handleStats(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username);
  const userId = profile.id;
  const [{ data: campaigns }, { data: txs }] = await Promise.all([
    admin.from("campaigns").select("id,name,status,total_targeted,total_delivered,total_clicks,credits_spent,created_at,sent_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    admin.from("credit_transactions").select("amount,type,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);
  const totalDelivered = (campaigns ?? []).reduce((s, c) => s + (c.total_delivered ?? 0), 0);
  const totalClicks = (campaigns ?? []).reduce((s, c) => s + (c.total_clicks ?? 0), 0);
  const totalSpent = (campaigns ?? []).reduce((s, c) => s + (c.credits_spent ?? 0), 0);
  const totalBought = (txs ?? []).filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  return json({
    credits: profile.credits ?? 0,
    total_campaigns: campaigns?.length ?? 0,
    total_delivered: totalDelivered,
    total_clicks: totalClicks,
    total_spent: totalSpent,
    total_bought: totalBought,
    recent_campaigns: campaigns ?? [],
  });
}

async function handleBuyDms(body: any) {
  const dms = Math.floor(Number(body.dms));
  if (!dms || dms < MIN_DMS) return json({ error: "invalid_amount", min: MIN_DMS }, 400);

  const profile = await upsertUser(body.discord_id, body.discord_username);
  const amountCents = dms * CENTS_PER_COIN;
  const reference = `bot_${profile.id.slice(0, 8)}_${Date.now()}`;

  const paradiseRes = await fetch(PARADISE_URL, {
    method: "POST",
    headers: { "X-API-Key": PARADISE_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: amountCents,
      description: `${dms} DMs CoinsDM`,
      reference,
      source: "discord_bot",
      customer: {
        name: profile.username || "Cliente",
        email: `discord_${profile.discord_id}@bot.coinsdm.local`,
        document: "00000000000",
        phone: "11999999999",
      },
    }),
  });
  const paradiseData = await paradiseRes.json();
  console.log("Paradise (bot):", JSON.stringify(paradiseData));

  const pixCode =
    paradiseData.pix_code || paradiseData.qr_code || paradiseData.qrcode ||
    paradiseData.qr_code_text || paradiseData.copy_paste || paradiseData.emv ||
    paradiseData.payment?.pix_code || paradiseData.payment?.qr_code ||
    paradiseData.data?.pix_code || paradiseData.data?.qr_code || "";
  const pixBase64 =
    paradiseData.qr_code_base64 || paradiseData.qr_code_image || paradiseData.qrcode_base64 ||
    paradiseData.payment?.qr_code_base64 || paradiseData.data?.qr_code_base64 || "";
  const txId = paradiseData.transaction_id || paradiseData.id ||
    paradiseData.data?.transaction_id || paradiseData.data?.id;
  const expiresAt = paradiseData.expires_at || paradiseData.expiration ||
    paradiseData.payment?.expires_at || paradiseData.data?.expires_at || null;

  if (!pixCode) {
    return json({ error: "gateway_error", details: paradiseData }, 502);
  }

  await admin.from("pending_deposits").insert({
    user_id: profile.id,
    reference,
    paradise_transaction_id: String(txId ?? reference),
    coins: dms,
    amount_cents: amountCents,
    status: "pending",
    qr_code: pixCode,
    qr_code_base64: pixBase64,
    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
  });

  return json({
    success: true,
    reference,
    pix_code: pixCode,
    qr_code_base64: pixBase64,
    amount_brl: (amountCents / 100).toFixed(2),
    dms,
    expires_at: expiresAt,
  });
}

async function handleCheckPayment(body: any) {
  const reference = body.reference;
  if (!reference) return json({ error: "missing_reference" }, 400);

  const profile = await upsertUser(body.discord_id, body.discord_username);
  const { data: deposit } = await admin
    .from("pending_deposits").select("*")
    .eq("reference", reference).eq("user_id", profile.id).maybeSingle();
  if (!deposit) return json({ error: "not_found" }, 404);

  if (deposit.status === "approved") {
    return json({ status: "approved", dms: deposit.coins });
  }

  if (deposit.paradise_transaction_id) {
    const url = `https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${deposit.paradise_transaction_id}`;
    const res = await fetch(url, { headers: { "X-API-Key": PARADISE_API_KEY } });
    if (res.ok) {
      const data = await res.json();
      const newStatus = data.status;
      if (newStatus && newStatus !== deposit.status) {
        await admin.from("pending_deposits").update({
          status: newStatus,
          paid_at: newStatus === "approved" ? new Date().toISOString() : null,
        }).eq("id", deposit.id);

        if (newStatus === "approved") {
          const newBalance = (profile.credits ?? 0) + deposit.coins;
          await admin.from("profiles").update({ credits: newBalance }).eq("id", profile.id);
          await admin.from("credit_transactions").insert({
            user_id: profile.id, amount: deposit.coins, type: "purchase",
            description: `Depósito PIX (bot) · ${deposit.coins} DMs`,
            balance_after: newBalance,
          });
          return json({ status: "approved", dms: deposit.coins, new_balance: newBalance });
        }
        return json({ status: newStatus });
      }
    }
  }
  return json({ status: deposit.status });
}

async function handleCreateCampaign(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username);
  const target = Math.max(10, Math.floor(Number(body.target_count) || 100));

  const { data, error } = await admin.from("campaigns").insert({
    user_id: profile.id,
    name: String(body.name || "Campanha sem nome").slice(0, 100),
    title: String(body.title || body.name || "").slice(0, 100),
    message: String(body.message || "").slice(0, 2000),
    image_url: body.image_url || null,
    button_label: body.button_label || null,
    button_url: body.button_url || null,
    embed_color: body.embed_color || "#5865F2",
    target_count: target,
    target_niches: Array.isArray(body.target_niches) ? body.target_niches : [],
    target_category: body.target_category || "all",
    status: "draft",
  }).select("id").single();

  if (error) return json({ error: error.message }, 400);
  return json({ success: true, campaign_id: data.id, cost_dms: target });
}

async function handleSendCampaign(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username);
  const campaign_id = body.campaign_id;

  const { data: campaign } = await admin.from("campaigns").select("*")
    .eq("id", campaign_id).eq("user_id", profile.id).maybeSingle();
  if (!campaign) return json({ error: "campaign_not_found" }, 404);
  if (campaign.status === "sending" || campaign.status === "sent") {
    return json({ error: "already_sent" }, 400);
  }

  const targetCount = campaign.target_count || 100;
  if ((profile.credits ?? 0) < targetCount) {
    return json({ error: "insufficient_balance", required: targetCount, have: profile.credits ?? 0 }, 402);
  }

  const newBalance = (profile.credits ?? 0) - targetCount;
  await admin.from("profiles").update({ credits: newBalance }).eq("id", profile.id);
  await admin.from("credit_transactions").insert({
    user_id: profile.id, amount: -targetCount, type: "campaign_spend",
    description: `Campanha (bot): ${campaign.name}`, campaign_id, balance_after: newBalance,
  });
  await admin.from("campaigns").update({
    status: "sending", sent_at: new Date().toISOString(),
    total_targeted: targetCount, credits_spent: targetCount,
    total_delivered: 0, total_failed: 0, total_clicks: 0,
    failed_blocked: 0, failed_dm_closed: 0, failed_deleted: 0, failed_other: 0,
  }).eq("id", campaign_id);

  // Simulação progressiva em background
  const work = (async () => {
    const finalDelivered = Math.round(targetCount * 0.78);
    const finalBlocked   = Math.round(targetCount * 0.08);
    const finalDmClosed  = Math.round(targetCount * 0.09);
    const finalDeleted   = Math.round(targetCount * 0.03);
    const finalOther     = targetCount - finalDelivered - finalBlocked - finalDmClosed - finalDeleted;
    const finalClicks    = Math.round(finalDelivered * (0.04 + Math.random() * 0.05));
    let processed = 0, delivered = 0, blocked = 0, dmClosed = 0, deleted = 0, other = 0;
    const BATCH = 5, TICK_MS = 2000;
    while (processed < targetCount) {
      const step = Math.min(BATCH, targetCount - processed);
      for (let i = 0; i < step; i++) {
        processed++;
        const remainingTotal = targetCount - (processed - 1);
        const r = Math.random() * remainingTotal;
        let acc = 0;
        acc += finalDelivered - delivered; if (r < acc) { delivered++; continue; }
        acc += finalBlocked - blocked;     if (r < acc) { blocked++; continue; }
        acc += finalDmClosed - dmClosed;   if (r < acc) { dmClosed++; continue; }
        acc += finalDeleted - deleted;     if (r < acc) { deleted++; continue; }
        other++;
      }
      const totalFailed = blocked + dmClosed + deleted + other;
      const clicks = Math.round((delivered / Math.max(1, finalDelivered)) * finalClicks);
      await admin.from("campaigns").update({
        total_delivered: delivered, total_failed: totalFailed,
        failed_blocked: blocked, failed_dm_closed: dmClosed,
        failed_deleted: deleted, failed_other: other, total_clicks: clicks,
      }).eq("id", campaign_id);
      if (processed < targetCount) await new Promise((r) => setTimeout(r, TICK_MS));
    }
    await admin.from("campaigns").update({ status: "sent" }).eq("id", campaign_id);
  })();
  // @ts-ignore
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) EdgeRuntime.waitUntil(work);

  return json({ success: true, dms_spent: targetCount, new_balance: newBalance });
}

async function handleCampaigns(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username);
  const { data } = await admin.from("campaigns")
    .select("id,name,status,total_targeted,total_delivered,total_clicks,credits_spent,created_at,sent_at,target_niches")
    .eq("user_id", profile.id).order("created_at", { ascending: false }).limit(15);
  return json({ campaigns: data ?? [] });
}

async function handleAffiliate(body: any) {
  const profile = await upsertUser(body.discord_id, body.discord_username);
  const { data: aff } = await admin.from("affiliates").select("*").eq("user_id", profile.id).maybeSingle();
  if (!aff) return json({ error: "no_affiliate" }, 404);
  const dashboardUrl = `https://guild-boost.lovable.app/?ref=${aff.code}`;
  return json({
    code: aff.code,
    link: dashboardUrl,
    total_clicks: aff.total_clicks,
    total_referrals: aff.total_referrals,
    total_earned_brl: (aff.total_earned_cents / 100).toFixed(2),
    available_brl: (aff.available_cents / 100).toFixed(2),
    commission_rate: aff.commission_rate,
  });
}

async function handleNiches() {
  // Lista distinta de nichos a partir dos servidores cadastrados
  const { data } = await admin.from("discord_servers").select("niche").not("niche", "is", null);
  const set = new Set<string>();
  (data ?? []).forEach((r: any) => r.niche && set.add(r.niche));
  return json({ niches: Array.from(set).sort() });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = req.headers.get("x-bot-api-key");
  if (!apiKey || apiKey !== BOT_API_KEY) {
    return json({ error: "unauthorized" }, 401);
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};

    switch (action) {
      case "user":            return await handleUser(body);
      case "stats":           return await handleStats(body);
      case "buy-dms":         return await handleBuyDms(body);
      case "check-payment":   return await handleCheckPayment(body);
      case "create-campaign": return await handleCreateCampaign(body);
      case "send-campaign":   return await handleSendCampaign(body);
      case "campaigns":       return await handleCampaigns(body);
      case "affiliate":       return await handleAffiliate(body);
      case "niches":          return await handleNiches();
      default:                return json({ error: "unknown_action", action }, 400);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    console.error("bot-api error:", msg);
    return json({ error: msg }, 500);
  }
});

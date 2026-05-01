import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { creditAffiliateCommission } from "../_shared/affiliate-commission.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PARADISE_API_KEY = Deno.env.get("PARADISE_API_KEY")!;

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
    const { data: userData, error: userErr } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "missing_reference" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: deposit } = await admin
      .from("pending_deposits").select("*")
      .eq("reference", reference).eq("user_id", userId).maybeSingle();

    if (!deposit) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se já aprovado, retorna
    if (deposit.status === "approved" || deposit.status === "paid") {
      return new Response(JSON.stringify({ status: "approved", coins: deposit.coins }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Consulta Paradise pra atualizar
    if (deposit.paradise_transaction_id) {
      const url = `https://multi.paradisepags.com/api/v1/query.php?action=get_transaction&id=${deposit.paradise_transaction_id}`;
      const res = await fetch(url, { headers: { "X-API-Key": PARADISE_API_KEY } });
      if (res.ok) {
        const data = await res.json();
        const rawStatus = data.status || data.data?.status;
        // Normaliza: "paid" também conta como aprovado
        const newStatus = (rawStatus === "paid") ? "approved" : rawStatus;
        if (newStatus && newStatus !== deposit.status) {
          await admin.from("pending_deposits").update({
            status: newStatus,
            paid_at: newStatus === "approved" ? new Date().toISOString() : null,
          }).eq("id", deposit.id);

          if (newStatus === "approved") {
            const { data: profile } = await admin
              .from("profiles").select("credits").eq("id", userId).single();
            const current = profile?.credits ?? 0;
            const newBalance = current + deposit.coins;
            await admin.from("profiles").update({ credits: newBalance }).eq("id", userId);
            await admin.from("credit_transactions").insert({
              user_id: userId, amount: deposit.coins, type: "purchase",
              description: `Depósito PIX confirmado · ${deposit.coins.toLocaleString("pt-BR")} DMs (R$ ${(deposit.amount_cents / 100).toFixed(2)})`,
              balance_after: newBalance,
            });
            try {
              await creditAffiliateCommission(admin, {
                depositId: deposit.id,
                referredUserId: userId,
                depositAmountCents: deposit.amount_cents,
              });
            } catch (e) {
              console.error("affiliate commission error:", e);
            }
            return new Response(JSON.stringify({ status: "approved", coins: deposit.coins }), {
              status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ status: newStatus }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({ status: deposit.status }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

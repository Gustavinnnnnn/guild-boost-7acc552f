import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ENV_TOKEN = Deno.env.get("DISCORD_BOT_TOKEN") ?? "";

const mask = (t: string) => {
  if (!t) return "";
  if (t.length <= 12) return "•".repeat(t.length);
  return `${t.slice(0, 6)}…${t.slice(-4)}`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: userData } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin");
    if (!roles || roles.length === 0) return json({ error: "Forbidden" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action ?? "get";

    // Resolve current token (DB > env)
    const { data: row } = await admin.from("app_settings").select("value, updated_at").eq("key", "discord_bot_token").maybeSingle();
    const dbToken = row?.value ?? "";
    const current = dbToken || ENV_TOKEN;

    if (action === "get") {
      // Test if token is valid by hitting Discord
      let valid: boolean | null = null;
      let bot: { username?: string; id?: string } | null = null;
      if (current) {
        try {
          const r = await fetch("https://discord.com/api/v10/users/@me", {
            headers: { Authorization: `Bot ${current}` },
          });
          if (r.ok) {
            const d = await r.json();
            valid = true;
            bot = { username: d.username, id: d.id };
          } else {
            valid = false;
          }
        } catch {
          valid = false;
        }
      }
      return json({
        success: true,
        has_token: !!current,
        source: dbToken ? "db" : (ENV_TOKEN ? "env" : "none"),
        masked: mask(current),
        updated_at: row?.updated_at ?? null,
        valid, bot,
      });
    }

    if (action === "set") {
      const token = String(body.token ?? "").trim();
      if (!token || token.length < 30) return json({ error: "invalid_token" }, 400);

      // Validate against Discord first
      const r = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { Authorization: `Bot ${token}` },
      });
      if (!r.ok) {
        const detail = await r.text();
        return json({ error: "discord_rejected", detail }, 400);
      }
      const me = await r.json();

      const { error: upErr } = await admin.from("app_settings").upsert({
        key: "discord_bot_token",
        value: token,
        updated_at: new Date().toISOString(),
        updated_by: userData.user.id,
      });
      if (upErr) return json({ error: "db_error", detail: upErr.message }, 500);

      return json({ success: true, bot: { username: me.username, id: me.id }, masked: mask(token) });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    return json({ error: msg }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

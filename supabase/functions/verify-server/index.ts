// Verifica um servidor Discord a partir de um link de convite ou ID.
// Retorna info pública do servidor (nome, ícone, total aprox de membros).
// IMPORTANTE: como nosso bot oficial não está nesses servidores, o disparo
// real é IMPOSSÍVEL — a campanha é entregue via simulação (igual nicho).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function extractInviteCode(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // discord.gg/abc, discord.com/invite/abc, https://...
  const m = s.match(/(?:discord(?:app)?\.com\/invite\/|discord\.gg\/)([a-zA-Z0-9-]+)/i);
  if (m) return m[1];
  // Pode ser só o código já: abc123
  if (/^[a-zA-Z0-9-]{2,32}$/.test(s)) return s;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "no_auth" }, 401);
    const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supa.auth.getUser(auth.replace("Bearer ", ""));
    if (!user) return json({ error: "unauthenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const input = String(body.input || body.invite || "").trim();
    if (!input) return json({ error: "missing_input", message: "Cole o link do servidor." }, 400);

    const code = extractInviteCode(input);
    if (!code) {
      return json({
        error: "invalid_input",
        message: "Link inválido. Use um convite tipo discord.gg/abc123",
      }, 400);
    }

    // Endpoint público (não precisa de bot token pra invite info)
    const r = await fetch(`https://discord.com/api/v10/invites/${code}?with_counts=true&with_expiration=false`);
    if (!r.ok) {
      return json({
        error: "invite_not_found",
        message: r.status === 404
          ? "Convite não encontrado ou expirado."
          : `Discord respondeu ${r.status}. Tente outro link.`,
      }, 400);
    }
    const inv = await r.json() as any;
    const guild = inv.guild;
    if (!guild) return json({ error: "no_guild" }, 400);

    const iconUrl = guild.icon
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${guild.icon.startsWith("a_") ? "gif" : "png"}`
      : null;
    const bannerUrl = guild.banner
      ? `https://cdn.discordapp.com/banners/${guild.id}/${guild.banner}.png`
      : null;

    return json({
      success: true,
      server: {
        id: guild.id,
        name: guild.name,
        description: guild.description ?? null,
        icon_url: iconUrl,
        banner_url: bannerUrl,
        approximate_member_count: inv.approximate_member_count ?? 0,
        approximate_presence_count: inv.approximate_presence_count ?? 0,
        verification_level: guild.verification_level ?? 0,
        invite_code: code,
      },
    });
  } catch (e) {
    console.error("verify-server error:", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

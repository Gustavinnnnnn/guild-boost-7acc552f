import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Public callback - exchanges Discord code for tokens, then redirects back to app
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // contains the app origin to redirect back to

  if (!code || !state) {
    return new Response("Missing code or state", { status: 400 });
  }

  let appOrigin: string;
  let userId: string;
  try {
    const decoded = JSON.parse(atob(state));
    appOrigin = decoded.origin;
    userId = decoded.user_id;
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  // The redirect_uri MUST match exactly what was used when initiating the flow
  const redirectUri = `${SUPABASE_URL}/functions/v1/discord-oauth-callback`;

  // Exchange code for token
  const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Discord token exchange failed:", err);
    return Response.redirect(`${appOrigin}/app/servidores?discord_error=token_exchange`, 302);
  }

  const tokens = await tokenRes.json();
  // tokens: { access_token, refresh_token, expires_in, scope, token_type }

  // Fetch Discord user info
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const discordUser = await userRes.json();

  // Save tokens + discord identity to profile (using service role to bypass RLS)
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin
    .from("profiles")
    .update({
      discord_id: discordUser.id,
      discord_username: discordUser.username,
      avatar_url: discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null,
      discord_access_token: tokens.access_token,
      discord_refresh_token: tokens.refresh_token,
      discord_token_expires_at: expiresAt,
    })
    .eq("id", userId);

  return Response.redirect(`${appOrigin}/app/servidores?discord_connected=1`, 302);
});

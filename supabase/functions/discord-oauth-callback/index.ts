import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const DISCORD_CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const DISCORD_CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Public OAuth callback. Exchanges Discord code -> tokens, creates/finds the
// Supabase user using the Discord email, signs them in, and redirects back to
// the app with the session tokens in the URL hash.
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing code or state", { status: 400 });

  let appOrigin: string;
  try {
    appOrigin = JSON.parse(atob(state)).origin;
  } catch {
    return new Response("Invalid state", { status: 400 });
  }

  const redirectUri = `${SUPABASE_URL}/functions/v1/discord-oauth-callback`;

  // 1) Exchange code for Discord tokens
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
    console.error("Discord token exchange failed:", await tokenRes.text());
    return Response.redirect(`${appOrigin}/auth?discord_error=token_exchange`, 302);
  }
  const tokens = await tokenRes.json();

  // 2) Fetch Discord user
  const userRes = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) {
    return Response.redirect(`${appOrigin}/auth?discord_error=user_fetch`, 302);
  }
  const discordUser = await userRes.json();
  // discordUser: { id, username, global_name, email, verified, avatar, ... }

  if (!discordUser.email) {
    return Response.redirect(`${appOrigin}/auth?discord_error=no_email`, 302);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 3) Find or create Supabase user by email
  const { data: existing } = await admin.auth.admin.listUsers();
  let userId: string | undefined = existing?.users.find(
    (u) => u.email?.toLowerCase() === discordUser.email.toLowerCase(),
  )?.id;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: discordUser.email,
      email_confirm: true,
      user_metadata: {
        full_name: discordUser.global_name || discordUser.username,
        avatar_url: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        provider: "discord",
      },
    });
    if (createErr || !created.user) {
      console.error("createUser failed:", createErr);
      return Response.redirect(`${appOrigin}/auth?discord_error=create_user`, 302);
    }
    userId = created.user.id;
  }

  // 4) Save Discord identity + tokens to profile
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  // Ensure profile row exists, then update with Discord data
  await admin.from("profiles").upsert({
    id: userId,
    username: discordUser.global_name || discordUser.username,
    avatar_url: avatarUrl,
    discord_id: discordUser.id,
    discord_username: discordUser.username,
    discord_access_token: tokens.access_token,
    discord_refresh_token: tokens.refresh_token,
    discord_token_expires_at: expiresAt,
  });

  // 5) Generate a magic link the frontend can consume to set a session
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: discordUser.email,
    options: { redirectTo: `${appOrigin}/auth/callback` },
  });

  if (linkErr || !linkData) {
    console.error("generateLink failed:", linkErr);
    return Response.redirect(`${appOrigin}/auth?discord_error=session`, 302);
  }

  // The action_link points to Supabase /verify which then redirects to redirectTo
  // with tokens in the URL hash. Just send the user there.
  return Response.redirect(linkData.properties.action_link, 302);
});

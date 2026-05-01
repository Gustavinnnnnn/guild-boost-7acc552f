// Wrapper para chamar a API do bot (edge function bot-api).
import 'dotenv/config';

const BASE = process.env.BOT_API_URL;
const KEY = process.env.BOT_API_KEY;

if (!BASE || !KEY) {
  console.error('❌ BOT_API_URL ou BOT_API_KEY não configurados no .env');
  process.exit(1);
}

export async function callApi(action, body = {}) {
  const url = `${BASE}?action=${encodeURIComponent(action)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-bot-api-key': KEY,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Helper: monta payload de identificação do usuário Discord. */
export function userPayload(interaction, extra = {}) {
  return {
    discord_id: interaction.user.id,
    discord_username: interaction.user.username,
    avatar_url: interaction.user.displayAvatarURL({ size: 128 }),
    ...extra,
  };
}

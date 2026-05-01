// ============================================================
//   CONFIGURAÇÃO DO BOT — preencha os campos abaixo
// ============================================================
//   Depois de preencher, salve este arquivo, zipe a pasta e
//   suba na Discloud. NÃO precisa de .env.
// ============================================================

export const config = {
  // 1) Token do bot
  //    Discord Developer Portal → seu app → Bot → Reset Token → copie e cole aqui
  DISCORD_TOKEN: "COLE_SEU_TOKEN_AQUI",

  // 2) Application ID
  //    Discord Developer Portal → seu app → General Information → Application ID
  DISCORD_CLIENT_ID: "COLE_SEU_CLIENT_ID_AQUI",

  // 3) (Opcional) ID do servidor de testes
  //    Se preencher, comandos sobem instantâneo só nesse servidor.
  //    Em produção deixe como string vazia "" — comandos viram globais.
  DEV_GUILD_ID: "",

  // 4) URL da API do Lovable Cloud (já preenchida — não mexer)
  BOT_API_URL: "https://srwdikhfrfdmhlfdklzj.supabase.co/functions/v1/bot-api",

  // 5) Chave secreta da API
  //    Use a MESMA chave que você cadastrou no Lovable Cloud (segredo BOT_API_KEY).
  BOT_API_KEY: "COLE_SUA_BOT_API_KEY_AQUI",
};

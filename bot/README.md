# 🤖 CoinsDM — Bot Discord

Bot oficial do CoinsDM/DMFlow. Os usuários compram DMs, criam campanhas e veem métricas direto pelo Discord.

## 📋 Comandos

| Comando | O que faz |
|---|---|
| `/dashboard` | Saldo de DMs e métricas resumidas |
| `/comprar <quantidade>` | Gera PIX para comprar DMs (mínimo 150 = R$ 30) |
| `/divulgar <quantidade>` | Cria e dispara uma campanha de DMs em massa |
| `/campanhas` | Lista suas últimas campanhas |
| `/afiliado` | Seu link de afiliado e ganhos |
| `/painel` | Link do painel web |
| `/ajuda` | Lista todos os comandos |

---

## 🚀 Setup rápido (Discloud)

### 1. Crie o bot no Discord
1. Acesse <https://discord.com/developers/applications>
2. **New Application** → dê um nome (ex: "CoinsDM")
3. Em **Bot** → **Reset Token** → copie o token
4. Em **General Information** → copie o **Application ID**
5. Em **OAuth2 → URL Generator**: marque `bot` + `applications.commands`, permissões `Send Messages`, `Use Slash Commands`, `Embed Links`, `Attach Files`. Abra a URL e adicione o bot ao seu servidor.

### 2. Preencha o `src/config.js`
Abra o arquivo `bot/src/config.js` no Bloco de Notas (ou qualquer editor) e cole:
- `DISCORD_TOKEN` — o token do passo 3
- `DISCORD_CLIENT_ID` — o Application ID do passo 4
- `BOT_API_KEY` — a mesma chave que você cadastrou como segredo `BOT_API_KEY` no Lovable Cloud

Salve o arquivo.

### 3. Registre os slash commands (uma vez só)
**No seu PC**, abra o terminal na pasta `bot/`:
```bash
npm install
npm run deploy-commands
```
Isso registra os comandos `/comprar`, `/divulgar`, etc no Discord. Só rode de novo se adicionar/alterar comandos.

> Não tem Node.js no seu PC? Baixe em <https://nodejs.org> (versão LTS).

### 4. Zipe e suba na Discloud
**Zipe o conteúdo da pasta `bot/`** (não a pasta inteira — o `discloud.config` precisa ficar na **raiz do zip**).

- **Windows**: entre na pasta `bot/`, selecione tudo (Ctrl+A) **menos** `node_modules/`, botão direito → "Compactar para arquivo zip"
- **Linux/Mac**: `cd bot && zip -r ../coinsdm-bot.zip . -x "node_modules/*"`

Suba o `coinsdm-bot.zip` em <https://discloudbot.com/dashboard> (botão **Subir aplicativo**). A Discloud roda `npm install` e `npm start` sozinha.

### 5. Veja os logs
No dashboard da Discloud, abra o app → aba **Logs**. Deve aparecer:
```
✅ 7 comandos carregados.
🤖 Logado como SeuBot#1234
```

Pronto! Vá no Discord e digite `/` no servidor.

---

## 🔄 Atualizando o bot
1. Edite os arquivos no seu PC
2. Zipe de novo (sem `node_modules/`)
3. Na Discloud, abra o app → **Commit** (atualiza sem perder o app)

---

## 🆘 Troubleshooting

**Comandos não aparecem no Discord**
- Comandos globais demoram até 1h pra propagar. Pra testar instantâneo, preencha `DEV_GUILD_ID` no `config.js` com o ID do seu servidor de testes.
- Re-rode `npm run deploy-commands` se mudar comandos.

**Logs mostram `401 unauthorized`**
- A `BOT_API_KEY` no `config.js` não bate com a do Lovable Cloud.

**Logs mostram `gateway_error` ao comprar**
- Verifique o segredo `PARADISE_API_KEY` no Lovable Cloud.

**Bot fica offline na Discloud**
- O `discloud.config` já tem `AUTORESTART=true`. Se mesmo assim cair, veja os logs — geralmente é erro no token.

---

## ⚠️ Segurança do token

O `DISCORD_TOKEN` no `config.js` é **secreto**. Nunca:
- Mande o arquivo num chat público
- Suba pro GitHub público sem `.gitignore`
- Compartilhe screenshot do arquivo aberto

Se vazar: vá no Developer Portal → Bot → **Reset Token** e atualize o `config.js`.

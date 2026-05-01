# 🤖 CoinsDM — Bot Discord

Bot oficial do CoinsDM/ServerBoost. Os usuários compram DMs, criam campanhas e veem métricas direto pelo Discord. O bot conversa com a API hospedada no Lovable Cloud (edge function `bot-api`).

## 📋 Comandos disponíveis

| Comando | O que faz |
|---|---|
| `/dashboard` | Saldo de DMs e métricas resumidas |
| `/comprar <quantidade>` | Gera PIX para comprar DMs (mínimo 150 = R$ 30) |
| `/divulgar <quantidade>` | Cria e dispara uma campanha de DMs em massa |
| `/campanhas` | Lista suas últimas campanhas |
| `/afiliado` | Seu link de afiliado e ganhos |
| `/painel` | Link do painel web (gráficos detalhados) |
| `/ajuda` | Lista todos os comandos |

---

## 🛠️ Setup (passo a passo)

### 1. Criar o bot no Discord Developer Portal

1. Acesse <https://discord.com/developers/applications>
2. Clique em **New Application** e dê um nome (ex: "CoinsDM Bot")
3. Vá em **Bot** → clique em **Reset Token** → copie o token
4. Em **Bot** → ative **Server Members Intent** (não obrigatório agora, mas útil) e desative **Public Bot** se quiser que só você adicione
5. Em **OAuth2** → **URL Generator**:
   - Marque scopes: `bot`, `applications.commands`
   - Permissões mínimas: `Send Messages`, `Use Slash Commands`, `Embed Links`, `Attach Files`
   - Copie a URL gerada e abra no navegador para adicionar o bot ao seu servidor

### 2. Configurar variáveis no `.env`

```bash
cp .env.example .env
nano .env   # ou seu editor preferido
```

Preencha:
- `DISCORD_TOKEN` — token do passo 1
- `DISCORD_CLIENT_ID` — Application ID (em **General Information**)
- `DEV_GUILD_ID` — *(opcional)* ID do seu servidor de testes (clica direito no server → Copy Server ID; precisa de modo dev ativado). Se preencher, comandos sobem instantâneo só nesse servidor. Em produção, deixe vazio.
- `BOT_API_URL` — já vem preenchido com a URL do Lovable Cloud
- `BOT_API_KEY` — **mesma string** que você cadastrou como segredo `BOT_API_KEY` no Lovable Cloud

### 3. Instalar e registrar comandos

```bash
npm install
npm run deploy-commands   # registra slash commands no Discord
```

> Rode `deploy-commands` novamente sempre que adicionar/alterar um comando.

### 4. Rodar o bot

```bash
npm start
```

Pronto. Vá ao Discord e digite `/` no servidor — os comandos do bot devem aparecer.

---

## 🚀 Hospedando em produção (VPS)

### Opção 1: PM2 (recomendado em VPS Linux)

```bash
npm install -g pm2
pm2 start src/index.js --name coinsdm-bot
pm2 save
pm2 startup   # segue as instruções pra autostart no boot
```

Logs:
```bash
pm2 logs coinsdm-bot
```

### Opção 2: systemd (Linux puro)

Crie `/etc/systemd/system/coinsdm-bot.service`:

```ini
[Unit]
Description=CoinsDM Discord Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/coinsdm-bot
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now coinsdm-bot
sudo journalctl -u coinsdm-bot -f
```

### Opção 3: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
CMD ["node", "src/index.js"]
```

```bash
docker build -t coinsdm-bot .
docker run -d --name coinsdm-bot --env-file .env --restart=always coinsdm-bot
```

---

## 🔄 Como funciona por baixo dos panos

1. Usuário roda `/comprar 200` no Discord
2. Bot envia POST para `BOT_API_URL?action=buy-dms` com header `x-bot-api-key`
3. Edge function valida a chave, identifica/cria o profile pelo `discord_id`, gera o PIX no Paradise e devolve o copia-e-cola + QR
4. Bot mostra o PIX no DM/canal com botão "Já paguei"
5. Ao clicar, bot chama `?action=check-payment` e credita as DMs se aprovado

A conta do usuário é criada automaticamente na primeira interação (sem login, sem OAuth). O `discord_id` é a chave única.

---

## 🆘 Troubleshooting

**Comandos não aparecem no Discord**
- Comandos globais demoram até 1h. Use `DEV_GUILD_ID` para testar instantâneo.
- Re-rode `npm run deploy-commands` após mudanças.

**`401 unauthorized` nos logs**
- `BOT_API_KEY` no `.env` precisa ser **idêntico** ao segredo do Lovable Cloud.

**`gateway_error` ao comprar**
- Verifique o secret `PARADISE_API_KEY` no Lovable Cloud.

**Bot fica offline**
- Use PM2/systemd com `Restart=always`. Sem isso, qualquer crash derruba o bot.

---

## 📞 Suporte

Bug no bot? Abra issue no repositório ou contate o admin.

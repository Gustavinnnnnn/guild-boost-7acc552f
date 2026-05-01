import 'dotenv/config';
import {
  Client, GatewayIntentBits, Collection, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder,
} from 'discord.js';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { callApi, userPayload } from './api.js';
import { drafts, buildModal, buildPreview } from './commands/divulgar.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
client.commands = new Collection();

// Carrega comandos
const commandsDir = join(__dirname, 'commands');
const files = (await readdir(commandsDir)).filter(f => f.endsWith('.js'));
for (const file of files) {
  const mod = await import(pathToFileURL(join(commandsDir, file)).href);
  if (mod.data && mod.execute) {
    client.commands.set(mod.data.name, mod);
  }
}
console.log(`✅ ${client.commands.size} comandos carregados.`);

client.once(Events.ClientReady, c => {
  console.log(`🤖 Logado como ${c.user.tag}`);
  c.user.setActivity('/ajuda · CoinsDM');
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    // ===== SLASH COMMANDS =====
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      await cmd.execute(interaction);
      return;
    }

    // ===== BOTÕES =====
    if (interaction.isButton()) {
      const id = interaction.customId;

      // Verificar pagamento
      if (id.startsWith('pay_check_')) {
        const reference = id.replace('pay_check_', '');
        await interaction.deferReply({ ephemeral: true });
        const result = await callApi('check-payment', userPayload(interaction, { reference }));
        if (result.status === 'approved') {
          return interaction.editReply(`✅ Pagamento confirmado! **+${result.dms} DMs** creditadas. Saldo: **${result.new_balance}**.`);
        }
        if (result.status === 'pending') {
          return interaction.editReply('⏳ Pagamento ainda não foi confirmado. Tente de novo em alguns segundos.');
        }
        return interaction.editReply(`Status atual: \`${result.status}\``);
      }

      if (id === 'pay_cancel') {
        return interaction.update({ content: '❌ Operação cancelada.', embeds: [], components: [], files: [] });
      }

      // Abrir modal da campanha
      if (id === 'camp_open_modal') {
        return interaction.showModal(buildModal());
      }

      if (id === 'camp_cancel') {
        drafts.delete(interaction.user.id);
        return interaction.update({ content: '❌ Campanha cancelada.', embeds: [], components: [] });
      }

      // Confirmar disparo
      if (id === 'camp_send') {
        const draft = drafts.get(interaction.user.id);
        if (!draft || !draft.campaign_id) {
          return interaction.reply({ content: 'Rascunho expirado. Use `/divulgar` novamente.', ephemeral: true });
        }
        await interaction.deferUpdate();
        try {
          const r = await callApi('send-campaign', userPayload(interaction, { campaign_id: draft.campaign_id }));
          drafts.delete(interaction.user.id);
          await interaction.editReply({
            content: `🚀 Campanha disparada! Gastando **${r.dms_spent} DMs**. Novo saldo: **${r.new_balance}**.\nUse \`/campanhas\` para acompanhar.`,
            embeds: [], components: [],
          });
        } catch (err) {
          await interaction.editReply({
            content: `❌ Erro ao disparar: ${err.data?.error || err.message}`,
            embeds: [], components: [],
          });
        }
        return;
      }
    }

    // ===== MODAL DE CAMPANHA =====
    if (interaction.isModalSubmit() && interaction.customId === 'camp_modal') {
      const draft = drafts.get(interaction.user.id);
      if (!draft) {
        return interaction.reply({ content: 'Rascunho expirado. Use `/divulgar` novamente.', ephemeral: true });
      }
      draft.name = interaction.fields.getTextInputValue('name');
      draft.message = interaction.fields.getTextInputValue('message');
      draft.image_url = interaction.fields.getTextInputValue('image_url') || null;
      draft.button_label = interaction.fields.getTextInputValue('button_label') || null;
      draft.button_url = interaction.fields.getTextInputValue('button_url') || null;
      drafts.set(interaction.user.id, draft);

      await interaction.deferReply({ ephemeral: true });

      // Cria a campanha como rascunho na API
      const created = await callApi('create-campaign', userPayload(interaction, draft));
      draft.campaign_id = created.campaign_id;
      drafts.set(interaction.user.id, draft);

      const preview = buildPreview(draft);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('camp_send').setLabel('🚀 Disparar agora').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('camp_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
      );
      await interaction.editReply({
        content: `Confira a pré-visualização. Ao confirmar, serão gastas **${draft.target_count} DMs**.`,
        embeds: [preview],
        components: [row],
      });
    }
  } catch (err) {
    console.error('Erro na interaction:', err);
    const msg = err.data?.error || err.message || 'Erro desconhecido';
    const reply = { content: `❌ ${msg}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
} from 'discord.js';
import { callApi, userPayload } from '../api.js';

export const data = new SlashCommandBuilder()
  .setName('divulgar')
  .setDescription('Criar uma campanha de DMs em massa')
  .addIntegerOption(o =>
    o.setName('quantidade')
      .setDescription('Quantas DMs deseja enviar')
      .setMinValue(10)
      .setMaxValue(50000)
      .setRequired(true)
  );

// Guardamos rascunho na memória do processo (chave = userId)
export const drafts = new Map();

export async function execute(interaction) {
  const target = interaction.options.getInteger('quantidade');

  // Verifica saldo antes
  await interaction.deferReply({ ephemeral: true });
  const stats = await callApi('stats', userPayload(interaction));

  if (stats.credits < target) {
    return interaction.editReply({
      content: `❌ Saldo insuficiente. Você precisa de **${target} DMs** mas tem **${stats.credits}**.\nUse \`/comprar\` para adicionar mais.`,
    });
  }

  // Inicia rascunho e abre modal
  drafts.set(interaction.user.id, { target_count: target });

  await interaction.editReply({
    content: `✏️ Vamos configurar sua campanha (**${target} DMs**). Clique abaixo para preencher os dados.`,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('camp_open_modal').setLabel('Configurar mensagem').setStyle(ButtonStyle.Primary).setEmoji('📝'),
        new ButtonBuilder().setCustomId('camp_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
      ),
    ],
  });
}

export function buildModal() {
  return new ModalBuilder()
    .setCustomId('camp_modal')
    .setTitle('Nova campanha')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('name').setLabel('Nome da campanha (interno)').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('message').setLabel('Mensagem que será enviada na DM').setStyle(TextInputStyle.Paragraph).setMaxLength(1500).setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('image_url').setLabel('URL da imagem (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('https://...')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('button_label').setLabel('Texto do botão (opcional)').setStyle(TextInputStyle.Short).setMaxLength(40).setRequired(false).setPlaceholder('Ex: Acessar agora')
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId('button_url').setLabel('URL do botão (opcional)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('https://...')
      ),
    );
}

export function buildPreview(draft) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('👀 Pré-visualização da DM')
    .setDescription(draft.message || '_(sem mensagem)_');
  if (draft.image_url) embed.setImage(draft.image_url);
  embed.addFields(
    { name: 'Nome interno', value: draft.name || '—', inline: true },
    { name: 'Quantidade', value: `${draft.target_count} DMs`, inline: true },
    { name: 'Custo', value: `${draft.target_count} DMs`, inline: true },
  );
  if (draft.button_label && draft.button_url) {
    embed.addFields({ name: 'Botão', value: `[${draft.button_label}](${draft.button_url})` });
  }
  return embed;
}

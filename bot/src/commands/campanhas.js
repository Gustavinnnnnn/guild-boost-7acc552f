import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { callApi, userPayload } from '../api.js';

export const data = new SlashCommandBuilder()
  .setName('campanhas')
  .setDescription('Liste suas últimas campanhas');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const { campaigns } = await callApi('campaigns', userPayload(interaction));

  if (!campaigns?.length) {
    return interaction.editReply('Você ainda não criou nenhuma campanha. Use `/divulgar` para começar.');
  }

  const lines = campaigns.slice(0, 10).map(c => {
    const icon = c.status === 'sent' ? '✅' : c.status === 'sending' ? '⏳' : '📝';
    const ratio = c.total_targeted ? Math.round((c.total_delivered / c.total_targeted) * 100) : 0;
    return `${icon} **${c.name}**\n› ${c.total_delivered}/${c.total_targeted} entregues (${ratio}%) · ${c.total_clicks} cliques · ${c.credits_spent} DMs gastas`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📋 Suas campanhas')
    .setDescription(lines);

  await interaction.editReply({ embeds: [embed] });
}

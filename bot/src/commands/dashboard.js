import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { callApi, userPayload } from '../api.js';

export const data = new SlashCommandBuilder()
  .setName('dashboard')
  .setDescription('Veja seu saldo de DMs e suas métricas');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const stats = await callApi('stats', userPayload(interaction));

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('📊 Seu Dashboard')
    .setDescription(`Olá <@${interaction.user.id}>, aqui está seu resumo:`)
    .addFields(
      { name: '💬 DMs disponíveis', value: `**${stats.credits.toLocaleString('pt-BR')}**`, inline: true },
      { name: '📨 Total entregue', value: `${stats.total_delivered.toLocaleString('pt-BR')}`, inline: true },
      { name: '👆 Cliques', value: `${stats.total_clicks.toLocaleString('pt-BR')}`, inline: true },
      { name: '🛒 DMs compradas', value: `${stats.total_bought.toLocaleString('pt-BR')}`, inline: true },
      { name: '🚀 DMs gastas', value: `${stats.total_spent.toLocaleString('pt-BR')}`, inline: true },
      { name: '📋 Campanhas', value: `${stats.total_campaigns}`, inline: true },
    )
    .setFooter({ text: 'Para o painel completo: /painel' });

  if (stats.recent_campaigns?.length) {
    const recent = stats.recent_campaigns.slice(0, 5).map(c => {
      const icon = c.status === 'sent' ? '✅' : c.status === 'sending' ? '⏳' : '📝';
      return `${icon} **${c.name}** — ${c.total_delivered}/${c.total_targeted} entregues`;
    }).join('\n');
    embed.addFields({ name: 'Campanhas recentes', value: recent });
  }

  await interaction.editReply({ embeds: [embed] });
}

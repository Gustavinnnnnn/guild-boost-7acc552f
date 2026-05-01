import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { callApi, userPayload } from '../api.js';

export const data = new SlashCommandBuilder()
  .setName('afiliado')
  .setDescription('Veja seu link de afiliado e ganhos');

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  try {
    const data = await callApi('affiliate', userPayload(interaction));
    const embed = new EmbedBuilder()
      .setColor(0xfbbf24)
      .setTitle('🎁 Seu programa de afiliado')
      .setDescription(`Indique amigos e ganhe **${Math.round(data.commission_rate * 100)}%** de cada compra que eles fizerem.`)
      .addFields(
        { name: '🔗 Seu link', value: `\`${data.link}\`` },
        { name: '🏷️ Código', value: `\`${data.code}\``, inline: true },
        { name: '👆 Cliques', value: `${data.total_clicks}`, inline: true },
        { name: '👥 Indicados', value: `${data.total_referrals}`, inline: true },
        { name: '💰 Ganho total', value: `R$ ${data.total_earned_brl}`, inline: true },
        { name: '💵 Disponível para saque', value: `R$ ${data.available_brl}`, inline: true },
      )
      .setFooter({ text: 'Saques pelo painel web (R$ 50 mínimo)' });
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    if (err.status === 404) {
      return interaction.editReply('Você ainda não tem código de afiliado. Use qualquer comando do bot pra ativar sua conta primeiro.');
    }
    throw err;
  }
}

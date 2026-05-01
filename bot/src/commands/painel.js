import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('painel')
  .setDescription('Abra o painel web (dashboard, métricas detalhadas, saques)');

export async function execute(interaction) {
  const url = 'https://guild-boost.lovable.app/app';
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🌐 Painel Web')
    .setDescription(`Acesse o painel completo para ver gráficos, histórico detalhado e sacar comissões de afiliado.\n\n${url}\n\n*O login é automático com sua conta Discord.*`);
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

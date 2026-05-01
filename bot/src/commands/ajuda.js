import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ajuda')
  .setDescription('Veja todos os comandos disponíveis');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('🤖 Comandos do CoinsDM')
    .setDescription('Aqui está tudo que você pode fazer:')
    .addFields(
      { name: '/dashboard', value: 'Veja seu saldo de DMs e métricas resumidas.' },
      { name: '/comprar `quantidade`', value: 'Compre DMs pagando via PIX (mínimo 150 = R$ 30).' },
      { name: '/divulgar `quantidade`', value: 'Crie e dispare uma campanha de DMs em massa.' },
      { name: '/campanhas', value: 'Liste suas últimas campanhas e métricas.' },
      { name: '/afiliado', value: 'Seu link de afiliado e ganhos.' },
      { name: '/painel', value: 'Acessar o painel web (gráficos detalhados).' },
    )
    .setFooter({ text: 'Dúvidas? Procure o suporte no servidor oficial.' });
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

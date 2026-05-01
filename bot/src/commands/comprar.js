import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { callApi, userPayload } from '../api.js';

export const data = new SlashCommandBuilder()
  .setName('comprar')
  .setDescription('Comprar DMs via PIX')
  .addIntegerOption(o =>
    o.setName('quantidade')
      .setDescription('Quantidade de DMs (mínimo 150 = R$ 30,00)')
      .setMinValue(150)
      .setMaxValue(50000)
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const dms = interaction.options.getInteger('quantidade');

  const data = await callApi('buy-dms', userPayload(interaction, { dms }));

  const embed = new EmbedBuilder()
    .setColor(0x00b894)
    .setTitle('💸 Pagamento PIX gerado')
    .setDescription(`**${dms.toLocaleString('pt-BR')} DMs** por **R$ ${data.amount_brl}**`)
    .addFields(
      { name: '📋 Código PIX (Copia e Cola)', value: `\`\`\`${data.pix_code}\`\`\`` },
      { name: '⏱️ Validade', value: data.expires_at ? `<t:${Math.floor(new Date(data.expires_at).getTime() / 1000)}:R>` : '~30 minutos', inline: true },
      { name: '🔖 Referência', value: `\`${data.reference}\``, inline: true },
    )
    .setFooter({ text: 'Após pagar, clique em "Já paguei" para confirmar.' });

  // QR code como imagem (se vier base64)
  if (data.qr_code_base64) {
    const buf = Buffer.from(data.qr_code_base64, 'base64');
    embed.setImage('attachment://qr.png');
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`pay_check_${data.reference}`).setLabel('Já paguei').setStyle(ButtonStyle.Success).setEmoji('✅'),
      new ButtonBuilder().setCustomId(`pay_cancel`).setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
    );
    return interaction.editReply({
      embeds: [embed],
      files: [{ attachment: buf, name: 'qr.png' }],
      components: [row],
    });
  }

  // Fallback sem imagem: gera QR via API pública
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.pix_code)}`;
  embed.setImage(qrUrl);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`pay_check_${data.reference}`).setLabel('Já paguei').setStyle(ButtonStyle.Success).setEmoji('✅'),
    new ButtonBuilder().setCustomId(`pay_cancel`).setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
  );
  await interaction.editReply({ embeds: [embed], components: [row] });
}

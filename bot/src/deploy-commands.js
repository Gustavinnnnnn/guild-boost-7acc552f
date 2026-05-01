// Registra os slash commands no Discord.
// Rode este script UMA VEZ depois de criar/alterar comandos:
//   node src/deploy-commands.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const commandsDir = join(__dirname, 'commands');
const files = (await readdir(commandsDir)).filter(f => f.endsWith('.js'));

const commands = [];
for (const file of files) {
  const mod = await import(pathToFileURL(join(commandsDir, file)).href);
  if (mod.data) commands.push(mod.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DEV_GUILD_ID;

try {
  if (guildId) {
    console.log(`📡 Registrando ${commands.length} comandos no servidor ${guildId}...`);
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log('✅ Comandos registrados (instantâneo neste servidor).');
  } else {
    console.log(`📡 Registrando ${commands.length} comandos GLOBAIS...`);
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log('✅ Comandos registrados globalmente (pode levar até 1h pra aparecer).');
  }
} catch (err) {
  console.error('Erro ao registrar:', err);
  process.exit(1);
}

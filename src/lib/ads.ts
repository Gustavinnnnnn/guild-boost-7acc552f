// Sistema de público estilo Meta/Facebook Ads
// Macro categorias agrupam nichos granulares (multi-seleção)

export type Niche = {
  value: string;
  label: string;
  emoji: string;
  description?: string;
};

export type CategoryGroup = {
  id: string;
  label: string;
  emoji: string;
  color: string; // tailwind classes
  description: string;
  niches: Niche[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "stores",
    label: "Lojas & E-commerce",
    emoji: "🛒",
    color: "from-orange-500/20 to-red-500/20 border-orange-500/40",
    description: "Pessoas que compram em lojas digitais",
    niches: [
      { value: "store_games", label: "Loja de Games", emoji: "🎮", description: "Jogos PC, console, mobile" },
      { value: "store_steam", label: "Loja Steam", emoji: "🟦", description: "Chaves, jogos da Steam" },
      { value: "store_robux", label: "Loja de Robux", emoji: "🟥", description: "Robux, gift cards Roblox" },
      { value: "store_blox_fruit", label: "Blox Fruit", emoji: "🍓", description: "Itens, contas, frutas" },
      { value: "store_roblox", label: "Loja de Roblox", emoji: "🟫", description: "Contas, itens Roblox" },
      { value: "store_streaming", label: "Loja de Streaming", emoji: "📺", description: "Netflix, Prime, Disney+" },
      { value: "store_balance", label: "Loja de Saldo", emoji: "💳", description: "Recargas, gift cards" },
      { value: "store_discord", label: "Produtos Discord", emoji: "🎟️", description: "Nitro, boosts, decorações" },
      { value: "store_general", label: "Loja Geral", emoji: "🏪", description: "E-commerce diverso" },
    ],
  },
  {
    id: "fps",
    label: "Jogos FPS / Tiro",
    emoji: "🔫",
    color: "from-red-500/20 to-rose-500/20 border-red-500/40",
    description: "Públicos competitivos de tiro",
    niches: [
      { value: "game_valorant", label: "Valorant", emoji: "🎯", description: "Players, ranked, smurf" },
      { value: "game_cs2", label: "CS2 / CS:GO", emoji: "🟧", description: "Skins, FACEIT, ranked" },
      { value: "game_cod", label: "Call of Duty", emoji: "🪖", description: "Warzone, MW, BO" },
      { value: "game_r6", label: "Rainbow Six", emoji: "🛡️", description: "Siege players" },
      { value: "game_apex", label: "Apex Legends", emoji: "🟥", description: "Predator, ranked" },
      { value: "game_overwatch", label: "Overwatch", emoji: "🟨", description: "OW2 players" },
    ],
  },
  {
    id: "battle_royale",
    label: "Battle Royale",
    emoji: "🪂",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/40",
    description: "Jogos de sobrevivência BR",
    niches: [
      { value: "game_freefire", label: "Free Fire", emoji: "🔥", description: "BR, diamantes, contas" },
      { value: "game_fortnite", label: "Fortnite", emoji: "🟪", description: "V-Bucks, skins, players" },
      { value: "game_pubg", label: "PUBG", emoji: "🪖", description: "Mobile e PC" },
      { value: "game_warzone", label: "Warzone", emoji: "🟫", description: "BR competitivo" },
    ],
  },
  {
    id: "sandbox_rp",
    label: "Sandbox / RP",
    emoji: "🧱",
    color: "from-emerald-500/20 to-green-500/20 border-emerald-500/40",
    description: "Mundos abertos, roleplay e construção",
    niches: [
      { value: "game_minecraft", label: "Minecraft", emoji: "🟩", description: "Servers, SMP, bedwars" },
      { value: "game_fivem", label: "FiveM / GTA RP", emoji: "🚓", description: "Cidades RP, GTA V" },
      { value: "game_roblox", label: "Roblox", emoji: "🟥", description: "Players, devs, traders" },
      { value: "game_terraria", label: "Terraria", emoji: "🟢", description: "Sandbox 2D" },
      { value: "game_rust", label: "Rust", emoji: "🟧", description: "Survival PvP" },
    ],
  },
  {
    id: "moba_mmo",
    label: "MOBA & MMO/RPG",
    emoji: "🐉",
    color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/40",
    description: "Estratégia em equipe e RPG online",
    niches: [
      { value: "game_lol", label: "League of Legends", emoji: "🛡️", description: "Ranked, ARAM, TFT" },
      { value: "game_dota", label: "Dota 2", emoji: "⚔️", description: "Players, ranked" },
      { value: "game_wow", label: "World of Warcraft", emoji: "🐺", description: "Raids, M+, PvP" },
      { value: "game_ffxiv", label: "Final Fantasy XIV", emoji: "🌟", description: "Endgame, RP" },
      { value: "game_lostark", label: "Lost Ark", emoji: "🗡️", description: "MMO ARPG" },
    ],
  },
  {
    id: "mobile",
    label: "Mobile Gaming",
    emoji: "📱",
    color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/40",
    description: "Jogos populares no celular",
    niches: [
      { value: "game_ml", label: "Mobile Legends", emoji: "🌙", description: "MLBB players" },
      { value: "game_cod_mobile", label: "COD Mobile", emoji: "📲", description: "BR e MP mobile" },
      { value: "game_clash", label: "Clash Royale / CoC", emoji: "⚔️", description: "Supercell" },
      { value: "game_genshin", label: "Genshin Impact", emoji: "✨", description: "HoYoverse fans" },
      { value: "game_brawl", label: "Brawl Stars", emoji: "⭐", description: "Players competitivos" },
    ],
  },
  {
    id: "servers",
    label: "Comunidades & Servidores",
    emoji: "💬",
    color: "from-indigo-500/20 to-blue-500/20 border-indigo-500/40",
    description: "Servidores Discord ativos",
    niches: [
      { value: "server_general", label: "Comunidade Geral", emoji: "🌐", description: "Conversa, amigos" },
      { value: "server_friends", label: "Interação & Amizade", emoji: "🤝", description: "Conhecer pessoas" },
      { value: "server_voice", label: "Voice & Podcasts", emoji: "🎙️", description: "Voz ativa, calls" },
      { value: "server_hype", label: "Web Hype / Drops", emoji: "🚀", description: "NFT, drops, trends" },
      { value: "server_meme", label: "Memes & Humor", emoji: "😂", description: "Memes, comédia" },
      { value: "server_namoro", label: "Namoro & Dating", emoji: "💕", description: "Solteiros" },
      { value: "server_18", label: "+18 / Adulto", emoji: "🔞", description: "NSFW, adultos" },
    ],
  },
  {
    id: "money",
    label: "Crypto & Trading",
    emoji: "💰",
    color: "from-yellow-500/20 to-amber-500/20 border-yellow-500/40",
    description: "Investidores e traders",
    niches: [
      { value: "money_crypto", label: "Crypto", emoji: "₿", description: "Bitcoin, altcoins" },
      { value: "money_trading", label: "Trading", emoji: "📊", description: "Day trade, forex" },
      { value: "money_business", label: "Negócios", emoji: "💼", description: "Empreendedorismo" },
      { value: "money_renda", label: "Renda extra", emoji: "💵", description: "Side hustle, freela" },
    ],
  },
  {
    id: "lifestyle",
    label: "Lifestyle & Hobby",
    emoji: "🌸",
    color: "from-pink-500/20 to-rose-500/20 border-pink-500/40",
    description: "Interesses pessoais",
    niches: [
      { value: "life_anime", label: "Anime & Mangá", emoji: "🌸", description: "Otaku, mangá" },
      { value: "life_music", label: "Música", emoji: "🎵", description: "Produtores, fãs" },
      { value: "life_tech", label: "Tecnologia", emoji: "💻", description: "Dev, IA, gadgets" },
      { value: "life_education", label: "Educação", emoji: "📚", description: "Estudo, vestibular" },
      { value: "life_fitness", label: "Fitness & Saúde", emoji: "💪", description: "Treino, dieta" },
    ],
  },
];

// Helpers
export const ALL_NICHES: Niche[] = CATEGORY_GROUPS.flatMap((g) => g.niches);

export const findNiche = (value: string): Niche | undefined =>
  ALL_NICHES.find((n) => n.value === value);

export const findGroupOfNiche = (value: string): CategoryGroup | undefined =>
  CATEGORY_GROUPS.find((g) => g.niches.some((n) => n.value === value));

// ============================================================
// SISTEMA DE MOEDA — Coins (estilo Robux/V-Bucks)
// `profiles.credits` representa COINS. 1 coin = 10 DMs entregues.
// ============================================================
export const DMS_PER_COIN = 1;

export const coinsToDms = (coins: number) => coins * DMS_PER_COIN;
export const dmsToCoins = (dms: number) => Math.ceil(dms / DMS_PER_COIN);

/** Formata coins com separador de milhar */
export const formatCoins = (coins: number) =>
  coins.toLocaleString("pt-BR");

// Compatibilidade com chamadas antigas que ainda usam nomes em "cents"
export const dmsToCents = dmsToCoins;
export const centsToDms = coinsToDms;
export const CENTS_PER_DM = 1; // não usado, só pra evitar quebrar imports
export const formatBRL = formatCoins; // alias temporário pra não quebrar imports antigos

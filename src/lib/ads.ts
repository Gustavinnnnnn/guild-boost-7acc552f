// Categorias de público estilo Meta Ads
export const CATEGORIES = [
  { value: "all", label: "Todos os públicos", emoji: "🌐" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "crypto", label: "Crypto & Trading", emoji: "💰" },
  { value: "anime", label: "Anime & Mangá", emoji: "🌸" },
  { value: "music", label: "Música", emoji: "🎵" },
  { value: "tech", label: "Tecnologia", emoji: "💻" },
  { value: "business", label: "Negócios", emoji: "📈" },
  { value: "education", label: "Educação", emoji: "📚" },
  { value: "general", label: "Comunidade geral", emoji: "💬" },
] as const;

export type CategoryValue = typeof CATEGORIES[number]["value"];

// Conversão: 1 coin = 10 DMs
export const DMS_PER_COIN = 10;
export const coinsToDms = (coins: number) => coins * DMS_PER_COIN;
export const dmsToCoins = (dms: number) => Math.ceil(dms / DMS_PER_COIN);

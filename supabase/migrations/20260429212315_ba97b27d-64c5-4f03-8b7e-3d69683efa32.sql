-- 1. Categoria nos servidores
ALTER TABLE public.discord_servers
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';

-- 2. Campanhas: target audience + breakdown de falhas
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS target_count integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS target_category text DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS failed_blocked integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_dm_closed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_deleted integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failed_other integer NOT NULL DEFAULT 0;

-- 3. Entregas: razão categorizada
ALTER TABLE public.campaign_deliveries
  ADD COLUMN IF NOT EXISTS failure_reason text;

-- 4. Default de credits muda pra 50 (1 coin = 10 DMs => 500 DMs grátis)
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 50;
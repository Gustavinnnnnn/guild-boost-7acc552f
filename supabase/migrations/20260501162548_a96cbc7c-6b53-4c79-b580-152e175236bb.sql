-- Tabela do bot próprio do usuário
CREATE TABLE public.user_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bot_token text,
  bot_id text,
  bot_username text,
  bot_avatar_url text,
  guild_id text,
  guild_name text,
  guild_member_count integer DEFAULT 0,
  access_paid boolean NOT NULL DEFAULT false,
  access_paid_at timestamptz,
  total_broadcasts integer NOT NULL DEFAULT 0,
  total_dms_sent integer NOT NULL DEFAULT 0,
  total_dms_failed integer NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bot" ON public.user_bots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bot" ON public.user_bots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own bot" ON public.user_bots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all bots" ON public.user_bots
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER user_bots_updated_at BEFORE UPDATE ON public.user_bots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Histórico de divulgações do bot próprio
CREATE TABLE public.bot_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_bot_id uuid NOT NULL REFERENCES public.user_bots(id) ON DELETE CASCADE,
  guild_id text NOT NULL,
  title text,
  message text NOT NULL,
  image_url text,
  button_label text,
  button_url text,
  embed_color text DEFAULT '#5865F2',
  status text NOT NULL DEFAULT 'sending',
  total_targeted integer NOT NULL DEFAULT 0,
  total_delivered integer NOT NULL DEFAULT 0,
  total_failed integer NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.bot_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own broadcasts" ON public.bot_broadcasts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all broadcasts" ON public.bot_broadcasts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_bot_broadcasts_user_created ON public.bot_broadcasts(user_id, created_at DESC);

-- Pagamentos PIX do acesso ao bot próprio (R$10)
CREATE TABLE public.user_bot_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reference text NOT NULL UNIQUE,
  paradise_transaction_id text,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  qr_code text,
  qr_code_base64 text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_bot_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own bot payments" ON public.user_bot_payments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all bot payments" ON public.user_bot_payments
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
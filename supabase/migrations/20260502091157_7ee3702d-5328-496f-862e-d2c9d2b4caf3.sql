CREATE TABLE public.user_selfbots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  user_token text,
  discord_user_id text,
  discord_username text,
  discord_avatar_url text,
  selected_guild_id text,
  selected_guild_name text,
  selected_guild_member_count integer DEFAULT 0,
  total_broadcasts integer NOT NULL DEFAULT 0,
  total_dms_sent integer NOT NULL DEFAULT 0,
  total_dms_failed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_selfbots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own selfbot" ON public.user_selfbots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own selfbot" ON public.user_selfbots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own selfbot" ON public.user_selfbots
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own selfbot" ON public.user_selfbots
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all selfbots" ON public.user_selfbots
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER user_selfbots_updated_at
  BEFORE UPDATE ON public.user_selfbots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.selfbot_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  selfbot_id uuid NOT NULL,
  guild_id text NOT NULL,
  guild_name text,
  message text NOT NULL,
  delay_seconds integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'sending',
  total_targeted integer NOT NULL DEFAULT 0,
  total_sent integer NOT NULL DEFAULT 0,
  total_failed integer NOT NULL DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE public.selfbot_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own selfbot broadcasts" ON public.selfbot_broadcasts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all selfbot broadcasts" ON public.selfbot_broadcasts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
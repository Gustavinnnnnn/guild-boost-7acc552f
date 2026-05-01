-- Adiciona campo target_server (jsonb) em campaigns para armazenar servidor rival selecionado
ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS target_server jsonb;

-- Bucket público para imagens de broadcasts do bot próprio
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-broadcasts', 'bot-broadcasts', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
DROP POLICY IF EXISTS "bot-broadcasts public read" ON storage.objects;
CREATE POLICY "bot-broadcasts public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bot-broadcasts');

DROP POLICY IF EXISTS "bot-broadcasts owner upload" ON storage.objects;
CREATE POLICY "bot-broadcasts owner upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'bot-broadcasts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "bot-broadcasts owner update" ON storage.objects;
CREATE POLICY "bot-broadcasts owner update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'bot-broadcasts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "bot-broadcasts owner delete" ON storage.objects;
CREATE POLICY "bot-broadcasts owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'bot-broadcasts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE TABLE public.prompt_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prompt_attachments_prompt ON public.prompt_attachments(prompt_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_attachments TO authenticated;
GRANT ALL ON public.prompt_attachments TO service_role;

ALTER TABLE public.prompt_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage prompt attachments"
  ON public.prompt_attachments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view prompt attachments"
  ON public.prompt_attachments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage prompt-attachments objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'prompt-attachments' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'prompt-attachments' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read prompt-attachments objects"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'prompt-attachments');

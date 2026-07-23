
CREATE TABLE public.prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_type TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view prompts" ON public.prompts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage prompts" ON public.prompts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON public.prompts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.prompts (document_type, prompt_text) VALUES
('Análise de Risco','Você é especialista em análise de documento de Análise de Risco conforme Lei nº 14.133/2021 e Decretos correlatos. Avalie a conformidade do documento identificando pontos fortes, ausências críticas e recomendações.'),
('DFD','Você é especialista em análise de conformidade de Documento de Formalização de Demanda (DFD). Analise o documento verificando aderência à Lei nº 14.133/2021 e forneça relatório detalhado com apontamentos e recomendações.'),
('ETP','Você é um especialista em análise de documento de Estudos Técnicos Preliminares (ETP) para contratações públicas sob a Lei nº 14.133/2021. Avalie cada item do checklist e emita relatório técnico com conformidade, observações e conclusão.'),
('Nota Técnica','Você é especialista em análise de documento de Nota Técnica verificando conformidade com as normas e a Lei nº 14.133/2021. Aponte inconsistências e sugira melhorias.'),
('Termo de Referência','Você é especialista em análise de documento de Termo de Referência verificando conformidade com as normas e a Lei nº 14.133/2021. Emita relatório com apontamentos e recomendações.');

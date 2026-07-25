-- Adiciona a coluna started_at em analyses.
--
-- Portada de marcelofmatos/vite_react_shadcn_ts (20260321000000_add_started_at_to_analyses.sql).
-- Motivo: os relatórios (OverviewReport, processHealth/ProcessSummary) usam started_at para
-- medir tempo de processamento, e o n8n grava esse campo ao mudar o status para processing.
-- Idempotente — no banco de produção atual (que já tem a coluna) é um no-op.

ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

COMMENT ON COLUMN public.analyses.started_at IS
  'Momento em que o processamento da análise começou (preenchido pelo workflow n8n).';

-- Adiciona a coluna secretaria em analyses e profiles.
--
-- Portada de marcelofmatos/vite_react_shadcn_ts:
--   20260526000000_add_secretaria_to_analyses.sql
--   20260122163827_fa1cae55-e0c8-4cf1-8b1a-e50a78f5fa98.sql (profiles)
--
-- Motivo: é pré-requisito dos relatórios "Por Secretaria" e do indicador de
-- secretarias na tela de gerenciamento de usuários — o ManageUsers.tsx já lê
-- profiles.secretaria (hoje sempre vazio, porque a coluna não existe).

-- ---------------------------------------------------------------------------
-- analyses.secretaria
-- ---------------------------------------------------------------------------
-- O DEFAULT fica mantido de propósito (diferente da migration original, que o
-- removia no fim): o formulário de upload ainda NÃO envia este campo. Sem o
-- default, todo upload passaria a falhar por violar o NOT NULL. As linhas já
-- existentes também ficam preenchidas com 'Não informado' em vez de NULL, o
-- que mantém os agrupamentos dos relatórios consistentes.
--
-- Depois que o upload passar a gravar a secretaria, remover com:
--     ALTER TABLE public.analyses ALTER COLUMN secretaria DROP DEFAULT;
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS secretaria TEXT NOT NULL DEFAULT 'Não informado';

COMMENT ON COLUMN public.analyses.secretaria IS
  'Sigla da secretaria/órgão demandante, preenchida pelo usuário no upload.';

CREATE INDEX IF NOT EXISTS idx_analyses_secretaria
  ON public.analyses(secretaria);

-- ---------------------------------------------------------------------------
-- profiles.secretaria
-- ---------------------------------------------------------------------------
-- Nullable: nem todo usuário tem vínculo informado, e a tela de usuários já
-- trata a ausência exibindo "-".
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS secretaria TEXT;

COMMENT ON COLUMN public.profiles.secretaria IS
  'Secretaria à qual o usuário está vinculado.';

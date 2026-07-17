## Objetivo
Melhorar a experiência na aba **Minhas Análises** exibindo um **pop-up (modal)** com detalhes sempre que uma análise estiver com status `error`, reduzindo a incerteza do usuário sobre a falha.

## Escopo (somente frontend)
Arquivo alterado: `src/pages/Analyses.tsx`

Nenhuma mudança em backend, banco ou edge functions.

## Comportamento

1. **Indicação visual na linha da tabela**
   - Quando `status === 'error'`, além do badge "Erro" já existente, adicionar um botão de ação "Ver erro" (ícone `AlertCircle` do lucide-react, cor destructive) ao lado dos botões existentes.
   - Clicar no botão abre o modal de erro para aquela análise.

2. **Pop-up automático para novos erros**
   - Ao carregar a lista e via realtime (`postgres_changes`), detectar análises que **transitaram para `error`** desde a última renderização (comparando IDs num `Set` em `useRef`).
   - Para cada nova análise em erro, disparar automaticamente:
     - Um `toast.error` (sonner) curto: "Falha na análise do processo X".
     - Abrir o modal de erro com os detalhes da análise mais recente que falhou (apenas uma vez por sessão, para não abrir repetidamente).

3. **Modal de erro (novo `AlertDialog` ou `Dialog`)**
   Conteúdo:
   - Título: "Falha na análise do documento"
   - Processo, Tipo de documento, Data/Hora
   - Mensagem de erro amigável (ex.: "Não foi possível concluir a análise deste documento.")
   - Detalhes técnicos (colapsáveis) extraídos de `resultado_json?.error` / `resultado_json?.message` quando existirem; fallback: "Erro não especificado pelo servidor."
   - Sugestões de próximos passos:
     - Verificar se o arquivo é um PDF/DOCX válido e legível
     - Tentar reenviar o documento em "Nova Análise"
     - Se persistir, excluir a análise com falha e contatar o administrador
   - Botões: **Excluir análise** (reaproveita fluxo de delete existente) e **Fechar**.

## Detalhes técnicos

- Novos estados em `Analyses.tsx`:
  - `errorDialogOpen: boolean`
  - `errorAnalysis: Analysis | null`
  - `useRef<Set<string>>` para IDs já vistos como erro (evita re-abrir modal em cada refetch/realtime tick).
- Novo handler `openErrorDialog(analysis)` usado tanto pelo botão manual quanto pela detecção automática.
- Reuso de componentes shadcn já presentes: `Dialog`, `Button`, `Badge`, `Alert` (se necessário criar aviso interno).
- Import adicional: `AlertCircle` de `lucide-react`.
- Sem novas dependências.

## Fora do escopo
- Nenhuma alteração no pipeline de análise (edge function `analyze-document`) nem no schema `analyses`.
- Não alterar comportamento de status `pending`/`processing`/`success`.
## Objetivo
Na aba **Minhas Análises**, quando uma análise estiver com status **Erro**, exibir um modal em português explicando o que aconteceu, para melhorar a experiência do usuário.

## Mudanças

### 1. `src/pages/Analyses.tsx`
- Adicionar botão **"Ver erro"** (ícone `AlertCircle` vermelho) na coluna Ações, visível apenas quando `analysis.status === 'error'`.
- Novo estado `errorDialogOpen` + `selectedError`.
- Novo `Dialog` que mostra:
  - Título: "Ocorreu um erro na análise"
  - Nome do processo e tipo de documento
  - Data/hora da tentativa
  - Mensagem amigável em pt-BR traduzida a partir do campo de erro salvo (`resultado_json.error`, `resultado_json.message` ou fallback)
  - Sugestões de próximos passos (verificar o arquivo, tentar novamente, contatar o administrador)
  - Botão "Fechar"

### 2. Helper de tradução de erro (inline no arquivo)
Função `getFriendlyError(analysis)` que:
- Lê `resultado_json?.error` / `resultado_json?.message` / `resultado_json?.detalhe`.
- Mapeia padrões comuns para mensagens em pt-BR:
  - Timeout / "timed out" → "O tempo de processamento foi excedido. Tente enviar um arquivo menor ou reprocessar."
  - "invalid file" / "unsupported" → "Formato de arquivo inválido ou não suportado. Envie um PDF válido."
  - "rate limit" / 429 → "Limite de requisições da IA atingido. Aguarde alguns minutos e tente novamente."
  - "payment" / 402 → "Créditos de IA insuficientes. Contate o administrador do sistema."
  - "extract" / "empty" → "Não foi possível extrair o conteúdo do documento. Verifique se o PDF não está protegido ou digitalizado como imagem."
  - fallback → "Ocorreu uma falha inesperada durante a análise. Tente reprocessar o documento ou contate o suporte."

## Fora do escopo
- Não altera a edge function nem o formato de armazenamento de erro.
- Não altera outras telas (AllAnalyses etc.) — apenas "Minhas Análises" conforme solicitado.

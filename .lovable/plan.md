
# Melhorias em relatórios e feedback de processamento

## 1. Identificação do analista no cabeçalho do relatório

Local: `src/pages/Analyses.tsx` (função `handleDownloadReport`) e `Dialog` de visualização do relatório.

- Buscar o `profiles` (nome + email) do `user_id` da análise ao gerar o PDF/visualizar.
- Adicionar bloco "Analista Responsável" no cabeçalho do PDF logo abaixo do título:
  - Nome do analista
  - E-mail
  - ID do usuário (curto) — para rastreabilidade
  - Data/hora de geração do relatório
- Mesmo bloco renderizado no topo do Dialog "Ver relatório".
- Também adicionar a identificação no PDF gerado pela edge function `analyze-document` (campo `relatorio_html`) para que fique persistido no relatório oficial.

## 2. Reorganização das informações do relatório

Reestruturar o layout do PDF (`handleDownloadReport`) e do HTML do relatório em seções bem demarcadas, com títulos e espaçamento:

```text
┌─ Cabeçalho institucional (logo SIAC-SELC + título) ─┐
├─ 1. Identificação                                    │
│    • Processo, Tipo de documento, Data análise      │
│    • Analista responsável (novo)                    │
├─ 2. Resumo Executivo                                 │
│    • % Conformidade (destaque)                      │
│    • Status final                                   │
├─ 3. Checklist de Conformidade (tabela)              │
├─ 4. Análise Detalhada (relatório da IA)             │
├─ 5. Conclusão Técnica                                │
└─ Rodapé: paginação + timestamp + hash               │
```

- Usar fontes/tamanhos hierárquicos (título 16pt, seção 12pt bold, corpo 10pt).
- Separadores entre seções.
- Aplicar a mesma organização no Dialog de visualização (HTML).

## 3. Indicador de progresso durante a análise

Local: `src/components/DocumentUploadSection.tsx` + `src/pages/Analyses.tsx`.

**Durante o envio (upload form):**
- Substituir o botão "Processando..." por um painel de status com barra de progresso e etapas:
  1. Enviando arquivo (upload storage)
  2. Registrando análise (insert)
  3. Notificando processador (webhook + edge function)
  4. Aguardando análise da IA
- Cada etapa muda `step` no state e a barra `<Progress>` avança (25/50/75/100).
- Após conclusão do submit, manter um card "Análise em andamento" mostrando status realtime do registro criado (via subscription na tabela `analyses`) até virar `success` ou `error`.

**Na tabela "Minhas Análises":**
- Substituir badge estático das análises em `pending`/`processing` por uma barra de progresso animada (indeterminada) + label da etapa atual.
- Usar realtime (já existe) para atualizar automaticamente quando status mudar.

## Detalhes técnicos

- Nenhuma mudança de schema. O `profiles` já tem `name` e `email`.
- Buscar profile via `supabase.from('profiles').select('name,email').eq('id', analysis.user_id).single()` no download; cache em memória por sessão para evitar refetch.
- Adicionar componente reutilizável `AnalysisProgress.tsx` com steps.
- PDF: continuar usando `jsPDF`; adicionar helper `drawSection(title)` para padronizar.
- Edge function `analyze-document`: incluir cabeçalho "Analista: {nome} <{email}>" no `relatorio_html` gerado, buscando o profile do `user_id` da análise.

## Objetivo

Ajustar a tela "Ver Relatório" (aba **Todas as Análises**) em dois pontos:

1. Refazer o **cabeçalho** do relatório para o novo padrão da imagem 1 (Detalhes da Análise + Informações Gerais + Métricas de Desempenho + Resumo do Documento).
2. Fazer com que as colunas **ITEM** e **ELEMENTO AVALIADO** tragam o conteúdo real extraído do documento (ex.: `5 e 5.16` / "Minuta Padronizada (SELC) e Formatação"), e não mais os códigos fixos `DOC-01…DOC-05`.

---

## 1. Novo cabeçalho do relatório

Reescrever a parte superior de `src/components/reports/ReportView.tsx` para reproduzir a imagem 1:

- Título "**Detalhes da Análise**" com botão **Imprimir** no canto direito (mantém os demais botões PDF/Word/Copiar logo abaixo, discretos).
- Bloco **Informações Gerais** em grade 2 colunas:
  - Usuário (nome do analista) • Processo
  - Tipo de Documento • Status (badge azul "Concluído")
  - Conformidade (percentual em destaque)
- Card **Métricas de Desempenho** (fundo cinza claro, ícone de relógio) com 3 colunas:
  - Entrada do Documento • Início do Processamento • Fim do Processamento
  - Linha inferior: Tempo de processamento • Tempo total desde a entrada
  (Datas em `dd/MM/yyyy 'às' HH:mm:ss`; entrada = `created_at`, início/fim aproximados a partir de `created_at`/`completed_at`).
- Seção **Relatório Detalhado** com título centralizado "Relatório de Análise de Conformidade - {tipo_documento}" em faixa cinza clara.
- Bloco **Resumo do Documento** (borda azul à esquerda) com Processo, Secretaria, Objeto, Base Normativa e Responsáveis, lidos do `resultado_json` (campos `resumo_documento.{processo, secretaria, objeto, base_normativa, responsaveis}`), com fallback quando o campo não existir.

Nenhuma outra seção (Tabela, Resumo Quantitativo, Conclusão) muda de layout — apenas o cabeçalho acima delas.

## 2. Itens reais do documento na tabela

Hoje o caminho genérico (Termo de Referência, Nota Técnica, Análise de Risco, DFD) envia à IA um checklist fixo `DOC-01…DOC-05` e o schema só devolve `codigo` — por isso "Item" e "Elemento Avaliado" ficam iguais e sem sentido.

Ajustes em `supabase/functions/analyze-document/index.ts` (caminho genérico, ~linhas 320–400):

- Remover o checklist fixo `DOC-01…DOC-05` para tipos que não são ETP/DFD-PCA. Em vez disso, instruir a IA a **identificar dinamicamente os itens/cláusulas relevantes do próprio documento** (ex.: seções "5", "5.1", "5.16", com seus títulos) e avaliá-los frente à Lei 14.133/2021 e normas correlatas.
- Ampliar o schema `itens_checklist` com dois novos campos obrigatórios:
  - `codigo` → identificador real do item no documento (ex.: `"5 e 5.16"`, `"5.1"`, `"5.1 (j)"`).
  - `elemento_avaliado` → nome/tema do item (ex.: "Minuta Padronizada (SELC) e Formatação").
  - manter `status`, `justificativa`, `recomendacao`.
- Adicionar também `resumo_documento` opcional no schema (`processo`, `secretaria`, `objeto`, `base_normativa`, `responsaveis`) para alimentar o novo bloco "Resumo do Documento".
- Atualizar o prompt do usuário para pedir explicitamente: "extraia os códigos/seções tal como aparecem no documento; use o número/letra da cláusula analisada e um título curto do elemento".

Ajustes em `src/lib/reportUtils.ts`:

- No mapeamento de `itens_checklist`, usar `row.elemento_avaliado` para o campo `elemento` (fallback para `row.codigo`), preservando `row.codigo` como código do item.
- Expor `resumo_documento` em `NormalizedReport` para o cabeçalho consumir.

O caminho ETP (`tabela_analise` / `item_verificado`) já funciona corretamente e não é alterado.

## Fora do escopo

- PDF export, Resumo Quantitativo, Conclusão e demais telas permanecem inalterados.
- Nenhuma mudança de banco de dados/RLS.

## Detalhes técnicos

- Arquivos alterados: `src/components/reports/ReportView.tsx`, `src/lib/reportUtils.ts`, `supabase/functions/analyze-document/index.ts`.
- Análises antigas (sem `elemento_avaliado`/`resumo_documento`) continuam funcionando via fallback; para ver o novo formato completo é preciso reprocessar (botão **Reprocessar** já existente em "Todas as Análises").

# Redesign do Relatório de Auditoria — Estilo Executivo BI

Reformulação puramente visual e estrutural do relatório de análise. **Todo o conteúdo técnico atual (itens do checklist, observações, conclusões, percentuais, fundamentação legal, dados do analista) será preservado 100%** — apenas a apresentação muda.

## Escopo

Redesign aplicado em duas superfícies:
1. **Visualização in-app** (modal "Ver Relatório" em `Minhas Análises`) — nova experiência interativa com accordions, cards, gráficos e botões de ação.
2. **Exportação PDF** (botão Download em `Minhas Análises`) — versão paginada, executiva, com cabeçalho institucional, cards de indicadores, tabela colorida, gráficos e seções bem hierarquizadas.

Prioridade inicial: **relatórios ETP** (que já têm dados estruturados em `resultado_json`). Relatórios genéricos (demais tipos) receberão o mesmo layout aproveitando o `resultado_json` já existente.

## Nova Estrutura do Relatório

```text
┌──────────────────────────────────────────────────────────┐
│  CABEÇALHO EXECUTIVO                                     │
│  Logo SIAC-SELC   |   Título/Processo/Tipo/Data/Status   │
│                                                          │
│         ┌────────────────────┐                           │
│         │  Circular Progress │  Badge de Conformidade    │
│         │      66,67%        │  Progress Bar colorida    │
│         └────────────────────┘                           │
├──────────────────────────────────────────────────────────┤
│  CARDS DE INDICADORES (grid 4 col)                       │
│  [Processo] [Tipo] [Tempo] [Data]                        │
│  [Itens]    [Conforme] [Parcial] [Não Conforme]          │
├──────────────────────────────────────────────────────────┤
│  RESUMO EXECUTIVO (card)                                 │
│  • Objetivo • Conformidades • Não-conformidades          │
│  • Nível de risco (badge) • Conclusão resumida           │
├──────────────────────────────────────────────────────────┤
│  TABELA DE ANÁLISE (moderna, colunas separadas)          │
│  Item | Elemento | Situação (badge) | Obs | Recomend.    │
│  Cada linha expansível (Accordion):                      │
│    → Fundamentação legal (card 📚)                       │
│    → Evidências                                          │
│    → Observações                                         │
│    → Recomendações                                       │
│    → Badge de Criticidade (🔴🟠🟢)                       │
├──────────────────────────────────────────────────────────┤
│  RECOMENDAÇÕES DA AUDITORIA (lista consolidada)          │
├──────────────────────────────────────────────────────────┤
│  ESTATÍSTICAS (Recharts)                                 │
│  Pizza | Barras | Radar                                  │
├──────────────────────────────────────────────────────────┤
│  CONCLUSÃO EXECUTIVA (card destacado)                    │
│  Percentual | Situação | Parecer IA | Próximas ações     │
└──────────────────────────────────────────────────────────┘
Barra de ações fixa: [Expandir tudo] [Recolher tudo]
                     [Imprimir] [Exportar PDF] [Exportar Word] [Copiar Resumo]
```

## Plano de Implementação

### 1. Novo componente `ReportView` (in-app)
Arquivo: `src/components/reports/ReportView.tsx`
- Recebe `analysis` + `analyst` como props.
- Renderiza toda a estrutura acima usando shadcn/ui (`Card`, `Badge`, `Progress`, `Accordion`, `Tabs`, `Table`, `Separator`), Lucide icons e Recharts.
- Sub-componentes: `ReportHeader`, `IndicatorCards`, `ExecutiveSummary`, `AnalysisTable`, `LegalBasisCard`, `RecommendationsList`, `StatsCharts`, `ConclusionCard`, `ReportActions`.
- Consome `resultado_json` (já contém `tabela_analise`, `conclusao_tecnica`, `conformidade_percentual`); faz fallback gracioso para relatórios antigos (usa `relatorio_html` como conteúdo bruto dentro do bloco "Análise Detalhada").
- Derivação de criticidade a partir da conformidade quando o JSON não trouxer explicitamente (`NAO_ATENDE`→Alta, `ATENDE_PARCIALMENTE`→Média, `ATENDE`→Baixa).
- Detecção automática de fundamentação legal via regex nas observações (`Lei 14.133`, `IN 58`, `IN 65`, `Decreto`) — extrai e exibe em card 📚 dentro do accordion.

### 2. Integração no modal atual
Arquivo: `src/pages/Analyses.tsx`
- Substituir o `dangerouslySetInnerHTML` do `Dialog` "Ver Relatório" por `<ReportView analysis={selectedAnalysis} analyst={selectedAnalyst} />`.
- Aumentar largura do dialog para `max-w-6xl`.
- Manter carregamento do perfil do analista já existente.

### 3. Novo gerador de PDF executivo
Arquivo: `src/lib/reportPdf.ts` (novo)
- Função `exportReportPDF(analysis, analyst)` usando `jsPDF` + `jspdf-autotable` (adicionar dependência).
- Layout paginado:
  - **Capa/Cabeçalho institucional** (faixa azul-marinho, logo, título, metadados)
  - **Cards de indicadores** (retângulos com ícone, título, valor)
  - **Barra de conformidade colorida** + percentual grande
  - **Resumo Executivo** (bloco com bordas suaves)
  - **Tabela de análise** via `autoTable` com badges coloridos (verde/amarelo/vermelho/cinza) por status
  - **Recomendações da Auditoria** (lista numerada)
  - **Conclusão Técnica** (card destaque)
  - **Rodapé** com identificação do analista + paginação em todas as páginas
- Substitui a função `handleDownloadReport` atual em `Analyses.tsx`.

### 4. Ações extras do relatório
No `ReportView`:
- **Imprimir**: `window.print()` com `@media print` dedicado.
- **Exportar PDF**: chama `exportReportPDF`.
- **Exportar Word**: gera `.doc` HTML-based (blob `application/msword`) reutilizando o markup do ReportView.
- **Copiar Resumo**: `navigator.clipboard.writeText` com o resumo executivo + percentual.
- **Expandir/Recolher todos**: controla estado do Accordion.

### 5. Design tokens
- Reutiliza tokens existentes de `index.css` (institucional azul-marinho já configurado).
- Adiciona utilitários semânticos (se ainda não existirem): `conformity-success`, `conformity-warning`, `conformity-danger`, `conformity-neutral` — todas via HSL em `index.css` e mapeadas no `tailwind.config.ts`.
- Nenhuma cor hardcoded nos componentes.

### 6. Sem alterações de conteúdo
- Nenhuma mudança em `supabase/functions/analyze-document/index.ts` nesta iteração — os dados já produzidos são suficientes.
- Nenhuma mudança de schema, RLS, prompt de IA ou lógica de negócio.

## Detalhes Técnicos

**Dependências novas:**
- `jspdf-autotable` (para tabela colorida no PDF).

**Arquivos criados:**
- `src/components/reports/ReportView.tsx`
- `src/components/reports/ReportHeader.tsx`
- `src/components/reports/IndicatorCards.tsx`
- `src/components/reports/ExecutiveSummary.tsx`
- `src/components/reports/AnalysisTable.tsx`
- `src/components/reports/StatsCharts.tsx`
- `src/components/reports/ConclusionCard.tsx`
- `src/components/reports/ReportActions.tsx`
- `src/lib/reportPdf.ts`
- `src/lib/reportUtils.ts` (helpers: criticidade, extração de base legal, agregações)

**Arquivos modificados:**
- `src/pages/Analyses.tsx` (dialog usa ReportView; download chama novo `exportReportPDF`)
- `src/index.css` e `tailwind.config.ts` (tokens de conformidade — se necessário)

**Compatibilidade:**
- Relatórios ETP → usam `resultado_json.tabela_analise` e `resultado_json.conclusao_tecnica`.
- Relatórios genéricos → usam `resultado_json.itens_checklist`, `resumo_executivo`, `recomendacoes_prioritarias`.
- Relatórios legados sem `resultado_json` → renderiza cabeçalho + indicadores + fallback para `relatorio_html` no bloco "Análise Detalhada".

## Fora do Escopo
- Alterar prompts da IA ou schema de dados.
- Traduzir para outros idiomas.
- Editar o conteúdo textual gerado pela IA.

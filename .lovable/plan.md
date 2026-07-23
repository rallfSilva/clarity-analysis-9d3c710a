## Refazer "Ver Relatório" (aba Todas as Análises) + reformular PDF

### 1. `src/components/reports/ReportView.tsx` — nova Tabela de Análise (modelo image-19)

Substituir a tabela atual por uma tabela conforme o mockup:

- Cabeçalho do bloco: card branco com ícone de documento em círculo azul-claro, título **"Tabela de Análise"** e chip **"N itens"** à direita.
- Colunas: **Item** (código monoespaçado), **Elemento Avaliado**, **Situação** e **Criticidade**.
- Badges pill:
  - Situação: verde (Conforme), amarelo (Parcialmente Conforme), vermelho (Não Conforme), cinza (Não se Aplica).
  - Criticidade: com bolinha colorida à esquerda + rótulo Baixa/Média/Alta (verde/laranja/vermelho).
- **Remover a seta/expand**. O bloco **OBSERVAÇÕES / EVIDÊNCIAS** aparece sempre visível abaixo do item, dentro de um mini-card cinza-claro com borda fina e ícone de documento (igual ao mockup), abrangendo apenas a largura das duas primeiras colunas.
- Alternância de linhas mais suave; sem qualquer botão de expandir.
- Manter os demais blocos (Resumo Quantitativo, Conclusão e Recomendações, header do relatório e barra de ações) inalterados.

### 2. `src/lib/reportPdf.ts` — reformatar impressão

Refazer o layout do PDF para ficar limpo, alinhado e sem sobreposição:

- **Cabeçalho institucional** compacto (faixa navy) com título "Relatório de Análise de Conformidade — Lei 14.133/2021" e subtítulo.
- **Bloco de metadados** em duas colunas alinhadas (Processo, Tipo, Data, Tempo, Analista, E-mail/ID) — sem sobrepor o gauge.
- **Gauge de conformidade** em card próprio abaixo do cabeçalho, ocupando largura total, com barra de progresso alinhada.
- **Cards indicadores** (Itens, Conforme, Parcial, Não Conforme) em uma linha, com larguras iguais calculadas a partir da largura útil.
- **Resumo Executivo / Pontos Fortes / Ausências Críticas** com quebra de página automática.
- **Tabela de Análise** via `autoTable`, reproduzindo o mesmo modelo do mockup:
  - Colunas: Item, Elemento Avaliado, Situação, Criticidade, Observações / Evidências.
  - Larguras proporcionais à página A4 útil (evita corte).
  - Situação e Criticidade com cor de fundo suave + texto colorido (não branco em fundo forte, para leitura em impressão).
  - `cellPadding` maior, `overflow: 'linebreak'`, `valign: 'top'`.
- **Recomendações** numeradas com espaçamento consistente e quebra de página segura.
- **Conclusão Técnica** em card com borda azul, valor de conformidade + situação final e parecer justificado.
- **Rodapé** em todas as páginas: linha fina, "Analista • ID • Gerado em" à esquerda e "Página X de Y" à direita.
- Margens uniformes (15 mm) e helper `ensureSpace` usado antes de cada bloco para evitar overflow.

### Escopo

Somente frontend/presentation (`ReportView.tsx` e `reportPdf.ts`). Sem mudanças em schema, edge functions ou lógica de negócio.

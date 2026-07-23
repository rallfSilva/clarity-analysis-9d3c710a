## Ajustar "Ver Relatório" (aba Todas as Análises) para seguir o modelo em anexo

Alterar apenas `src/components/reports/ReportView.tsx` — bloco **Tabela de Análise**.

### Mudanças na tabela

- Renomear título para **"Tabela de Análise Detalhada por Item"**.
- Cabeçalho com fundo azul claro (`bg-blue-50`) e texto em azul-escuro, alinhado à esquerda.
- **Remover a coluna "Criticidade"**.
- Colunas finais (4):
  1. **Item** — código monoespaçado, largura estreita.
  2. **Elemento Avaliado** — nome do item, largura média.
  3. **Situação** — badge pill colorida centralizada (verde Conforme, amarelo Parcialmente Conforme, vermelho Não Conforme, cinza Não se Aplica), sem bolinha.
  4. **Observações / Recomendações** — texto corrido (observação + recomendação concatenadas), sem card interno, sem ícone.
- Linhas com bordas cinza finas em todas as células (grid completo), padding confortável, `align-top`, texto pequeno legível.
- Zebra suave opcional (linhas alternadas em branco/cinza muito claro).
- Manter o chip "N itens" no canto do cabeçalho do card.

### Fora do escopo

- Sem alterações no PDF, nas demais seções (Resumo Quantitativo, Conclusão) ou em qualquer outra página. Apenas presentation da tabela conforme mockup.

## Objetivo

Ajustar apenas o layout dos 3 cards de KPI (Total de Prompts, Ativos, Inativos) em `src/pages/admin/ManagePrompts.tsx` para bater fielmente com o mockup. Tabela, busca, modal e lógica ficam intactos.

## Mudanças visuais nos KPIs

Arquivo: `src/pages/admin/ManagePrompts.tsx`

- Cards mais amplos e "arejados":
  - Padding interno maior (`p-6` em vez de `p-5`).
  - Fundo branco puro (`bg-card`), borda sutil `border-border/50`, cantos `rounded-xl`, sem sombra pesada.
- Tipografia dos KPIs igual ao mockup:
  - Rótulo: `text-sm font-medium text-muted-foreground` (não uppercase, não `text-xs`).
  - Número: `text-4xl font-bold`, com espaçamento maior acima (`mt-3`).
  - Hint: `text-xs text-muted-foreground mt-2`.
- Cores por card:
  - Total de Prompts → número em `text-foreground` (preto/navy).
  - Ativos → número em verde `text-emerald-600` (mantém).
  - Inativos → número em `text-foreground` quando > 0, `text-muted-foreground` quando 0 (mockup mostra `0` mais apagado, já é o caso).
- Grid mantém `grid-cols-1 md:grid-cols-3 gap-4`.

Nada mais é alterado (tabela, contador do clipe, modal, ações permanecem como estão).

## Fora de escopo

- Contador do ícone de clipe (fica como está por ora — usuário indicou que representa anexos, mas isso exigiria nova tabela/relacionamento; trataremos em uma solicitação separada quando decidirmos o modelo de anexos).
- Remoção do tipo "DFD do PCA" do select (não solicitado agora).

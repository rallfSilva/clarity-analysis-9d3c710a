## Redesign do Dashboard SIAC-SELC

Reformular o Dashboard principal seguindo fielmente o mockup anexado, com sidebar azul-escuro institucional, header de saudação, 4 cards de KPIs, 3 gráficos (line, donut, bar) e lista de análises recentes.

---

### 1. Tema e tokens de design (`src/index.css` + `tailwind.config.ts`)

Adicionar/ajustar tokens HSL para o tema institucional SELC:

- `--sidebar-background`: azul-marinho profundo (#0B1F4D)
- `--sidebar-foreground`: branco
- `--sidebar-accent`: azul ativo (#1D4ED8)
- `--primary`: azul institucional (#1D4ED8)
- `--background`: cinza-azulado claro (#F5F7FB)
- `--success` (#22C55E), `--warning` (#F59E0B), `--danger` (#EF4444)
- Card radius `2xl`, sombras suaves (`--shadow-card`)
- Fonte **Inter** via Google Fonts no `index.html`

Manter tokens existentes para não quebrar outras telas; adicionar as novas variáveis.

---

### 2. Sidebar (`src/components/AppSidebar.tsx`)

Reestilizar com fundo azul-escuro, logo "SIAC SELC" com ícone de check, seções rotuladas em uppercase ("PRINCIPAL", "ADMINISTRAÇÃO"), item ativo com fundo azul claro e texto branco, hover suave, ícones outline (Lucide). Manter colapsável e a lógica de role admin existente.

---

### 3. Header (`src/components/DashboardLayout.tsx`)

Atualizar header para incluir:
- Saudação dinâmica "Olá, {nome} 👋" + subtítulo
- Sino de notificações com badge
- Avatar + nome + tipo de usuário (dropdown)
- Botão "+ Nova Análise" (azul, arredondado) que navega para `/upload/etp` (ou abre seletor)

A saudação ficará na página Dashboard, não no header global, para não poluir outras rotas. O header global mantém apenas notificações + perfil + botão Nova Análise.

---

### 4. Novos componentes do Dashboard

Criar em `src/components/dashboard/`:

- **StatCards.tsx** — 4 cards (Total de Análises, Conformidade Média, Em Processamento, Não Conformidades) com ícone colorido em círculo pastel, valor grande, descrição e badge de tendência (↗ verde / ↘ vermelho).
- **ComplianceChart.tsx** — Recharts `AreaChart` (linha azul + área preenchida suave), filtro de período (7/30/90 dias) via Select, tooltip customizado.
- **StatusChart.tsx** — Recharts `PieChart` em formato donut com legenda lateral mostrando contagem e percentual por status.
- **DepartmentChart.tsx** — Recharts `BarChart` vertical, barras azuis com labels acima.
- **RecentAnalyses.tsx** — Lista com ícone de documento, código, tipo, data, badge de status verde "Concluída" e barra de progresso com percentual. Link "Ver todas" → `/analyses`.

---

### 5. Página `src/pages/Dashboard.tsx`

Reescrever para compor: saudação + grid de StatCards (4 col desktop / 2 tab / 1 mobile) + grid 2 col (ComplianceChart | StatusChart) + grid 2 col (DepartmentChart | RecentAnalyses) + footer "SIAC-SELC © 2026 — v1.0.0".

---

### 6. Dados

Buscar dados reais da tabela `analyses` via Supabase:

- Total / em processamento / não conformidades / conformidade média (agregações sobre `status` e `conformidade_percentual`)
- Série temporal de conformidade média por dia (últimos N dias) para o line chart
- Distribuição por `status` para o donut
- Análises recentes (últimas 4–5) para a lista

Para o gráfico "Demandas por Secretaria": como não existe campo `secretaria` na tabela, usar dados mockados nesta primeira versão (com TODO para extrair de `processo` futuramente).

Hook novo `src/hooks/useDashboardData.tsx` usando react-query.

---

### 7. Bibliotecas

- `recharts` já instalado
- `framer-motion` adicionar para animações de entrada dos cards
- `lucide-react` já instalado

---

### Arquivos modificados/criados

| Arquivo | Ação |
|---|---|
| `src/index.css` | Adicionar tokens SELC + import Inter |
| `tailwind.config.ts` | Cores success/warning/danger, radius 2xl |
| `index.html` | Fonte Inter |
| `src/components/AppSidebar.tsx` | Restilização institucional |
| `src/components/DashboardLayout.tsx` | Novo header (notif, avatar, botão CTA) |
| `src/pages/Dashboard.tsx` | Reescrita completa |
| `src/components/dashboard/StatCards.tsx` | Novo |
| `src/components/dashboard/ComplianceChart.tsx` | Novo |
| `src/components/dashboard/StatusChart.tsx` | Novo |
| `src/components/dashboard/DepartmentChart.tsx` | Novo |
| `src/components/dashboard/RecentAnalyses.tsx` | Novo |
| `src/hooks/useDashboardData.tsx` | Novo |

Sem mudanças de schema de banco.

---

### Pontos a confirmar

1. **Botão "+ Nova Análise"** deve abrir um menu com os 5 tipos de documento, ou ir direto para `/upload/etp`?
2. **Demandas por Secretaria**: ok usar mock nesta entrega (sem campo `secretaria` no banco) e implementar extração real depois?

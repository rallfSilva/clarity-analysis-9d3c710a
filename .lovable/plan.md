## Objetivo

Atualizar o `AdminDashboard` (perfil administrador) para replicar fielmente o layout da imagem anexa, adicionando as seções que hoje estão faltando.

## Estado atual vs imagem

Existe hoje em `src/pages/admin/AdminDashboard.tsx`:
- 4 KPIs (Total Usuários, Análises Hoje, Taxa de Sucesso, Tempo Médio)
- Gráfico de barras "Análises por Dia"
- Card "Alertas do Sistema"

Faltando (visível na imagem):
1. Primeira linha de KPIs com **4 cards**: Total de Usuários, Usuários Ativos, Administradores, Secretarias
2. Segunda linha de KPIs mantém os 4 atuais (Total de Usuários / Análises Hoje / Taxa de Sucesso / Tempo Médio)
3. Grid de **atalhos rápidos** (5 cards com ícone + descrição + botão "Acessar"):
   - Gerenciar Usuários → `/admin/users`
   - Gerenciar Prompts → `/admin/prompts` (rota não existe ainda; botão levará a `/settings` como fallback)
   - Logs de Auditoria → `/admin/audit`
   - Todas as Análises → `/analyses`
   - Configurações → `/settings`
4. Seção **Atividade Recente** — últimos usuários cadastrados (nome, e-mail, data de cadastro à direita)
5. Remover o card "Alertas do Sistema" (não aparece na imagem)

## Implementação

Arquivo único: `src/pages/admin/AdminDashboard.tsx`

- Buscar em paralelo: `profiles` (todos), `user_roles` (para contar admins), `analyses`.
- Calcular:
  - Total usuários = `profiles.length`
  - Usuários ativos = `profiles.filter(is_active).length` + "100% do total" quando aplicável
  - Administradores = `user_roles.filter(role==='admin').length` com sublinha "Com acesso total"
  - Secretarias = `0` com sublinha "Órgãos representados" (não há campo no schema; manter placeholder como na imagem)
- Renderizar duas linhas de 4 cards seguindo o mesmo componente `Card` já usado, cada card com ícone à direita e uma linha de descrição secundária.
- Manter gráfico de barras existente.
- Adicionar grid `md:grid-cols-4 lg:grid-cols-5` com os 5 cards de atalho usando `Link` do react-router para navegação.
- Adicionar "Atividade Recente": listar os 5 mais recentes de `profiles` ordenados por `created_at desc`, com nome, e-mail e data formatada `dd/MM/yyyy` alinhada à direita.

## Notas técnicas

- Não altera schema nem policies. Apenas leitura de tabelas já acessíveis pelo admin via RLS existente.
- Rota "Gerenciar Prompts" não existe hoje; o card apontará para `/settings` e uma nota `title` explicando (posso criar rota real em iteração futura se desejado).
- Sem novas dependências.

## Fora de escopo

- Criação da página "Gerenciar Prompts".
- Adição de campo "secretaria" no perfil (necessário para tornar o KPI Secretarias dinâmico).

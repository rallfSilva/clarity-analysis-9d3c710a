## Nova aba "Todas as Análises" (Admin)

Criar uma página administrativa que replica fielmente o layout do mockup, listando todas as análises do sistema com busca, ações por linha e ações globais no topo.

### 1. Navegação
- `src/components/AppSidebar.tsx`: adicionar item **"Todas as Análises"** (ícone `ListChecks`) na seção **Administração**, apenas para admins, após "Auditoria & Logs".
- `src/App.tsx`: registrar rota `/admin/analyses` protegida por admin.

### 2. Página `src/pages/admin/AllAnalyses.tsx`
Cabeçalho:
- Título "Todas as Análises" + subtítulo "Visualize e gerencie todas as análises de conformidade do sistema".
- Botões no topo direito: **Processar** (ícone play) e **Atualizar** (ícone refresh).

Busca:
- Input único com placeholder "Buscar por processo, tipo de documento, usuário ou e-mail…" filtrando client-side por processo, tipo, nome e e-mail do usuário.

Tabela com colunas: Data/Hora · Usuário (nome + e-mail, ícone user) · Processo · Tipo · Status (badge azul "Concluído", etc.) · Conformidade (%) · Ações.

Ações por linha:
- **Ver** (olho): abre o `ReportView` em Dialog (mesmo componente já usado em `Analyses.tsx`).
- **Reprocessar** (refresh circular): reenvia a análise para a edge function `analyze-document` (reset de status para `pending`, dispara invocação, toast de progresso).
- **Excluir** (lixeira): confirmação via `AlertDialog` e delete.

Botões globais:
- **Atualizar**: refetch da lista.
- **Processar**: percorre análises com status `pending`/`error` e chama a edge function para cada uma em sequência, com toast de progresso e refetch ao final. Desabilitado quando não houver pendentes.

### 3. Dados
- Query em `analyses` (sem filtro por `user_id`, pois admin) fazendo join manual com `profiles` (name, email) via segunda consulta agrupada por `user_id`. Ordenação `created_at desc`.
- Realtime subscription no canal `analyses` (evento `*`) para refresh automático, como já feito em `Analyses.tsx`.

### 4. Detalhes técnicos
- Reutilizar componentes: `Table`, `Badge`, `Button`, `Input`, `AlertDialog`, `Dialog`, `Progress`, `ReportView`, `normalizeReport`.
- Ícones: `Eye`, `RefreshCw`, `Trash2`, `Play`, `Filter`, `User`, `ListChecks`.
- Status badges com as mesmas cores atuais + variante "Concluído" azul (`bg-primary/10 text-primary`) equivalente ao "success" do mockup.
- Sem alterações em `Minhas Análises` do usuário (mantida como está).
- Sem mudanças de schema — as políticas RLS existentes já permitem admin ler/atualizar/excluir todas as análises.
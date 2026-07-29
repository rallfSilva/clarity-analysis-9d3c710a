import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SecretariaReport } from './SecretariaReport';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));
// Admin: neither query filters by user_id — matches the real scenario in the
// bug report (the reporting user is an administrator).
vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true }),
}));

// A supabase mock that actually honours `.eq` and `.gte`, so the 30-day window
// (`.gte('created_at', since)`) filters rows the way production does. The
// simpler shared-array mocks used elsewhere ignore `.gte` and therefore cannot
// reproduce this date-window bug.
let supabaseRows: any[] = [];
function makeSupabaseChain() {
  let rows = [...supabaseRows];
  const chain: any = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn((col: string, val: unknown) => {
      rows = rows.filter((r) => r[col] === val);
      return chain;
    }),
    gte: vi.fn((col: string, val: string) => {
      rows = rows.filter((r) => r[col] >= val);
      return chain;
    }),
    then: (cb: any) => Promise.resolve(cb({ data: rows, error: null })),
  };
  return chain;
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(() => makeSupabaseChain()) },
}));

// Stub do resumo: este teste cobre a lógica de query/gating do relatório (o
// resumo deve renderizar quando há análises), não os gráficos internos do
// SecretariaSummary (que dependem de recharts/ResizeObserver).
vi.mock('./SecretariaSummary', () => ({
  SecretariaSummary: ({
    sigla,
    totalAllTime,
  }: {
    sigla: string;
    totalAllTime?: number | null;
  }) => (
    <div>
      <div>Resumo da Secretaria {sigla}</div>
      <div>Total de Análises {totalAllTime}</div>
    </div>
  ),
}));

function renderWithClient(initialUrl: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <QueryClientProvider client={qc}>
        <SecretariaReport />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function mkRow(id: string, createdAt: string) {
  return {
    id,
    user_id: 'u1',
    processo: `P-${id}`,
    tipo_documento: 'dfd',
    secretaria: 'SETRABES',
    status: 'success',
    checklist: [],
    arquivo_url: null,
    completed_at: createdAt,
    conformidade_percentual: 80,
    created_at: createdAt,
    relatorio_html: '<p>x</p>',
    relatorio_texto: 'x',
    resultado_json: null,
    started_at: null,
    tokens_usados: 0,
  };
}

beforeEach(() => {
  supabaseRows = [];
});

describe('SecretariaReport — janela de datas', () => {
  it('mostra o relatório da secretaria mesmo quando todas as análises são antigas (>30 dias)', async () => {
    // 4 análises de SETRABES, todas de muito tempo atrás (fora de qualquer
    // janela de "últimos 30 dias"). É exatamente o caso do bug: o seletor conta
    // 4 (all-time), mas o relatório aparecia vazio porque o detalhe filtrava por
    // 30 dias.
    supabaseRows = [
      mkRow('1', '2020-01-15T10:00:00Z'),
      mkRow('2', '2020-02-15T10:00:00Z'),
      mkRow('3', '2020-03-15T10:00:00Z'),
      mkRow('4', '2020-04-15T10:00:00Z'),
    ];

    renderWithClient('/reports?tab=secretaria&secretaria=SETRABES');

    // O resumo da secretaria deve renderizar (as 4 análises devem aparecer).
    expect(
      await screen.findByText(/Resumo da Secretaria SETRABES/i),
    ).toBeInTheDocument();

    // E deve trazer as 4 análises (all-time), não zero.
    expect(screen.getByText(/Total de Análises 4/)).toBeInTheDocument();

    // O estado vazio NÃO deve ser exibido.
    await waitFor(() => {
      expect(
        screen.queryByText(/Nenhuma análise encontrada para esta secretaria/i),
      ).not.toBeInTheDocument();
    });
  });
});

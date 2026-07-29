import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SecretariaSummary } from './SecretariaSummary';

// recharts' ResponsiveContainer usa ResizeObserver, que o jsdom não fornece.
// Com este stub os gráficos ficam colapsados (0px) mas não quebram — e os KPIs
// que este teste verifica são divs simples, renderizados independentemente.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
  ResizeObserverStub;

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

afterEach(() => {
  vi.useRealTimers();
});

describe('SecretariaSummary — KPIs', () => {
  it('"Últimos 30 dias" conta só as análises recentes; "Total de Análises" conta todas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-29T12:00:00Z'));

    // Recebe TODAS as análises (all-time), como o detalhe passa a fazer.
    const analyses = [
      mkRow('recent', '2026-07-25T10:00:00Z'), // dentro dos últimos 30 dias
      mkRow('old1', '2026-01-01T10:00:00Z'),
      mkRow('old2', '2026-01-02T10:00:00Z'),
      mkRow('old3', '2026-01-03T10:00:00Z'),
    ];

    render(
      <MemoryRouter>
        <SecretariaSummary
          sigla="SETRABES"
          analyses={analyses as never}
          totalAllTime={4}
        />
      </MemoryRouter>,
    );

    const last30 = screen.getByText('Últimos 30 dias').nextElementSibling;
    expect(last30).toHaveTextContent('1');

    const total = screen.getByText('Total de Análises').nextElementSibling;
    expect(total).toHaveTextContent('4');
  });
});

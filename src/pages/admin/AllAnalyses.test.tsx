import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AllAnalyses from './AllAnalyses';

const { mockChannel, mockFrom } = vi.hoisted(() => {
  const mockChannel: any = {};
  mockChannel.on = vi.fn(() => mockChannel);
  mockChannel.subscribe = vi.fn(() => mockChannel);
  const mockFrom = vi.fn();
  return { mockChannel, mockFrom };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: mockFrom,
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

function queryChain(data: any[] = []) {
  const chain: any = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    in: vi.fn(() => chain),
  };
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve({ data, error: null }).then(resolve, reject);
  return chain;
}
mockFrom.mockImplementation(() => queryChain());

describe('AllAnalyses — atualização sem Realtime', () => {
  it('faz polling a cada 5s como fallback do Realtime', async () => {
    const realSetInterval = window.setInterval.bind(window);
    const setIntervalCalls: [(...args: any[]) => void, number][] = [];
    const mockSetInterval = vi.fn((callback: (...args: any[]) => void, delay?: number) => {
      setIntervalCalls.push([callback, delay ?? 0]);
      return realSetInterval(callback, delay);
    });
    vi.stubGlobal('setInterval', mockSetInterval);

    const { unmount } = render(<AllAnalyses />);

    await screen.findByPlaceholderText(/Buscar por processo/i);
    const callsAfterInitialLoad = mockFrom.mock.calls.length;
    expect(callsAfterInitialLoad).toBeGreaterThan(0);

    const pollCalls = setIntervalCalls.filter(([, delay]) => delay === 5000);
    expect(pollCalls).toHaveLength(1);

    await act(async () => {
      pollCalls.forEach(([callback]) => callback());
      await Promise.resolve();
    });

    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsAfterInitialLoad);
    expect(screen.getByPlaceholderText(/Buscar por processo/i)).toBeInTheDocument();

    unmount();
    vi.unstubAllGlobals();
  });
});

describe('AllAnalyses — impressão do relatório', () => {
  it('marca o DialogContent do relatório com data-print-area, para o CSS de impressão isolar só ele', async () => {
    const analysis = {
      id: 'a1',
      processo: 'SIAC-2026-0001',
      tipo_documento: 'dfd',
      status: 'success',
      conformidade_percentual: 80,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      relatorio_html: '<p>Relatório</p>',
      resultado_json: null,
      user_id: 'user-123456789',
    };

    mockFrom.mockImplementation((table: string) =>
      table === 'profiles'
        ? queryChain([{ id: 'user-123456789', name: 'Analista', email: 'analista@example.com' }])
        : queryChain([analysis]),
    );

    render(<AllAnalyses />);

    const viewButton = await screen.findByTitle('Ver relatório');
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(document.querySelector('[data-print-area="analysis-details"]')).not.toBeNull();
    });
  });
});

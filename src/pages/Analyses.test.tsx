import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Analyses from './Analyses';

const { mockChannel, mockFrom, mockUser } = vi.hoisted(() => {
  const mockChannel: any = {};
  mockChannel.on = vi.fn(() => mockChannel);
  mockChannel.subscribe = vi.fn(() => mockChannel);
  const mockFrom = vi.fn();
  // Referência estável — se useAuth/useUserRole devolvessem um objeto novo a
  // cada render, o efeito (que depende de [user, isAdmin]) reexecutaria sem
  // parar, já que a comparação de dependências do React é por referência.
  const mockUser = { id: 'u1' };
  return { mockChannel, mockFrom, mockUser };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: false }),
}));

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

function queryChain(data: any[] = [], singleData: any = null) {
  const chain: any = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(() => Promise.resolve({ data: singleData, error: null })),
  };
  chain.then = (resolve: any, reject: any) =>
    Promise.resolve({ data, error: null }).then(resolve, reject);
  return chain;
}
mockFrom.mockImplementation(() => queryChain());

describe('Analyses — atualização sem Realtime', () => {
  it('faz polling a cada 5s, sem mostrar o spinner de tela cheia de novo', async () => {
    // Espiona setInterval mas repassa pro real — testing-library usa
    // setInterval internamente pro polling do findBy/waitFor, então só
    // capturamos as chamadas sem deixar de agendar de verdade.
    const realSetInterval = window.setInterval.bind(window);
    const setIntervalCalls: [(...args: any[]) => void, number][] = [];
    const mockSetInterval = vi.fn((callback: (...args: any[]) => void, delay?: number) => {
      setIntervalCalls.push([callback, delay ?? 0]);
      return realSetInterval(callback, delay);
    });
    vi.stubGlobal('setInterval', mockSetInterval);

    const { unmount } = render(<Analyses />);

    await screen.findByPlaceholderText(/Buscar por processo/i);
    const callsAfterInitialLoad = mockFrom.mock.calls.length;
    expect(callsAfterInitialLoad).toBeGreaterThan(0);

    // O polling deve estar registrado com um intervalo de 5s (exatamente uma
    // vez — se o efeito reexecutasse a cada render, isso pegaria também).
    const pollCalls = setIntervalCalls.filter(([, delay]) => delay === 5000);
    expect(pollCalls).toHaveLength(1);

    // Simula o disparo do polling (equivalente a 5s se passarem).
    await act(async () => {
      pollCalls.forEach(([callback]) => callback());
      await Promise.resolve();
    });

    // Disparou pelo menos uma nova busca...
    expect(mockFrom.mock.calls.length).toBeGreaterThan(callsAfterInitialLoad);
    // ...sem voltar para o spinner de tela cheia (que desmontaria a busca).
    expect(screen.getByPlaceholderText(/Buscar por processo/i)).toBeInTheDocument();

    unmount();
    vi.unstubAllGlobals();
  });
});

describe('Analyses — impressão do relatório', () => {
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
        ? queryChain([], { name: 'Analista', email: 'analista@example.com' })
        : queryChain([analysis]),
    );

    render(<Analyses />);

    const viewButton = await screen.findByRole('button', {
      name: /Ver relatório da análise SIAC-2026-0001/i,
    });
    fireEvent.click(viewButton);

    await waitFor(() => {
      expect(document.querySelector('[data-print-area="analysis-details"]')).not.toBeNull();
    });
  });
});

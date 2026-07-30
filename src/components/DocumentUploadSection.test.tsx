import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DocumentUploadSection } from './DocumentUploadSection';
import { DOCUMENT_TYPES } from '@/lib/documentContent';

const {
  mockUpload,
  mockGetPublicUrl,
  mockInsertAnalysisSingle,
  mockInsertAnalyses,
  mockInsertAuditLogs,
  mockInvoke,
  mockChannel,
  mockToast,
  mockNavigate,
} = vi.hoisted(() => {
  const mockUpload = vi.fn(() => Promise.resolve({ error: null }));
  const mockGetPublicUrl = vi.fn(() => ({ data: { publicUrl: 'https://example.com/doc.pdf' } }));
  const mockInsertAnalysisSingle = vi.fn(() =>
    Promise.resolve({ data: { id: 'analysis-1' }, error: null }),
  );
  const mockInsertAnalyses = vi.fn(() => ({
    select: () => ({ single: mockInsertAnalysisSingle }),
  }));
  const mockInsertAuditLogs = vi.fn(() => Promise.resolve({ error: null }));
  const mockInvoke = vi.fn();
  const mockChannel: any = {};
  mockChannel.on = vi.fn(() => mockChannel);
  mockChannel.subscribe = vi.fn(() => mockChannel);
  const mockToast = vi.fn();
  const mockNavigate = vi.fn();
  return {
    mockUpload,
    mockGetPublicUrl,
    mockInsertAnalysisSingle,
    mockInsertAnalyses,
    mockInsertAuditLogs,
    mockInvoke,
    mockChannel,
    mockToast,
    mockNavigate,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// A lista de "Análises Recentes" faz sua própria query (useAnalysesByType);
// este teste cobre só o fluxo de submit do upload, não essa lista.
vi.mock('./AnalyzedFilesList', () => ({
  AnalyzedFilesList: () => <div>Análises Recentes (mock)</div>,
}));

// Substitui o Select do Radix por um <select> nativo — evita as
// complicações de simular abrir/fechar um listbox via Portal no jsdom,
// mantendo o foco do teste no comportamento de submit/navegação.
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select
      data-testid="secretaria-select"
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="">Selecione a secretaria</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({ upload: mockUpload, getPublicUrl: mockGetPublicUrl })),
    },
    from: vi.fn((table: string) => {
      if (table === 'analyses') return { insert: mockInsertAnalyses };
      if (table === 'audit_logs') return { insert: mockInsertAuditLogs };
      throw new Error(`unexpected table ${table}`);
    }),
    functions: { invoke: mockInvoke },
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  },
}));

function renderComponent() {
  return render(
    <MemoryRouter>
      <DocumentUploadSection
        tipo={DOCUMENT_TYPES.DFD}
        titulo="DFD"
        descricao="Documento de Formalização de Demanda"
        checklistItems={['Item 1']}
      />
    </MemoryRouter>,
  );
}

async function fillAndSubmit(container: HTMLElement) {
  const file = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(fileInput, { target: { files: [file] } });
  // react-dropzone processa o arquivo de forma assíncrona (file-selector);
  // espera o nome do arquivo aparecer antes de seguir.
  await screen.findByText('documento.pdf');

  fireEvent.change(screen.getByLabelText(/Número do Processo/i), {
    target: { value: 'SIAC-2026-0001' },
  });

  fireEvent.change(screen.getByTestId('secretaria-select'), {
    target: { value: 'SEADI' },
  });

  fireEvent.click(screen.getByRole('button', { name: /Enviar para Análise/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpload.mockResolvedValue({ error: null });
  mockInsertAnalysisSingle.mockResolvedValue({ data: { id: 'analysis-1' }, error: null });
  mockInsertAuditLogs.mockResolvedValue({ error: null });
});

describe('DocumentUploadSection — conclusão do envio', () => {
  it('navega para /analyses quando a análise é concluída com sucesso', async () => {
    mockInvoke.mockResolvedValue({ error: null });
    const { container } = renderComponent();

    await fillAndSubmit(container);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/analyses'));
    expect(mockInsertAuditLogs).toHaveBeenCalled();
  });

  it('mostra erro e não navega quando a função de análise falha', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'falhou' } });
    const { container } = renderComponent();

    await fillAndSubmit(container);

    expect(await screen.findByText(/Erro no processamento/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

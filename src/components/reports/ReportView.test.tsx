import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ReportView } from './ReportView';

vi.mock('@/hooks/use-toast', () => ({ toast: vi.fn() }));
vi.mock('@/lib/reportPdf', () => ({ exportReportPDF: vi.fn() }));

const baseAnalysis = {
  id: 'a1',
  processo: 'SIAC-2026-0001',
  tipo_documento: 'dfd',
  status: 'success',
  conformidade_percentual: 80,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  user_id: 'user-123456789',
};

describe('ReportView — fallback de relatorio_html legado', () => {
  it('isola o HTML legado num iframe, sem injetar <style> direto na página', () => {
    const analysis = {
      ...baseAnalysis,
      resultado_json: null,
      relatorio_html: '<style>body { background: red; }</style><p>Relatório antigo</p>',
    };

    const { container } = render(<ReportView analysis={analysis} analyst={null} />);

    // Nenhuma tag <style> deve ser injetada diretamente na página — isso é o
    // que vazava a formatação do relatório para o site inteiro.
    expect(container.querySelector('style')).toBeNull();

    // O HTML legado deve ser renderizado dentro de um iframe isolado.
    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect((iframe as HTMLIFrameElement).srcdoc).toContain('Relatório antigo');
  });

  it('mantém uma versão sanitizada (print-only) do relatório para a impressão, já que o iframe não imprime', () => {
    const analysis = {
      ...baseAnalysis,
      resultado_json: null,
      relatorio_html: '<style>body { background: red; }</style><p>Relatório antigo</p><script>alert(1)</script>',
    };

    const { container } = render(<ReportView analysis={analysis} analyst={null} />);

    // O iframe (que não aparece na impressão) fica escondido em .no-print.
    expect(container.querySelector('.no-print iframe')).not.toBeNull();

    // A contrapartida .print-only traz o mesmo conteúdo, sanitizado (sem
    // <style>/<script>), pronta pra substituir o iframe só no papel.
    const printOnly = container.querySelector('.print-only.report-content');
    expect(printOnly).not.toBeNull();
    expect(printOnly?.textContent).toContain('Relatório antigo');
    expect(printOnly?.querySelector('script')).toBeNull();
    expect(printOnly?.querySelector('style')).toBeNull();
  });
});

describe('ReportView — exportação Word', () => {
  let styleEl: HTMLStyleElement;
  let capturedParts: string[][];
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let originalBlob: typeof Blob;

  beforeEach(() => {
    // Simula o CSS compilado da página (o Word precisa dele embutido, já que
    // as classes do Tailwind sozinhas não têm nenhum significado visual).
    styleEl = document.createElement('style');
    styleEl.textContent = '.marcador-de-teste-css { color: rgb(1, 2, 3); }';
    document.head.appendChild(styleEl);

    capturedParts = [];
    originalBlob = globalThis.Blob;
    class CapturingBlob {
      constructor(parts: any[]) {
        capturedParts.push(parts);
      }
    }
    vi.stubGlobal('Blob', CapturingBlob as any);

    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    document.head.removeChild(styleEl);
    vi.stubGlobal('Blob', originalBlob);
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('embute o CSS da página no .doc exportado, para não abrir sem formatação no Word', () => {
    const analysis = {
      ...baseAnalysis,
      resultado_json: null,
      relatorio_html: '<p>Relatório antigo</p>',
    };

    const { getByRole } = render(<ReportView analysis={analysis} analyst={null} />);
    fireEvent.click(getByRole('button', { name: /Word/i }));

    expect(capturedParts).toHaveLength(1);
    const text = capturedParts[0].join('');
    expect(text).toContain('.marcador-de-teste-css');
    expect(text).toContain('Relatório antigo');
  });
});

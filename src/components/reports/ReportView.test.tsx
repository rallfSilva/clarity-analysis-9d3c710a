import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
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
});

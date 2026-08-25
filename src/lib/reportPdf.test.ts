import { describe, it, expect, vi } from 'vitest';
import { normalizeReport } from './reportUtils';

const saveSpy = vi.fn();
const textSpy = vi.fn();

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: {
      pageSize: { getWidth: () => 210, getHeight: () => 297 },
      getNumberOfPages: () => 1,
    },
    addPage: vi.fn(),
    setPage: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    setLineWidth: vi.fn(),
    rect: vi.fn(),
    roundedRect: vi.fn(),
    line: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: textSpy,
    getTextWidth: (s: string) => (s?.length || 0) * 2,
    splitTextToSize: (s: string) => (Array.isArray(s) ? s : [s]),
    save: saveSpy,
  })),
}));

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

import { exportReportPDF } from './reportPdf';

const baseAnalysis = {
  id: 'a1',
  processo: 'SIAC-2026-0001',
  tipo_documento: 'dfd',
  status: 'success',
  conformidade_percentual: 88.37,
  created_at: new Date().toISOString(),
  completed_at: new Date().toISOString(),
  user_id: 'user-123456789',
};

describe('exportReportPDF — fallback de relatorio_html legado', () => {
  it('inclui o conteúdo do relatorio_html no PDF quando não há itens estruturados', async () => {
    const analysis = {
      ...baseAnalysis,
      resultado_json: null,
      relatorio_html: '<h1>Relatório</h1><p>Texto importante do relatório legado</p>',
    };
    const report = normalizeReport(null);

    await exportReportPDF(analysis, null, report);

    const drawnText = textSpy.mock.calls
      .map((call) => (Array.isArray(call[0]) ? call[0].join(' ') : call[0]))
      .join(' ');
    expect(drawnText).toContain('Texto importante do relatório legado');
    expect(saveSpy).toHaveBeenCalled();
  });

  it('não desenha os cartões de contagem (Itens Avaliados etc.) quando não há itens estruturados', async () => {
    textSpy.mockClear();
    const analysis = {
      ...baseAnalysis,
      resultado_json: null,
      relatorio_html: '<p>Conteúdo qualquer</p>',
    };
    const report = normalizeReport(null);

    await exportReportPDF(analysis, null, report);

    const drawnLabels = textSpy.mock.calls.map((call) => call[0]);
    expect(drawnLabels).not.toContain('ITENS AVALIADOS');
  });
});

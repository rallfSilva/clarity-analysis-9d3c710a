import { describe, it, expect, vi } from 'vitest';

const saveSpy = vi.fn();

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 595, getHeight: () => 842 } },
    addPage: vi.fn(),
    setPage: vi.fn(),
    setFillColor: vi.fn(),
    rect: vi.fn(),
    setTextColor: vi.fn(),
    setFontSize: vi.fn(),
    setFont: vi.fn(),
    text: vi.fn(),
    getNumberOfPages: () => 1,
    save: saveSpy,
    splitTextToSize: (s: string) => [s],
  })),
}));

import { exportConsolidatedProcessPDF, htmlToReadableText } from './consolidatedPdf';
import type { ProcessGroup } from './groupAnalysesByProcess';

describe('exportConsolidatedProcessPDF', () => {
  it('does not throw and triggers save with sanitized filename', async () => {
    const group: ProcessGroup = {
      processo: 'PROC/2026-1',
      all: [],
      success: [
        {
          id: '1', user_id: 'u', processo: 'PROC/2026-1', tipo_documento: 'dfd',
          secretaria: 'SEC', status: 'success', checklist: [],
          arquivo_url: null, completed_at: '2026-05-20T10:00:00Z',
          conformidade_percentual: 88, created_at: '2026-05-20T09:00:00Z',
          relatorio_html: '<p>x</p>', relatorio_texto: 'Texto do relatório DFD.',
          resultado_json: null, started_at: '2026-05-20T09:30:00Z', tokens_usados: 0,
        } as any,
      ],
      pending: [],
      byType: {},
      lastAt: '2026-05-20T09:00:00Z',
    };

    expect(() => exportConsolidatedProcessPDF(group)).not.toThrow();
    expect(saveSpy).toHaveBeenCalled();
    const filename = saveSpy.mock.calls[0][0] as string;
    expect(filename).toMatch(/^consolidado-processo-PROC-2026-1-\d{4}-\d{2}-\d{2}\.pdf$/);
  });
});

describe('htmlToReadableText', () => {
  it('strips tags and preserves paragraph breaks', () => {
    const out = htmlToReadableText('<p>Primeiro</p><p>Segundo</p>');
    expect(out).toContain('Primeiro');
    expect(out).toContain('Segundo');
    expect(out.split('\n').filter(Boolean)).toEqual(['Primeiro', 'Segundo']);
  });

  it('prefixes list items with bullets', () => {
    const out = htmlToReadableText('<ul><li>A</li><li>B</li></ul>');
    expect(out).toContain('• A');
    expect(out).toContain('• B');
  });

  it('renders heading text on its own line', () => {
    const out = htmlToReadableText('<h2>Título</h2><p>Corpo</p>');
    const lines = out.split('\n').filter(Boolean);
    expect(lines[0]).toBe('Título');
    expect(lines[1]).toBe('Corpo');
  });

  it('collapses excessive blank lines', () => {
    const out = htmlToReadableText('<p>A</p><br/><br/><br/><p>B</p>');
    expect(/\n{3,}/.test(out)).toBe(false);
  });

  it('strips style, script and head blocks', () => {
    const html = `
      <style>body { color: red; } .x { font-family: 'Segoe'; }</style>
      <script>alert('xss')</script>
      <p>Conteúdo visível</p>
    `;
    const out = htmlToReadableText(html);
    expect(out).not.toContain('color: red');
    expect(out).not.toContain('Segoe');
    expect(out).not.toContain('alert');
    expect(out).toContain('Conteúdo visível');
  });
});

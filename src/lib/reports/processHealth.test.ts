import { describe, it, expect } from 'vitest';
import { computeProcessHealth, relativeTimeFromNow } from './processHealth';
import type { Analysis, ProcessGroup } from './groupAnalysesByProcess';

function makeAnalysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: crypto.randomUUID(),
    user_id: 'u1',
    processo: 'P',
    tipo_documento: 'dfd',
    secretaria: 'SEC',
    status: 'success',
    checklist: [],
    arquivo_url: null,
    completed_at: '2026-05-20T10:00:00Z',
    conformidade_percentual: 90,
    created_at: '2026-05-20T09:00:00Z',
    relatorio_html: null,
    relatorio_texto: null,
    resultado_json: null,
    started_at: '2026-05-20T09:30:00Z',
    tokens_usados: 0,
    ...overrides,
  } as Analysis;
}

function makeGroup(analyses: Analysis[]): ProcessGroup {
  return {
    processo: 'P',
    all: analyses,
    success: analyses.filter((a) => a.status === 'success'),
    pending: analyses.filter((a) => a.status !== 'success'),
    byType: {},
    lastAt: analyses[0]?.created_at || '',
  };
}

describe('computeProcessHealth', () => {
  it('returns red when any analysis has status error', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', status: 'error', conformidade_percentual: null }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 95 }),
    ]);
    expect(computeProcessHealth(g).level).toBe('red');
  });

  it('returns red when avg conformidade is below 70', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', conformidade_percentual: 60 }),
    ]);
    expect(computeProcessHealth(g).level).toBe('red');
  });

  it('returns yellow when no analyses are complete yet', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', status: 'processing', conformidade_percentual: null }),
    ]);
    expect(computeProcessHealth(g).level).toBe('yellow');
  });

  it('returns green when all 5 types have success and avg >= 85', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', conformidade_percentual: 90 }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 85 }),
      makeAnalysis({ tipo_documento: 'nota-tecnica', conformidade_percentual: 95 }),
      makeAnalysis({ tipo_documento: 'analise-risco', conformidade_percentual: 88 }),
      makeAnalysis({ tipo_documento: 'termo-referencia', conformidade_percentual: 92 }),
    ]);
    expect(computeProcessHealth(g).level).toBe('green');
  });

  it('returns yellow when complete but avg < 85', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', conformidade_percentual: 80 }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 80 }),
      makeAnalysis({ tipo_documento: 'nota-tecnica', conformidade_percentual: 80 }),
      makeAnalysis({ tipo_documento: 'analise-risco', conformidade_percentual: 80 }),
      makeAnalysis({ tipo_documento: 'termo-referencia', conformidade_percentual: 80 }),
    ]);
    expect(computeProcessHealth(g).level).toBe('yellow');
  });

  it('returns yellow when avg >= 85 but not all 5 types completed', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', conformidade_percentual: 95 }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 90 }),
    ]);
    expect(computeProcessHealth(g).level).toBe('yellow');
  });

  it('returns criteria with met flags for green case', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', conformidade_percentual: 90 }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 90 }),
      makeAnalysis({ tipo_documento: 'nota-tecnica', conformidade_percentual: 90 }),
      makeAnalysis({ tipo_documento: 'analise-risco', conformidade_percentual: 90 }),
      makeAnalysis({ tipo_documento: 'termo-referencia', conformidade_percentual: 90 }),
    ]);
    const h = computeProcessHealth(g);
    expect(h.criteria.every((c) => c.met)).toBe(true);
    expect(h.criteria.find((c) => c.label.includes('Conformidade'))?.value).toBe('90.0%');
    expect(h.criteria.find((c) => c.label.includes('tipos analisados'))?.value).toBe('5/5');
    expect(h.criteria.find((c) => c.label.includes('erro'))?.value).toBe('nenhum erro');
  });

  it('returns criteria with met=false for failing branches', () => {
    const g = makeGroup([
      makeAnalysis({ tipo_documento: 'dfd', status: 'error', conformidade_percentual: null }),
      makeAnalysis({ tipo_documento: 'etp', conformidade_percentual: 60 }),
    ]);
    const h = computeProcessHealth(g);
    expect(h.level).toBe('red');
    expect(h.criteria.find((c) => c.label.includes('erro'))?.met).toBe(false);
    expect(h.criteria.find((c) => c.label.includes('erro'))?.value).toBe('1 erro(s)');
    expect(h.criteria.find((c) => c.label.includes('Conformidade'))?.met).toBe(false);
  });
});

describe('relativeTimeFromNow', () => {
  const now = new Date('2026-05-20T12:00:00Z');

  it('returns "agora" for the current moment or near-future', () => {
    expect(relativeTimeFromNow('2026-05-20T12:00:00Z', now)).toBe('agora');
    expect(relativeTimeFromNow('2026-05-20T13:00:00Z', now)).toBe('agora');
  });

  it('formats minutes', () => {
    expect(relativeTimeFromNow('2026-05-20T11:45:00Z', now)).toBe('há 15min');
  });

  it('formats hours', () => {
    expect(relativeTimeFromNow('2026-05-20T09:00:00Z', now)).toBe('há 3h');
  });

  it('formats single day', () => {
    expect(relativeTimeFromNow('2026-05-19T12:00:00Z', now)).toBe('há 1 dia');
  });

  it('formats multiple days', () => {
    expect(relativeTimeFromNow('2026-05-15T12:00:00Z', now)).toBe('há 5 dias');
  });

  it('formats months', () => {
    expect(relativeTimeFromNow('2026-02-15T12:00:00Z', now)).toBe('há 3 meses');
  });
});

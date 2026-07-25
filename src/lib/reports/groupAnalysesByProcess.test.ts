import { describe, it, expect } from 'vitest';
import { groupAnalysesByProcess, type Analysis } from './groupAnalysesByProcess';

function makeAnalysis(overrides: Partial<Analysis>): Analysis {
  return {
    id: crypto.randomUUID(),
    user_id: 'u1',
    processo: 'PROC-1',
    tipo_documento: 'dfd',
    secretaria: 'SEC',
    status: 'success',
    checklist: [],
    arquivo_url: null,
    completed_at: '2026-05-20T10:00:00Z',
    conformidade_percentual: 90,
    created_at: '2026-05-20T09:00:00Z',
    relatorio_html: '<p>ok</p>',
    relatorio_texto: 'ok',
    resultado_json: null,
    started_at: '2026-05-20T09:30:00Z',
    tokens_usados: 100,
    ...overrides,
  } as Analysis;
}

describe('groupAnalysesByProcess', () => {
  it('returns empty object for empty input', () => {
    expect(groupAnalysesByProcess([])).toEqual({});
  });

  it('groups multiple processos separately', () => {
    const a = makeAnalysis({ processo: 'P-1', tipo_documento: 'dfd' });
    const b = makeAnalysis({ processo: 'P-2', tipo_documento: 'etp' });
    const result = groupAnalysesByProcess([a, b]);
    expect(Object.keys(result).sort()).toEqual(['P-1', 'P-2']);
    expect(result['P-1'].all).toHaveLength(1);
    expect(result['P-2'].all).toHaveLength(1);
  });

  it('separates success from pending', () => {
    const ok = makeAnalysis({ processo: 'P', status: 'success' });
    const proc = makeAnalysis({ processo: 'P', status: 'processing' });
    const err = makeAnalysis({ processo: 'P', status: 'error' });
    const result = groupAnalysesByProcess([ok, proc, err]);
    expect(result['P'].success).toHaveLength(1);
    expect(result['P'].pending).toHaveLength(2);
    expect(result['P'].all).toHaveLength(3);
  });

  it('groups byType including all statuses', () => {
    const dfd1 = makeAnalysis({ processo: 'P', tipo_documento: 'dfd', status: 'success' });
    const dfd2 = makeAnalysis({ processo: 'P', tipo_documento: 'dfd', status: 'processing' });
    const etp = makeAnalysis({ processo: 'P', tipo_documento: 'etp', status: 'success' });
    const result = groupAnalysesByProcess([dfd1, dfd2, etp]);
    expect(result['P'].byType['dfd']).toHaveLength(2);
    expect(result['P'].byType['etp']).toHaveLength(1);
  });

  it('orders byType buckets by created_at desc', () => {
    const older = makeAnalysis({
      processo: 'P', tipo_documento: 'dfd', created_at: '2026-05-01T00:00:00Z',
    });
    const newer = makeAnalysis({
      processo: 'P', tipo_documento: 'dfd', created_at: '2026-05-10T00:00:00Z',
    });
    const result = groupAnalysesByProcess([older, newer]);
    expect(result['P'].byType['dfd'][0].created_at).toBe('2026-05-10T00:00:00Z');
    expect(result['P'].byType['dfd'][1].created_at).toBe('2026-05-01T00:00:00Z');
  });

  it('computes lastAt as max created_at of the process', () => {
    const a = makeAnalysis({ processo: 'P', created_at: '2026-04-01T00:00:00Z' });
    const b = makeAnalysis({ processo: 'P', created_at: '2026-05-15T00:00:00Z' });
    const result = groupAnalysesByProcess([a, b]);
    expect(result['P'].lastAt).toBe('2026-05-15T00:00:00Z');
  });
});

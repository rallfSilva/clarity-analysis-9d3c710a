// Utilities for the redesigned Report views (in-app + PDF export)

export type Conformidade =
  | 'ATENDE'
  | 'ATENDE_PARCIALMENTE'
  | 'NAO_ATENDE'
  | 'NAO_SE_APLICA'
  | 'CONFORME'
  | 'NÃO CONFORME'
  | 'PARCIALMENTE CONFORME'
  | string;

export type SituacaoNormalizada = 'conforme' | 'parcial' | 'nao_conforme' | 'nao_aplica';

export interface NormalizedItem {
  numero: number;
  codigo: string;
  elemento: string;
  situacao: SituacaoNormalizada;
  situacaoLabel: string;
  observacao: string;
  recomendacao: string;
  fundamentacaoLegal: string[];
}


export interface ResumoDocumento {
  processo?: string;
  secretaria?: string;
  objeto?: string;
  base_normativa?: string;
  responsaveis?: string;
}

export interface NormalizedReport {
  items: NormalizedItem[];
  totals: { conforme: number; parcial: number; nao_conforme: number; nao_aplica: number };
  conformidadePercentual: number;
  resumoExecutivo?: string;
  pontosFortes: string[];
  ausenciasCriticas: string[];
  parecerFinal?: string;
  recomendacoes: string[];
  diagnostico?: string;
  resumoDocumento?: ResumoDocumento;
}


export function normalizeSituacao(value: string): SituacaoNormalizada {
  const v = (value || '').toUpperCase();
  if (v.includes('PARCIAL')) return 'parcial';
  if (v.includes('NAO_APLICA') || v.includes('NÃO SE APLICA') || v.includes('NAO SE APLICA')) return 'nao_aplica';
  if (v.startsWith('NAO') || v.startsWith('NÃO')) return 'nao_conforme';
  if (v.startsWith('ATENDE') || v.startsWith('CONFORME')) return 'conforme';
  return 'nao_aplica';
}

export function situacaoLabel(s: SituacaoNormalizada): string {
  switch (s) {
    case 'conforme': return 'Conforme';
    case 'parcial': return 'Parcialmente Conforme';
    case 'nao_conforme': return 'Não Conforme';
    case 'nao_aplica': return 'Não se Aplica';
  }
}

export function situacaoIcon(s: SituacaoNormalizada): string {
  switch (s) {
    case 'conforme': return '🟢';
    case 'parcial': return '🟡';
    case 'nao_conforme': return '🔴';
    case 'nao_aplica': return '⚪';
  }
}

/** Legal references regex — finds mentions of Lei 14.133, INs, Decretos, Súmulas, Acórdãos */
const LEGAL_REGEX =
  /(Lei\s*n?º?\s*14\.?133\/?20?21|Lei\s*n?º?\s*8\.?666\/?93|IN\s*n?º?\s*\d+(?:\/\d+)?|Instrução\s+Normativa\s+n?º?\s*\d+(?:\/\d+)?|Decreto\s*n?º?\s*[\d.-]+(?:\/\d+)?|Súmula\s+n?º?\s*\d+|Acórdão\s+n?º?\s*[\d./-]+|Art(?:igo|\.)?\s*\d+(?:º)?(?:,\s*(?:inciso|§|parágrafo)[^,\.;]*)?)/gi;

export function extractLegalBasis(text: string): string[] {
  if (!text) return [];
  const matches = text.match(LEGAL_REGEX) || [];
  const uniq = Array.from(new Set(matches.map((m) => m.trim())));
  return uniq;
}

/** Parses observação/recomendação from a single free-text observation field. */
function splitObservacaoRecomendacao(text: string): { observacao: string; recomendacao: string } {
  if (!text) return { observacao: '', recomendacao: '' };
  const m = text.match(/(recomend[au][^:]*|sugere-se|sugestão|orienta-se)\s*:?\s*([\s\S]+)$/i);
  if (m && m.index !== undefined && m.index > 20) {
    return {
      observacao: text.slice(0, m.index).trim(),
      recomendacao: m[2].trim(),
    };
  }
  return { observacao: text, recomendacao: '' };
}


/** Normalize both ETP and generic AI results into a single structure the UI uses. */
export function normalizeReport(resultadoJson: any): NormalizedReport {
  const empty: NormalizedReport = {
    items: [],
    totals: { conforme: 0, parcial: 0, nao_conforme: 0, nao_aplica: 0 },
    conformidadePercentual: 0,
    pontosFortes: [],
    ausenciasCriticas: [],
    recomendacoes: [],
  };
  if (!resultadoJson) return empty;

  const items: NormalizedItem[] = [];
  const recomendacoes = new Set<string>();

  // ETP shape: tabela_analise
  if (Array.isArray(resultadoJson.tabela_analise)) {
    resultadoJson.tabela_analise.forEach((row: any, i: number) => {
      const situacao = normalizeSituacao(row.conformidade || '');
      const { observacao, recomendacao } = splitObservacaoRecomendacao(row.observacoes || '');
      const legais = extractLegalBasis(row.observacoes || '');
      if (recomendacao) recomendacoes.add(recomendacao);
      items.push({
        numero: row.numero ?? i + 1,
        codigo: row.codigo || `#${i + 1}`,
        elemento: row.item_verificado || '',
        situacao,
        situacaoLabel: situacaoLabel(situacao),
        observacao,
        recomendacao,
        fundamentacaoLegal: legais,
      });

    });
  }

  // Generic shape: itens_checklist
  if (Array.isArray(resultadoJson.itens_checklist)) {
    resultadoJson.itens_checklist.forEach((row: any, i: number) => {
      const situacao = normalizeSituacao(row.status || '');
      const legais = extractLegalBasis(`${row.justificativa || ''} ${row.recomendacao || ''}`);
      if (row.recomendacao) recomendacoes.add(row.recomendacao);
      items.push({
        numero: i + 1,
        codigo: row.codigo || `#${i + 1}`,
        elemento: row.elemento_avaliado || row.item_verificado || row.codigo || `Item ${i + 1}`,
        situacao,
        situacaoLabel: situacaoLabel(situacao),
        observacao: row.justificativa || '',
        recomendacao: row.recomendacao || '',
        fundamentacaoLegal: legais,
      });

    });
  }


  const totals = items.reduce(
    (acc, it) => {
      acc[it.situacao === 'nao_conforme' ? 'nao_conforme' : it.situacao === 'parcial' ? 'parcial' : it.situacao === 'conforme' ? 'conforme' : 'nao_aplica']++;
      return acc;
    },
    { conforme: 0, parcial: 0, nao_conforme: 0, nao_aplica: 0 } as NormalizedReport['totals'],
  );

  const conclusao = resultadoJson.conclusao_tecnica || {};
  (resultadoJson.recomendacoes_prioritarias || []).forEach((r: string) => recomendacoes.add(r));
  (conclusao.ausencias_criticas || []).forEach((r: string) => recomendacoes.add(r));

  return {
    items,
    totals,
    conformidadePercentual: Number(resultadoJson.conformidade_percentual) || 0,
    resumoExecutivo: resultadoJson.resumo_executivo || conclusao.diagnostico_resumido,
    pontosFortes: conclusao.pontos_fortes || [],
    ausenciasCriticas: conclusao.ausencias_criticas || (resultadoJson.principais_nao_conformidades || []),
    parecerFinal: conclusao.parecer_adequacao,
    diagnostico: conclusao.diagnostico_resumido,
    recomendacoes: Array.from(recomendacoes).filter(Boolean),
    resumoDocumento: resultadoJson.resumo_documento,
  };

}

export function situacaoColorClass(s: SituacaoNormalizada): string {
  switch (s) {
    case 'conforme': return 'bg-success/10 text-success border-success/30';
    case 'parcial': return 'bg-warning/10 text-warning border-warning/30';
    case 'nao_conforme': return 'bg-danger/10 text-danger border-danger/30';
    case 'nao_aplica': return 'bg-muted text-muted-foreground border-border';
  }
}


export function processingDurationLabel(startISO: string, endISO?: string | null): string {
  if (!endISO) return '—';
  const ms = new Date(endISO).getTime() - new Date(startISO).getTime();
  if (ms <= 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}min ${rest}s`;
}

import type { Database } from '@/integrations/supabase/types';

export type Analysis = Database['public']['Tables']['analyses']['Row'];

export interface ProcessGroup {
  processo: string;
  all: Analysis[];
  success: Analysis[];
  pending: Analysis[];
  byType: Record<string, Analysis[]>;
  lastAt: string;
}

export interface ProcessListItem {
  processo: string;
  total: number;
  lastAt: string;
}

export function groupAnalysesByProcess(
  analyses: Analysis[],
): Record<string, ProcessGroup> {
  const groups: Record<string, ProcessGroup> = {};

  for (const a of analyses) {
    const key = a.processo;
    if (!groups[key]) {
      groups[key] = {
        processo: key,
        all: [],
        success: [],
        pending: [],
        byType: {},
        lastAt: a.created_at,
      };
    }
    const g = groups[key];
    g.all.push(a);
    if (a.status === 'success') g.success.push(a);
    else g.pending.push(a);
    g.byType[a.tipo_documento] = g.byType[a.tipo_documento] || [];
    g.byType[a.tipo_documento].push(a);
    if (a.created_at > g.lastAt) g.lastAt = a.created_at;
  }

  for (const g of Object.values(groups)) {
    for (const list of Object.values(g.byType)) {
      list.sort((x, y) => (y.created_at > x.created_at ? 1 : -1));
    }
  }

  return groups;
}

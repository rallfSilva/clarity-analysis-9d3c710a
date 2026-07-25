import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { ProcessSelector } from './ProcessSelector';
import { ProcessSummary } from './ProcessSummary';
import { ConsolidatedSections } from './ConsolidatedSections';
import {
  groupAnalysesByProcess,
  type Analysis,
  type ProcessListItem,
} from '@/lib/reports/groupAnalysesByProcess';
import { exportConsolidatedProcessPDF } from '@/lib/reports/consolidatedPdf';

// Botão escondido até melhorarmos a renderização do HTML no PDF (jspdf não
// renderiza HTML nativamente, então hoje o conteúdo sai como texto pobre).
const SHOW_PDF_EXPORT = false;

export function ConsolidatedReport() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const urlProcesso = searchParams.get('processo');
  const [selected, setSelected] = useState<string | null>(urlProcesso);

  useEffect(() => {
    if (urlProcesso && urlProcesso !== selected) {
      setSelected(urlProcesso);
    }
    // intentionally omits `selected` to avoid resetting when user
    // changes selection manually while the URL still has the old value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProcesso]);

  const processosQuery = useQuery({
    queryKey: ['reports', 'processos', user?.id, isAdmin],
    enabled: !!user,
    queryFn: async (): Promise<ProcessListItem[]> => {
      let q = supabase
        .from('analyses')
        .select('processo, created_at')
        .order('created_at', { ascending: false });
      if (!isAdmin && user) q = q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      const map = new Map<string, { total: number; lastAt: string }>();
      for (const row of data || []) {
        const cur = map.get(row.processo) || { total: 0, lastAt: row.created_at };
        cur.total += 1;
        if (row.created_at > cur.lastAt) cur.lastAt = row.created_at;
        map.set(row.processo, cur);
      }
      return Array.from(map.entries())
        .map(([processo, { total, lastAt }]) => ({ processo, total, lastAt }))
        .sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1));
    },
  });

  const globalAvgQuery = useQuery({
    queryKey: ['reports', 'globalAvg', user?.id, isAdmin],
    enabled: !!user,
    queryFn: async (): Promise<number | null> => {
      let q = supabase
        .from('analyses')
        .select('conformidade_percentual')
        .eq('status', 'success');
      if (!isAdmin && user) q = q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      const values = (data || [])
        .map((r) => r.conformidade_percentual)
        .filter((v): v is number => v !== null);
      if (values.length === 0) return null;
      return values.reduce((s, v) => s + v, 0) / values.length;
    },
  });

  const processDetailQuery = useQuery({
    queryKey: ['reports', 'processo', selected, user?.id, isAdmin],
    enabled: !!user && !!selected,
    queryFn: async (): Promise<Analysis[]> => {
      let q = supabase.from('analyses').select('*').eq('processo', selected!);
      if (!isAdmin && user) q = q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Analysis[];
    },
  });

  const group = useMemo(() => {
    if (!processDetailQuery.data || !selected) return null;
    const groups = groupAnalysesByProcess(processDetailQuery.data);
    return groups[selected] || null;
  }, [processDetailQuery.data, selected]);

  const handleExportPDF = () => {
    if (!group) return;
    try {
      exportConsolidatedProcessPDF(group);
      toast({ title: 'PDF gerado', description: 'O download foi iniciado.' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    }
  };

  const handlePrint = () => {
    const source = document.querySelector<HTMLElement>('.print-area');
    if (!source) {
      window.print();
      return;
    }
    const clone = source.cloneNode(true) as HTMLElement;
    clone.setAttribute('data-print-area', 'consolidated');
    document.body.appendChild(clone);

    const cleanup = () => {
      clone.remove();
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  };

  const items = processosQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col md:flex-row md:items-center gap-3">
        <ProcessSelector
          items={items}
          value={selected}
          onChange={setSelected}
          loading={processosQuery.isLoading}
        />
        {processosQuery.isSuccess && items.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Nenhum processo encontrado.
          </span>
        )}
        {group && (
          <div className="md:ml-auto flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            {SHOW_PDF_EXPORT && (
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            )}
          </div>
        )}
      </div>

      {processosQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar a lista de processos.
          </AlertDescription>
        </Alert>
      )}

      {selected && processDetailQuery.isLoading && (
        <Alert>
          <AlertDescription>Carregando dados do processo…</AlertDescription>
        </Alert>
      )}

      {selected && processDetailQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar análises deste processo.
          </AlertDescription>
        </Alert>
      )}

      {group && (
        <div className="print-area space-y-6">
          <ProcessSummary group={group} globalAvg={globalAvgQuery.data ?? null} />
          <ConsolidatedSections group={group} />
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { SECRETARIAS } from '@/lib/secretarias';
import { SecretariaSelector, type SecretariaListItem } from './SecretariaSelector';
import { SecretariaSummary } from './SecretariaSummary';
import type { Analysis } from '@/lib/reports/groupAnalysesByProcess';

function handlePrintSecretariaReport() {
  const source = document.querySelector<HTMLElement>('.secretaria-print-area');
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
}

export function SecretariaReport() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [searchParams] = useSearchParams();
  const urlSecretaria = searchParams.get('secretaria');
  const [selected, setSelected] = useState<string | null>(urlSecretaria);

  useEffect(() => {
    if (urlSecretaria && urlSecretaria !== selected) {
      setSelected(urlSecretaria);
    }
    // intentionally omits `selected` to avoid resetting when user
    // changes selection manually while the URL still has the old sigla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSecretaria]);

  const secretariasQuery = useQuery({
    queryKey: ['reports', 'secretarias', user?.id, isAdmin],
    enabled: !!user,
    queryFn: async (): Promise<SecretariaListItem[]> => {
      let q = supabase
        .from('analyses')
        .select('secretaria, created_at')
        .order('created_at', { ascending: false });
      if (!isAdmin && user) q = q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      const map = new Map<string, { total: number; lastAt: string }>();
      for (const row of data || []) {
        const sigla = row.secretaria || 'Não informado';
        const cur = map.get(sigla) || { total: 0, lastAt: row.created_at };
        cur.total += 1;
        if (row.created_at > cur.lastAt) cur.lastAt = row.created_at;
        map.set(sigla, cur);
      }
      return Array.from(map.entries())
        .map(([sigla, { total, lastAt }]) => {
          const ref = SECRETARIAS.find((s) => s.sigla === sigla);
          return { sigla, nome: ref?.nome, total, lastAt };
        })
        .sort((a, b) => (b.lastAt > a.lastAt ? 1 : -1));
    },
  });

  const detailQuery = useQuery({
    queryKey: ['reports', 'secretaria', selected, user?.id, isAdmin],
    enabled: !!user && !!selected,
    queryFn: async (): Promise<Analysis[]> => {
      // Todas as análises da secretaria (all-time), igual ao relatório "Por
      // Processo". A contagem do seletor também é all-time — filtrar por uma
      // janela de 30 dias aqui deixava o relatório vazio para secretarias sem
      // atividade recente (o seletor mostrava "SETRABES (4)" e o detalhe, 0).
      let q = supabase.from('analyses').select('*');
      if (!isAdmin && user) q = q.eq('user_id', user.id);
      const { data, error } = await q;
      if (error) throw error;
      // Mesmo bucket do seletor: `a.secretaria || 'Não informado'` (cobre o
      // caso de secretaria nula).
      return ((data || []) as Analysis[]).filter(
        (a) => (a.secretaria || 'Não informado') === selected,
      );
    },
  });

  const nomeSelecionada = useMemo(
    () => SECRETARIAS.find((s) => s.sigla === selected)?.nome,
    [selected],
  );

  const items = secretariasQuery.data || [];
  const hasData = !!(
    selected && detailQuery.data && detailQuery.data.length > 0
  );

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col md:flex-row md:items-center gap-3">
        <SecretariaSelector
          items={items}
          value={selected}
          onChange={setSelected}
          loading={secretariasQuery.isLoading}
        />
        {secretariasQuery.isSuccess && items.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Nenhuma secretaria encontrada.
          </span>
        )}
        {hasData && (
          <div className="md:ml-auto flex gap-2">
            <Button variant="outline" onClick={handlePrintSecretariaReport}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        )}
      </div>

      {secretariasQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar a lista de secretarias.
          </AlertDescription>
        </Alert>
      )}

      {selected && detailQuery.isLoading && (
        <Alert>
          <AlertDescription>Carregando dados da secretaria…</AlertDescription>
        </Alert>
      )}

      {selected && detailQuery.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Erro ao carregar análises desta secretaria.
          </AlertDescription>
        </Alert>
      )}

      {selected && detailQuery.isSuccess && (detailQuery.data?.length ?? 0) === 0 && (
        <Alert>
          <AlertDescription>
            Nenhuma análise encontrada para esta secretaria.
          </AlertDescription>
        </Alert>
      )}

      {hasData && (
        <div className="secretaria-print-area">
          <SecretariaSummary
            sigla={selected!}
            nome={nomeSelecionada}
            analyses={detailQuery.data!}
            totalAllTime={items.find((i) => i.sigla === selected)?.total ?? null}
          />
        </div>
      )}
    </div>
  );
}

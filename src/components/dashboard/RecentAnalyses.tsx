import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface RecentItem {
  id: string;
  processo?: string | null;
  tipo_documento: string;
  status: string;
  conformidade_percentual?: number | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, string> = {
  etp: 'Estudo Técnico Preliminar',
  ETP: 'Estudo Técnico Preliminar',
  dfd: 'Documento de Formalização da Demanda',
  DFD: 'Documento de Formalização da Demanda',
  'termo-referencia': 'Termo de Referência',
  TR: 'Termo de Referência',
  'nota-tecnica': 'Nota Técnica',
  NT: 'Nota Técnica',
  'analise-risco': 'Análise de Risco',
  AR: 'Análise de Risco',
};

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    success: { label: 'Concluída', cls: 'bg-success/10 text-success border-success/20' },
    processing: { label: 'Em andamento', cls: 'bg-primary/10 text-primary border-primary/20' },
    pending: { label: 'Pendente', cls: 'bg-warning/10 text-warning border-warning/20' },
    error: { label: 'Não conforme', cls: 'bg-danger/10 text-danger border-danger/20' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
  return <Badge variant="outline" className={`${s.cls} font-medium`}>{s.label}</Badge>;
}

export function RecentAnalyses({ items }: { items: RecentItem[] }) {
  return (
    <Card className="p-6 rounded-2xl shadow-card border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Análises Recentes</h3>
        <Button asChild variant="ghost" size="sm" className="text-primary h-7">
          <Link to="/analyses">
            Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma análise ainda.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const date = new Date(it.created_at).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            const pct = Number(it.conformidade_percentual ?? 0);
            return (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {it.processo || it.id.slice(0, 8)} - {TYPE_LABEL[it.tipo_documento] ?? it.tipo_documento}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {it.tipo_documento} · {date}
                  </p>
                </div>
                <div className="hidden sm:block">{statusBadge(it.status)}</div>
                <div className="w-24 hidden md:flex items-center gap-2">
                  <Progress value={pct} className="h-1.5" />
                  <span className="text-xs font-semibold tabular-nums text-foreground w-10 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Button asChild variant="outline" className="w-full mt-4 rounded-xl">
        <Link to="/analyses">Ver todas as análises</Link>
      </Button>
    </Card>
  );
}

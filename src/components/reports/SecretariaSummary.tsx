import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllDocumentTypes } from '@/lib/documentTypes';
import { relativeTimeFromNow } from '@/lib/reports/processHealth';
import type { Analysis } from '@/lib/reports/groupAnalysesByProcess';

interface SecretariaSummaryProps {
  sigla: string;
  nome?: string;
  analyses: Analysis[];
  totalAllTime?: number | null;
}

const COLOR_ABOVE = 'hsl(142, 76%, 36%)';
const COLOR_BELOW = 'hsl(0, 72%, 51%)';
const STATUS_COLOR: Record<string, string> = {
  success: 'hsl(142, 76%, 36%)',
  processing: 'hsl(45, 100%, 51%)',
  pending: 'hsl(210, 70%, 55%)',
  error: 'hsl(0, 72%, 51%)',
};
const STATUS_LABEL: Record<string, string> = {
  success: 'Concluída',
  processing: 'Em análise',
  pending: 'Pendente',
  error: 'Erro',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function SecretariaSummary({
  sigla,
  nome,
  analyses,
  totalAllTime = null,
}: SecretariaSummaryProps) {
  const allTypes = getAllDocumentTypes();
  const navigate = useNavigate();
  const goToProcesso = (processo?: string) => {
    if (!processo) return;
    navigate(`/reports?tab=consolidated&processo=${encodeURIComponent(processo)}`);
  };

  const derived = useMemo(() => {
    const success = analyses.filter((a) => a.status === 'success');
    const successWithScore = success.filter((a) => a.conformidade_percentual !== null);
    const total = analyses.length;
    const successRate = total > 0 ? (success.length / total) * 100 : 0;

    const avgConformidade =
      successWithScore.length > 0
        ? successWithScore.reduce((s, a) => s + (a.conformidade_percentual || 0), 0) /
          successWithScore.length
        : 0;

    const processos = new Set(analyses.map((a) => a.processo));
    const lastAt = analyses.length
      ? analyses.map((a) => a.created_at).sort().slice(-1)[0]
      : null;

    const conformityByType = allTypes
      .map((t) => {
        const ok = success.filter(
          (a) => a.tipo_documento === t.id && a.conformidade_percentual !== null,
        );
        if (!ok.length) return null;
        const avg =
          ok.reduce((s, a) => s + (a.conformidade_percentual || 0), 0) / ok.length;
        return { tipo: t.shortName, conformidade: parseFloat(avg.toFixed(1)) };
      })
      .filter((x): x is { tipo: string; conformidade: number } => x !== null);

    const statusCounts: Record<string, number> = {};
    for (const a of analyses) {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusCounts).map(([status, value]) => ({
      status,
      label: STATUS_LABEL[status] || status,
      value,
    }));

    const today = new Date();
    const trendDays = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (29 - i));
      return d.toISOString().split('T')[0];
    });
    const trendData = trendDays.map((day) => {
      const dayAnalyses = successWithScore.filter(
        (a) => (a.completed_at ?? a.created_at).split('T')[0] === day,
      );
      const avg =
        dayAnalyses.length > 0
          ? dayAnalyses.reduce((s, a) => s + (a.conformidade_percentual || 0), 0) /
            dayAnalyses.length
          : null;
      return {
        date: new Date(day).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        conformidade: avg !== null ? parseFloat(avg.toFixed(1)) : null,
      };
    });

    const byProcesso = new Map<string, { sum: number; count: number }>();
    for (const a of successWithScore) {
      const cur = byProcesso.get(a.processo) || { sum: 0, count: 0 };
      cur.sum += a.conformidade_percentual || 0;
      cur.count += 1;
      byProcesso.set(a.processo, cur);
    }
    const topProcessos = Array.from(byProcesso.entries())
      .map(([processo, { sum, count }]) => ({
        processo,
        conformidade: parseFloat((sum / count).toFixed(1)),
      }))
      .sort((a, b) => b.conformidade - a.conformidade)
      .slice(0, 5);

    return {
      total,
      success: success.length,
      successRate,
      avgConformidade,
      processosCount: processos.size,
      lastAt,
      conformityByType,
      statusDistribution,
      trendData,
      topProcessos,
    };
  }, [analyses, allTypes]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Resumo da Secretaria {sigla}
          {nome && (
            <span className="block text-sm font-normal text-muted-foreground mt-1">
              {nome}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mb-6">
          <div>
            <div className="text-xs text-muted-foreground">Últimos 30 dias</div>
            <div className="text-2xl font-bold">{derived.total}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total de Análises</div>
            <div className="text-2xl font-bold">
              {totalAllTime !== null ? totalAllTime : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Conformidade Média</div>
            <div className="text-2xl font-bold">{derived.avgConformidade.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
            <div className="text-2xl font-bold">{derived.successRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Processos</div>
            <div className="text-2xl font-bold">{derived.processosCount}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Última Atividade</div>
            <div className="text-sm font-medium">
              {derived.lastAt ? fmtDate(derived.lastAt) : '—'}
            </div>
            {derived.lastAt && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {relativeTimeFromNow(derived.lastAt)}
              </div>
            )}
          </div>
        </div>

        {derived.conformityByType.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-muted-foreground mb-2">
              Conformidade por Tipo de Documento
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={derived.conformityByType}
                margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis domain={[0, 100]} unit="%" />
                <ChartTooltip formatter={(v: number) => [`${v}%`, 'Conformidade']} />
                <ReferenceLine
                  y={derived.avgConformidade}
                  stroke="hsl(250, 60%, 55%)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Média ${derived.avgConformidade.toFixed(1)}%`,
                    position: 'insideTopRight',
                    fill: 'hsl(250, 60%, 55%)',
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="conformidade" name="Conformidade" maxBarSize={64}>
                  {derived.conformityByType.map((e) => (
                    <Cell
                      key={e.tipo}
                      fill={
                        e.conformidade >= derived.avgConformidade ? COLOR_ABOVE : COLOR_BELOW
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {derived.statusDistribution.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">
                Distribuição por Status
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={derived.statusDistribution}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ label, percent }) =>
                      `${label} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {derived.statusDistribution.map((e) => (
                      <Cell key={e.status} fill={STATUS_COLOR[e.status] || '#999'} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(v: number) => [`${v}`, 'Análises']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Tendência de Conformidade (30 dias)
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={derived.trendData}
                margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <ChartTooltip
                  formatter={(v: number | null) =>
                    v === null ? ['—', 'Conformidade'] : [`${v}%`, 'Conformidade']
                  }
                />
                <Line
                  type="monotone"
                  dataKey="conformidade"
                  stroke="hsl(250, 60%, 55%)"
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {derived.topProcessos.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">
              Top 5 Processos por Conformidade
              <span className="ml-2 text-muted-foreground/70">
                · clique numa barra para abrir o relatório do processo
              </span>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(160, derived.topProcessos.length * 36)}>
              <BarChart
                data={derived.topProcessos}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis
                  dataKey="processo"
                  type="category"
                  width={160}
                  tick={{ fontSize: 11, cursor: 'pointer', fill: 'hsl(224, 76%, 48%)' }}
                  onClick={(e: { value?: string }) => goToProcesso(e?.value)}
                />
                <ChartTooltip formatter={(v: number) => [`${v}%`, 'Conformidade']} />
                <Bar
                  dataKey="conformidade"
                  fill="hsl(142, 76%, 36%)"
                  maxBarSize={20}
                  cursor="pointer"
                  onClick={(entry: { processo?: string }) => goToProcesso(entry?.processo)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

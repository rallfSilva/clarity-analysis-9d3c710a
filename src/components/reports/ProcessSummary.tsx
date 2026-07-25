import { Link } from 'react-router-dom';
import { ArrowDown, Check, Upload, X } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getAllDocumentTypes } from '@/lib/documentTypes';
import type { ProcessGroup } from '@/lib/reports/groupAnalysesByProcess';
import { computeProcessHealth, relativeTimeFromNow } from '@/lib/reports/processHealth';

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
const HEALTH_STYLES: Record<'green' | 'yellow' | 'red', string> = {
  green: 'bg-emerald-600 hover:bg-emerald-600',
  yellow: 'bg-amber-500 hover:bg-amber-500',
  red: 'bg-red-600 hover:bg-red-600',
};

interface ProcessSummaryProps {
  group: ProcessGroup;
  globalAvg?: number | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ProcessSummary({ group, globalAvg = null }: ProcessSummaryProps) {
  const allTypes = getAllDocumentTypes();

  const avgConformidade =
    group.success.length > 0
      ? group.success.reduce((sum, a) => sum + (a.conformidade_percentual || 0), 0) /
        group.success.length
      : 0;

  const dates = group.all.map((a) => a.created_at).sort();
  const firstAt = dates[0];
  const lastAt = dates[dates.length - 1];

  const conformityByType = allTypes
    .map((t) => {
      const successEntries = (group.byType[t.id] || []).filter(
        (a) => a.status === 'success' && a.conformidade_percentual !== null,
      );
      if (successEntries.length === 0) return null;
      const avg =
        successEntries.reduce((sum, a) => sum + (a.conformidade_percentual || 0), 0) /
        successEntries.length;
      return { tipo: t.shortName, conformidade: parseFloat(avg.toFixed(1)) };
    })
    .filter((x): x is { tipo: string; conformidade: number } => x !== null);

  const health = computeProcessHealth(group);
  const delta = globalAvg !== null && group.success.length > 0
    ? parseFloat((avgConformidade - globalAvg).toFixed(1))
    : null;

  const timelinePoints = group.all.map((a) => {
    const typeIdx = allTypes.findIndex((t) => t.id === a.tipo_documento);
    return {
      x: new Date(a.created_at).getTime(),
      y: typeIdx >= 0 ? typeIdx : allTypes.length,
      status: a.status,
      tipo: allTypes[typeIdx]?.shortName || a.tipo_documento,
      created_at: a.created_at,
      conformidade: a.conformidade_percentual,
    };
  });

  const evolutionByType = allTypes
    .map((t) => {
      const entries = (group.byType[t.id] || [])
        .filter((a) => a.status === 'success' && a.conformidade_percentual !== null)
        .slice()
        .sort((a, b) => (a.created_at > b.created_at ? 1 : -1));
      if (entries.length < 2) return null;
      return {
        tipo: t.shortName,
        points: entries.map((a, i) => ({
          versao: `v${i + 1}`,
          conformidade: parseFloat((a.conformidade_percentual || 0).toFixed(1)),
          date: a.created_at,
        })),
      };
    })
    .filter((x): x is { tipo: string; points: { versao: string; conformidade: number; date: string }[] } => x !== null);

  return (
    <Card className="consolidated-summary">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Resumo do Processo {group.processo}</CardTitle>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${HEALTH_STYLES[health.level]} cursor-help`}>
              {health.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="font-medium mb-2">{health.summary}</div>
            <div className="space-y-1">
              {health.criteria.map((c) => (
                <div key={c.label} className="flex items-start gap-1.5 text-xs">
                  {c.met ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
                  )}
                  <span>
                    {c.label}{' '}
                    <span className="opacity-80">({c.value})</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-border/40 text-[10px] opacity-80">
              Saudável = todos os critérios atendidos. Crítico = qualquer erro ou conformidade abaixo de 70%.
            </div>
          </TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <div>
            <div className="text-xs text-muted-foreground">Conformidade Média</div>
            <div className="text-2xl font-bold">{avgConformidade.toFixed(1)}%</div>
            {globalAvg !== null && delta !== null && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Média geral: {globalAvg.toFixed(1)}%{' '}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`cursor-help ${
                        delta >= 0
                          ? 'text-emerald-600 font-medium'
                          : 'text-red-600 font-medium'
                      }`}
                    >
                      ({delta >= 0 ? '+' : ''}
                      {delta})
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Diferença em pontos percentuais entre este processo e a média geral
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Análises Concluídas</div>
            <div className="text-2xl font-bold">
              {group.success.length}/{group.all.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Primeira Análise</div>
            <div className="text-sm font-medium">{firstAt ? fmtDate(firstAt) : '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Última Análise</div>
            <div className="text-sm font-medium">{lastAt ? fmtDate(lastAt) : '—'}</div>
            {lastAt && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {relativeTimeFromNow(lastAt)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-2">Documentos</div>
          <div className="flex flex-wrap gap-2">
            {allTypes.map((t) => {
              const entries = group.byType[t.id] || [];
              const hasSuccess = entries.some((a) => a.status === 'success');
              const hasPending = entries.some((a) => a.status !== 'success');
              if (hasSuccess) {
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <a
                        href={`#secao-${t.id}`}
                        aria-label={`Ir para a seção ${t.shortName}`}
                        className="no-underline"
                      >
                        <Badge className="bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                          {t.shortName} ✓
                        </Badge>
                      </a>
                    </TooltipTrigger>
                    <TooltipContent className="flex items-center gap-1.5">
                      <ArrowDown className="h-3.5 w-3.5" />
                      Ver a seção de {t.shortName} neste relatório
                    </TooltipContent>
                  </Tooltip>
                );
              }
              if (hasPending) {
                return (
                  <Tooltip key={t.id}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline">{t.shortName} (pendente)</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      Análise de {t.shortName} em andamento ou com erro
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return (
                <Tooltip key={t.id}>
                  <TooltipTrigger asChild>
                    <Link
                      to={`${t.route}?processo=${encodeURIComponent(group.processo)}`}
                      aria-label={`Enviar ${t.shortName} para o processo ${group.processo}`}
                      className="no-underline"
                    >
                      <Badge
                        variant="secondary"
                        className="opacity-60 hover:opacity-100 cursor-pointer"
                      >
                        {t.shortName} —
                      </Badge>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    Enviar {t.shortName} para análise neste processo
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {conformityByType.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-muted-foreground mb-2">
              Conformidade por Tipo de Documento
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={conformityByType} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis domain={[0, 100]} unit="%" />
                <ChartTooltip formatter={(value: number) => [`${value}%`, 'Conformidade']} />
                <ReferenceLine
                  y={avgConformidade}
                  stroke="hsl(250, 60%, 55%)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Média ${avgConformidade.toFixed(1)}%`,
                    position: 'insideTopRight',
                    fill: 'hsl(250, 60%, 55%)',
                    fontSize: 11,
                  }}
                />
                <Bar dataKey="conformidade" name="Conformidade" maxBarSize={64}>
                  {conformityByType.map((entry) => (
                    <Cell
                      key={entry.tipo}
                      fill={entry.conformidade >= avgConformidade ? COLOR_ABOVE : COLOR_BELOW}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {evolutionByType.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-muted-foreground mb-2">
              Evolução em Reanálises
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {evolutionByType.map((ev) => (
                <div key={ev.tipo} className="border rounded-md p-3">
                  <div className="text-xs font-medium mb-1">{ev.tipo}</div>
                  <ResponsiveContainer width="100%" height={80}>
                    <LineChart data={ev.points} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <XAxis dataKey="versao" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <ChartTooltip
                        formatter={(value: number) => [`${value}%`, 'Conformidade']}
                        labelFormatter={(label: string, items) => {
                          const p = items[0]?.payload as { date?: string } | undefined;
                          return `${label}${p?.date ? ` — ${fmtDate(p.date)}` : ''}`;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conformidade"
                        stroke="hsl(250, 60%, 55%)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {timelinePoints.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-muted-foreground mb-2">
              Linha do Tempo das Análises
            </div>
            <ResponsiveContainer width="100%" height={Math.max(160, allTypes.length * 32)}>
              <ScatterChart margin={{ top: 8, right: 24, bottom: 16, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(ts: number) => fmtDate(new Date(ts).toISOString())}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="y"
                  type="number"
                  domain={[-0.5, allTypes.length - 0.5]}
                  ticks={allTypes.map((_, i) => i)}
                  tickFormatter={(idx: number) => allTypes[idx]?.shortName || ''}
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <ZAxis range={[80, 80]} />
                <ChartTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as {
                      tipo: string;
                      status: string;
                      created_at: string;
                      conformidade: number | null;
                    };
                    return (
                      <div className="rounded-md border bg-background px-3 py-2 text-xs shadow">
                        <div className="font-medium">{p.tipo}</div>
                        <div>{fmtDateTime(p.created_at)}</div>
                        <div>{STATUS_LABEL[p.status] || p.status}</div>
                        {p.conformidade !== null && (
                          <div>Conformidade: {p.conformidade.toFixed(1)}%</div>
                        )}
                      </div>
                    );
                  }}
                />
                <Scatter data={timelinePoints} shape="circle">
                  {timelinePoints.map((p, i) => (
                    <Cell key={i} fill={STATUS_COLOR[p.status] || '#999'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: STATUS_COLOR[key] }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

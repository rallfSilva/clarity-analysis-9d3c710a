import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText, Hash, Calendar, Clock, CheckCircle2, AlertTriangle, XCircle, MinusCircle,
  ListChecks, ShieldCheck, User, Mail, IdCard, Printer, Download, FileDown, Copy,
  ChevronsUpDown, BookOpen, Lightbulb, Gavel, ClipboardList, Target,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { toast } from '@/hooks/use-toast';
import {
  normalizeReport, situacaoColorClass, criticidadeBadge, processingDurationLabel,
  type NormalizedItem,
} from '@/lib/reportUtils';
import { exportReportPDF } from '@/lib/reportPdf';

interface Analysis {
  id: string;
  processo: string;
  tipo_documento: string;
  status: string;
  conformidade_percentual: number | null;
  created_at: string;
  completed_at: string | null;
  relatorio_html: string | null;
  resultado_json?: any;
  user_id: string;
}

interface Analyst {
  name: string;
  email: string;
}

const STATUS_COLORS = {
  conforme: 'hsl(142 71% 45%)',
  parcial: 'hsl(38 92% 50%)',
  nao_conforme: 'hsl(0 84% 60%)',
  nao_aplica: 'hsl(220 9% 60%)',
} as const;

function CircularProgress({ value }: { value: number }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const color = value >= 80 ? 'hsl(var(--success))' : value >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground tabular-nums">{value.toFixed(1)}%</span>
        <span className="text-xs text-muted-foreground mt-1">Conformidade</span>
      </div>
    </div>
  );
}

function IndicatorCard({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: React.ReactNode; tone?: 'default' | 'success' | 'warning' | 'danger' | 'muted' }) {
  const toneMap: Record<string, string> = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    warning: 'text-warning bg-warning/10',
    danger: 'text-danger bg-danger/10',
    muted: 'text-muted-foreground bg-muted',
  };
  return (
    <Card className="p-4 rounded-2xl border-border/60 shadow-card hover:shadow-elegant transition-all">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${toneMap[tone || 'default']}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-base font-semibold text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function ReportView({ analysis, analyst }: { analysis: Analysis; analyst: Analyst | null }) {
  const printRef = useRef<HTMLDivElement>(null);
  const report = useMemo(() => normalizeReport(analysis.resultado_json), [analysis.resultado_json]);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const conformidade = analysis.conformidade_percentual ?? report.conformidadePercentual ?? 0;
  const tempo = processingDurationLabel(analysis.created_at, analysis.completed_at);

  const analystShortId = analysis.user_id.slice(0, 8);

  const pieData = [
    { name: 'Conforme', value: report.totals.conforme, color: STATUS_COLORS.conforme },
    { name: 'Parcial', value: report.totals.parcial, color: STATUS_COLORS.parcial },
    { name: 'Não Conforme', value: report.totals.nao_conforme, color: STATUS_COLORS.nao_conforme },
    { name: 'Não se Aplica', value: report.totals.nao_aplica, color: STATUS_COLORS.nao_aplica },
  ].filter((d) => d.value > 0);

  const radarData = [
    { criterio: 'Conforme', valor: report.totals.conforme },
    { criterio: 'Parcial', valor: report.totals.parcial },
    { criterio: 'Não Conforme', valor: report.totals.nao_conforme },
    { criterio: 'Não Aplica', valor: report.totals.nao_aplica },
  ];

  const expandAll = () => setOpenItems(report.items.map((i) => `item-${i.numero}`));
  const collapseAll = () => setOpenItems([]);

  const copySummary = async () => {
    const summary = [
      `Relatório de Auditoria — ${analysis.tipo_documento}`,
      `Processo: ${analysis.processo}`,
      `Conformidade Geral: ${conformidade.toFixed(1)}%`,
      report.diagnostico ? `\nDiagnóstico: ${report.diagnostico}` : '',
      report.parecerFinal ? `\nParecer: ${report.parecerFinal}` : '',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(summary);
    toast({ title: 'Resumo copiado', description: 'O resumo executivo foi copiado para a área de transferência.' });
  };

  const exportWord = () => {
    const html = printRef.current?.innerHTML || '';
    const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><title>Relatório</title></head><body>${html}</body></html>`;
    const blob = new Blob(['\ufeff', doc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_${analysis.tipo_documento}_${analysis.processo || 'sem-processo'}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdf = async () => {
    try {
      await exportReportPDF(analysis, analyst, report);
    } catch (e: any) {
      toast({ title: 'Erro ao gerar PDF', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-2 justify-end sticky top-0 z-10 bg-background/80 backdrop-blur py-2 -mx-6 px-6 border-b border-border/50 print:hidden">
        <Button size="sm" variant="outline" onClick={expandAll}>
          <ChevronsUpDown className="h-4 w-4 mr-1" /> Expandir tudo
        </Button>
        <Button size="sm" variant="outline" onClick={collapseAll}>
          <ChevronsUpDown className="h-4 w-4 mr-1 rotate-90" /> Recolher tudo
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" /> Imprimir
        </Button>
        <Button size="sm" variant="outline" onClick={handlePdf}>
          <Download className="h-4 w-4 mr-1" /> PDF
        </Button>
        <Button size="sm" variant="outline" onClick={exportWord}>
          <FileDown className="h-4 w-4 mr-1" /> Word
        </Button>
        <Button size="sm" variant="outline" onClick={copySummary}>
          <Copy className="h-4 w-4 mr-1" /> Copiar Resumo
        </Button>
      </div>

      <div ref={printRef} className="space-y-6">
        {/* Header */}
        <Card className="p-6 rounded-2xl border-border/60 shadow-card bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="uppercase text-[10px] tracking-wide">Relatório Executivo</Badge>
                <Badge className="bg-primary text-primary-foreground">{analysis.tipo_documento}</Badge>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-1">
                Análise de Conformidade — Lei 14.133/2021
              </h2>
              <p className="text-muted-foreground text-sm mb-4">
                Processo <span className="font-semibold text-foreground">{analysis.processo}</span>
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Tempo: <span className="text-foreground">{tempo}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" /> {analyst?.name ?? '—'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" /> ID {analystShortId}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 shrink-0">
              <CircularProgress value={conformidade} />
              <div className="w-full max-w-[200px]">
                <Progress value={conformidade} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Indicator cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <IndicatorCard icon={Hash} label="Processo" value={analysis.processo} />
          <IndicatorCard icon={FileText} label="Documento" value={analysis.tipo_documento} />
          <IndicatorCard icon={Clock} label="Tempo" value={tempo} tone="muted" />
          <IndicatorCard icon={Calendar} label="Data" value={format(new Date(analysis.created_at), 'dd/MM/yyyy')} tone="muted" />
          <IndicatorCard icon={ListChecks} label="Itens Avaliados" value={report.items.length} />
          <IndicatorCard icon={CheckCircle2} label="Conforme" value={report.totals.conforme} tone="success" />
          <IndicatorCard icon={AlertTriangle} label="Parcial" value={report.totals.parcial} tone="warning" />
          <IndicatorCard icon={XCircle} label="Não Conforme" value={report.totals.nao_conforme} tone="danger" />
        </div>

        {/* Executive summary */}
        {(report.resumoExecutivo || report.diagnostico || report.pontosFortes.length > 0 || report.ausenciasCriticas.length > 0) && (
          <Card className="p-6 rounded-2xl border-border/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Resumo Executivo</h3>
              <Badge variant="outline" className={
                conformidade >= 80 ? 'ml-auto border-success/30 text-success bg-success/10'
                  : conformidade >= 50 ? 'ml-auto border-warning/30 text-warning bg-warning/10'
                    : 'ml-auto border-danger/30 text-danger bg-danger/10'
              }>
                Risco {conformidade >= 80 ? 'Baixo' : conformidade >= 50 ? 'Moderado' : 'Alto'}
              </Badge>
            </div>
            {(report.resumoExecutivo || report.diagnostico) && (
              <p className="text-sm text-foreground/90 leading-relaxed mb-4">
                {report.resumoExecutivo || report.diagnostico}
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {report.pontosFortes.length > 0 && (
                <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-semibold text-success">Pontos Fortes</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-foreground/90 list-disc list-inside">
                    {report.pontosFortes.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {report.ausenciasCriticas.length > 0 && (
                <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-danger" />
                    <span className="font-semibold text-danger">Ausências Críticas</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-foreground/90 list-disc list-inside">
                    {report.ausenciasCriticas.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Analysis table */}
        {report.items.length > 0 && (
          <Card className="rounded-2xl border-border/60 shadow-card overflow-hidden">
            <div className="p-6 pb-3 flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Tabela de Análise</h3>
              <Badge variant="outline" className="ml-auto">{report.items.length} itens</Badge>
            </div>
            <Separator />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-semibold text-muted-foreground w-16">Item</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Elemento Avaliado</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground w-52">Situação</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground w-32">Criticidade</th>
                  </tr>
                </thead>
                <tbody>
                  <Accordion type="multiple" value={openItems} onValueChange={setOpenItems} asChild>
                    <>
                      {report.items.map((item) => (
                        <ItemRow key={item.numero} item={item} />
                      ))}
                    </>
                  </Accordion>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Consolidated recommendations */}
        {report.recomendacoes.length > 0 && (
          <Card className="p-6 rounded-2xl border-border/60 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
                <Lightbulb className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Recomendações da Auditoria</h3>
              <Badge variant="outline" className="ml-auto">{report.recomendacoes.length}</Badge>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-sm text-foreground/90">
              {report.recomendacoes.map((r, i) => (
                <li key={i} className="pl-1 leading-relaxed">{r}</li>
              ))}
            </ol>
          </Card>
        )}

        {/* Charts */}
        {pieData.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6 rounded-2xl border-border/60 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por Situação</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-6 rounded-2xl border-border/60 shadow-card">
              <h3 className="text-sm font-semibold text-foreground mb-4">Panorama de Conformidade</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="criterio" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar name="Itens" dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* Conclusion */}
        {(report.parecerFinal || report.diagnostico) && (
          <Card className="p-6 rounded-2xl border-primary/20 shadow-elegant bg-gradient-to-br from-primary/5 to-background">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Conclusão Técnica</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-xl bg-background border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Conformidade Geral</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{conformidade.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl bg-background border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Situação Final</p>
                <p className="text-lg font-semibold text-foreground">
                  {conformidade >= 80 ? 'Adequado' : conformidade >= 50 ? 'Adequado com Ressalvas' : 'Inadequado'}
                </p>
              </div>
              <div className="rounded-xl bg-background border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase mb-1">Itens Não-Conformes</p>
                <p className="text-2xl font-bold text-danger tabular-nums">{report.totals.nao_conforme}</p>
              </div>
            </div>
            {report.parecerFinal && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Parecer da IA</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{report.parecerFinal}</p>
              </div>
            )}
          </Card>
        )}

        {/* Legacy fallback */}
        {report.items.length === 0 && analysis.relatorio_html && (
          <Card className="p-6 rounded-2xl border-border/60 shadow-card">
            <h3 className="text-lg font-semibold text-foreground mb-3">Análise Detalhada</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysis.relatorio_html }} />
          </Card>
        )}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: NormalizedItem }) {
  const crit = criticidadeBadge(item.criticidade);
  return (
    <AccordionItem value={`item-${item.numero}`} asChild>
      <>
        <tr className="border-t border-border/60">
          <td colSpan={4} className="p-0">
            <AccordionTrigger className="hover:no-underline hover:bg-muted/40 px-4 py-3 [&[data-state=open]]:bg-muted/40">
              <div className="grid grid-cols-[4rem_1fr_13rem_8rem] gap-3 w-full text-left items-center">
                <span className="font-mono text-xs text-muted-foreground">{item.codigo}</span>
                <span className="text-sm text-foreground font-medium line-clamp-2">{item.elemento}</span>
                <Badge variant="outline" className={situacaoColorClass(item.situacao)}>{item.situacaoLabel}</Badge>
                <Badge variant="outline" className={crit.className}>{crit.icon} {crit.label}</Badge>
              </div>
            </AccordionTrigger>
          </td>
        </tr>
        <tr>
          <td colSpan={4} className="p-0">
            <AccordionContent className="px-4 pb-4 pt-0">
              <div className="grid md:grid-cols-2 gap-3 pt-3">
                {item.observacao && (
                  <div className="rounded-xl border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Observações / Evidências
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{item.observacao}</p>
                  </div>
                )}
                {item.recomendacao && (
                  <div className="rounded-xl border border-warning/20 bg-warning/5 p-3">
                    <p className="text-xs font-semibold text-warning uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5" /> Recomendação
                    </p>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{item.recomendacao}</p>
                  </div>
                )}
                {item.fundamentacaoLegal.length > 0 && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 md:col-span-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <Gavel className="h-3.5 w-3.5" /> Base Legal
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.fundamentacaoLegal.map((l, i) => (
                        <Badge key={i} variant="outline" className="bg-background border-primary/30 text-primary">
                          <BookOpen className="h-3 w-3 mr-1" /> {l}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </td>
        </tr>
      </>
    </AccordionItem>
  );
}

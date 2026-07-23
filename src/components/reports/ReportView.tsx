import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText, Calendar, Clock, User, IdCard, Printer, Download, FileDown, Copy,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  normalizeReport, processingDurationLabel,
  type SituacaoNormalizada,
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

function SituacaoBadge({ s, label }: { s: SituacaoNormalizada; label: string }) {
  const map: Record<SituacaoNormalizada, string> = {
    conforme: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    parcial: 'bg-orange-100 text-orange-700 border-orange-200',
    nao_conforme: 'bg-red-100 text-red-700 border-red-200',
    nao_aplica: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold border ${map[s]}`}>
      {label}
    </span>
  );
}

function QuantCard({
  label, value, tone,
}: { label: string; value: number; tone: 'blue' | 'green' | 'orange' | 'gray' }) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`rounded-xl border-2 p-4 text-center ${tones[tone]}`}>
      <p className="text-sm font-medium mb-2 leading-tight">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

export function ReportView({ analysis, analyst }: { analysis: Analysis; analyst: Analyst | null }) {
  const printRef = useRef<HTMLDivElement>(null);
  const report = useMemo(() => normalizeReport(analysis.resultado_json), [analysis.resultado_json]);
  const conformidade = analysis.conformidade_percentual ?? report.conformidadePercentual ?? 0;
  const tempo = processingDurationLabel(analysis.created_at, analysis.completed_at);
  const analystShortId = analysis.user_id.slice(0, 8);

  const total = report.items.length;

  const copySummary = async () => {
    const summary = [
      `Relatório — ${analysis.tipo_documento}`,
      `Processo: ${analysis.processo}`,
      `Conformidade: ${conformidade.toFixed(1)}%`,
      report.diagnostico ? `\nDiagnóstico: ${report.diagnostico}` : '',
      report.parecerFinal ? `\nParecer: ${report.parecerFinal}` : '',
    ].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(summary);
    toast({ title: 'Resumo copiado' });
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
        {/* Header context */}
        <Card className="p-5 rounded-xl border-border/60">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="uppercase text-[10px] tracking-wide">Relatório</Badge>
            <Badge className="bg-primary text-primary-foreground">{analysis.tipo_documento}</Badge>
          </div>
          <h2 className="text-xl font-bold text-primary mb-1">
            Análise de Conformidade — Lei 14.133/2021
          </h2>
          <p className="text-muted-foreground text-sm mb-3">
            Processo <span className="font-semibold text-foreground">{analysis.processo}</span>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
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
        </Card>

        {/* Tabela de Análise Detalhada por Item */}
        {report.items.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">Tabela de Análise Detalhada por Item</h3>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-left">
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border w-16">Item</th>
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border">Elemento Avaliado</th>
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border w-40">Situação</th>
                    <th className="px-4 py-3 font-semibold text-foreground border-b border-border">Observações / Recomendações</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item, idx) => {
                    const obs = [item.observacao, item.recomendacao].filter(Boolean).join('\n\n');
                    return (
                      <tr key={item.numero} className={`align-top ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}>
                        <td className="px-4 py-3 border-b border-border font-mono text-sm text-muted-foreground align-top">
                          {item.codigo}
                        </td>
                        <td className="px-4 py-3 border-b border-border text-foreground align-top">
                          {item.elemento}
                        </td>
                        <td className="px-4 py-3 border-b border-border align-top">
                          <SituacaoBadge s={item.situacao} label={item.situacaoLabel} />
                        </td>
                        <td className="px-4 py-3 border-b border-border text-foreground/90 leading-relaxed whitespace-pre-line align-top">
                          {obs || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resumo Quantitativo */}
        {report.items.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">Resumo Quantitativo</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <QuantCard label="Total de Itens Avaliados" value={total} tone="blue" />
              <QuantCard label="Conforme" value={report.totals.conforme} tone="green" />
              <QuantCard label="Parcialmente Conforme" value={report.totals.parcial} tone="orange" />
              <QuantCard label="Não se Aplica" value={report.totals.nao_aplica} tone="gray" />
            </div>
            {report.totals.nao_conforme > 0 && (
              <div className="mt-3">
                <QuantCard label="Não Conforme" value={report.totals.nao_conforme} tone="orange" />
              </div>
            )}
          </div>
        )}

        {/* Conclusão e Recomendações */}
        {(report.parecerFinal || report.diagnostico || report.resumoExecutivo || report.recomendacoes.length > 0) && (
          <div>
            <h3 className="text-lg font-bold text-primary mb-3">Conclusão e Recomendações</h3>
            <div className="space-y-3">
              {(report.parecerFinal || report.diagnostico || report.resumoExecutivo) && (
                <div className="border-l-4 border-blue-400 bg-blue-50/60 rounded-r-lg p-4">
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {report.parecerFinal || report.diagnostico || report.resumoExecutivo}
                  </p>
                </div>
              )}
              {report.recomendacoes.length > 0 && (
                <div className="border-l-4 border-orange-400 bg-orange-50/60 rounded-r-lg p-4">
                  <ul className="space-y-2 list-disc list-inside text-sm text-foreground/90">
                    {report.recomendacoes.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legacy fallback */}
        {report.items.length === 0 && analysis.relatorio_html && (
          <Card className="p-6 rounded-xl border-border/60">
            <h3 className="text-lg font-semibold text-foreground mb-3">Análise Detalhada</h3>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: analysis.relatorio_html }} />
          </Card>
        )}
      </div>
    </div>
  );
}

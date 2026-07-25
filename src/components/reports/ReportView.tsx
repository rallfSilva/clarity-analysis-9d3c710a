import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText, Calendar, Clock, User, IdCard, Printer, Download, FileDown, Copy, ClipboardList,
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
import { getDocumentTypeById } from '@/lib/documentTypes';

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
    conforme: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    parcial: 'bg-amber-50 text-amber-700 border-amber-200',
    nao_conforme: 'bg-red-50 text-red-700 border-red-200',
    nao_aplica: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium border ${map[s]}`}>
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
  const tipoLabel = getDocumentTypeById(analysis.tipo_documento)?.name ?? analysis.tipo_documento;
  const tipoShortLabel = getDocumentTypeById(analysis.tipo_documento)?.shortName ?? analysis.tipo_documento;

  const total = report.items.length;

  const copySummary = async () => {
    const summary = [
      `Relatório — ${tipoLabel}`,
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
    a.download = `Relatorio_${tipoShortLabel}_${analysis.processo || 'sem-processo'}.doc`;
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

  const rd = report.resumoDocumento;
  const startTs = new Date(analysis.created_at);
  const endTs = analysis.completed_at ? new Date(analysis.completed_at) : null;
  const fmtDT = (d: Date) => format(d, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR });
  const totalSinceEntrada = endTs
    ? processingDurationLabel(analysis.created_at, analysis.completed_at)
    : '—';

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
        {/* Detalhes da Análise */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Detalhes da Análise</h2>

          {/* Informações Gerais */}
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground mb-3">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Usuário</p>
                <p className="font-semibold text-foreground">{analyst?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processo</p>
                <p className="font-semibold text-foreground">{analysis.processo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo de Documento</p>
                <p className="font-semibold text-foreground">{tipoLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className="bg-blue-600 hover:bg-blue-600 text-white rounded-full">
                  {analysis.status === 'concluida' || analysis.status === 'completed' ? 'Concluído' : analysis.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conformidade</p>
                <p className="font-semibold text-foreground">{conformidade.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Métricas de Desempenho */}
          <Card className="p-4 rounded-xl bg-muted/40 border-border/60">
            <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4" /> Métricas de Desempenho
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entrada do Documento</p>
                <p className="font-medium text-foreground">{fmtDT(startTs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Início do Processamento</p>
                <p className="font-medium text-foreground">{fmtDT(startTs)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fim do Processamento</p>
                <p className="font-medium text-foreground">{endTs ? fmtDT(endTs) : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo de processamento</p>
                <p className="font-semibold text-blue-700">{tempo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo total desde a entrada</p>
                <p className="font-semibold text-blue-700">{totalSinceEntrada}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ID Analista</p>
                <p className="font-medium text-foreground flex items-center gap-1">
                  <IdCard className="h-3 w-3" /> {analystShortId}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Relatório Detalhado */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Relatório Detalhado</h3>
          <Card className="rounded-xl border-border/60 overflow-hidden">
            <div className="text-center py-4 px-5 bg-muted/40 border-b border-border/60">
              <h4 className="text-lg font-bold text-foreground">
                Relatório de Análise de Conformidades — {tipoLabel}
              </h4>
            </div>
            {(rd?.processo || rd?.secretaria || rd?.objeto || rd?.base_normativa || rd?.responsaveis) && (
              <div className="p-5">
                <div className="border-l-4 border-blue-500 bg-blue-50/60 rounded-r-lg p-4 space-y-2 text-sm text-foreground/90">
                  <p className="text-base font-bold text-blue-900 mb-2">Resumo do Documento</p>
                  {rd?.processo && (<p><span className="font-semibold">Processo:</span> {rd.processo}</p>)}
                  {rd?.secretaria && (<p><span className="font-semibold">Secretaria:</span> {rd.secretaria}</p>)}
                  {rd?.objeto && (<p><span className="font-semibold">Objeto:</span> {rd.objeto}</p>)}
                  {rd?.base_normativa && (<p><span className="font-semibold">Base Normativa:</span> {rd.base_normativa}</p>)}
                  {rd?.responsaveis && (<p><span className="font-semibold">Responsáveis:</span> {rd.responsaveis}</p>)}
                </div>
              </div>
            )}
          </Card>
        </div>


        {/* Tabela de Análise */}
        {report.items.length > 0 && (
          <Card className="rounded-xl border-border/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-blue-50/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="text-base font-bold text-blue-900">Tabela de Análise Detalhada por Item</h3>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border border-blue-200 text-blue-800 bg-white">
                {report.items.length} itens
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-blue-900 bg-blue-50">
                    <th className="px-4 py-3 font-semibold w-24 border border-border">Item</th>
                    <th className="px-4 py-3 font-semibold w-64 border border-border">Elemento Avaliado</th>
                    <th className="px-4 py-3 font-semibold w-44 text-center border border-border">Situação</th>
                    <th className="px-4 py-3 font-semibold border border-border">Observações / Recomendações</th>
                  </tr>
                </thead>
                <tbody>
                  {report.items.map((item, idx) => {
                    const obs = [item.observacao, item.recomendacao].filter(Boolean).join(' ');
                    return (
                      <tr key={item.numero} className={`align-top ${idx % 2 === 1 ? 'bg-muted/20' : 'bg-background'}`}>
                        <td className="px-4 py-3 font-mono text-xs text-foreground border border-border">
                          {item.codigo}
                        </td>
                        <td className="px-4 py-3 text-foreground leading-snug border border-border">
                          {item.elemento}
                        </td>
                        <td className="px-4 py-3 text-center border border-border">
                          <SituacaoBadge s={item.situacao} label={item.situacaoLabel} />
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground/85 leading-relaxed border border-border whitespace-pre-line">
                          {obs}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
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

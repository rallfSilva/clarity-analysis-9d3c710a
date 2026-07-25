import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, TrendingUp, CheckCircle, Clock, Download, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { getDocumentTypeById } from '@/lib/documentTypes';
import jsPDF from 'jspdf';

const COLORS = ['hsl(250, 60%, 55%)', 'hsl(320, 70%, 75%)', 'hsl(142, 76%, 36%)', 'hsl(45, 100%, 51%)', 'hsl(0, 72%, 51%)'];

export function OverviewReport() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  const goToSecretaria = (secretaria?: string) => {
    if (!secretaria) return;
    navigate(`/reports?tab=secretaria&secretaria=${encodeURIComponent(secretaria)}`);
  };
  const goToProcesso = (processo?: string) => {
    if (!processo) return;
    navigate(`/reports?tab=consolidated&processo=${encodeURIComponent(processo)}`);
  };
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgConformidade: 0,
    successRate: 0,
    avgProcessingTime: 0,
  });
  const [documentTypes, setDocumentTypes] = useState<{ id: string; name: string; value: number }[]>([]);
  const [conformityTrend, setConformityTrend] = useState<{ date: string; conformidade: number }[]>([]);
  const [topSecretarias, setTopSecretarias] = useState<{ secretaria: string; conformidade: number }[]>([]);
  const [topProcessos, setTopProcessos] = useState<{ processo: string; conformidade: number }[]>([]);

  useEffect(() => {
    fetchReportData();
  }, [user, isAdmin]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      let query = supabase.from('analyses').select('*');
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data: analyses, error } = await query;
      if (error) throw error;

      // Calculate stats
      const total = analyses?.length || 0;
      const completed = analyses?.filter((a) => a.status === 'success') || [];
      const avgConformidade = completed.length > 0
        ? completed.reduce((sum, a) => sum + (a.conformidade_percentual || 0), 0) / completed.length
        : 0;
      const successRate = total > 0 ? (completed.length / total) * 100 : 0;

      const processingTimes = completed
        .filter((a) => a.started_at && a.completed_at)
        .map((a) => (new Date(a.completed_at!).getTime() - new Date(a.started_at!).getTime()) / 1000)
        .filter((s) => s >= 0);
      const avgProcessingTime = processingTimes.length
        ? processingTimes.reduce((sum, s) => sum + s, 0) / processingTimes.length
        : 0;

      setStats({
        total,
        avgConformidade,
        successRate,
        avgProcessingTime: Math.round(avgProcessingTime),
      });

      // Document types distribution
      const typeCount: Record<string, number> = {};
      analyses?.forEach((a) => {
        typeCount[a.tipo_documento] = (typeCount[a.tipo_documento] || 0) + 1;
      });
      setDocumentTypes(
        Object.entries(typeCount)
          .map(([id, value]) => ({
            id,
            name: getDocumentTypeById(id)?.shortName || id,
            value,
          }))
          .sort((a, b) => b.value - a.value)
      );

      // Conformity trend (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const trendData = last7Days.map((date) => {
        const dayAnalyses = completed.filter(
          (a) => a.completed_at?.split('T')[0] === date
        );
        const avgConf = dayAnalyses.length > 0
          ? dayAnalyses.reduce((sum, a) => sum + (a.conformidade_percentual || 0), 0) / dayAnalyses.length
          : 0;
        return {
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          conformidade: parseFloat(avgConf.toFixed(1)),
        };
      });
      setConformityTrend(trendData);

      // Top 5 secretarias com melhor conformidade média (apenas análises concluídas)
      const secretariaStats = new Map<string, { soma: number; total: number }>();
      completed.forEach((a) => {
        const key = a.secretaria || 'Não informado';
        const conf = Number(a.conformidade_percentual);
        if (isNaN(conf)) return;
        const cur = secretariaStats.get(key) || { soma: 0, total: 0 };
        cur.soma += conf;
        cur.total += 1;
        secretariaStats.set(key, cur);
      });
      const topSec = Array.from(secretariaStats.entries())
        .map(([secretaria, { soma, total }]) => ({
          secretaria,
          conformidade: parseFloat((soma / total).toFixed(1)),
        }))
        .sort((a, b) => b.conformidade - a.conformidade)
        .slice(0, 5);
      setTopSecretarias(topSec);

      // Top 5 processos com melhor conformidade média (apenas análises concluídas)
      const processoStats = new Map<string, { soma: number; total: number }>();
      completed.forEach((a) => {
        const key = a.processo;
        if (!key) return;
        const conf = Number(a.conformidade_percentual);
        if (isNaN(conf)) return;
        const cur = processoStats.get(key) || { soma: 0, total: 0 };
        cur.soma += conf;
        cur.total += 1;
        processoStats.set(key, cur);
      });
      const topProc = Array.from(processoStats.entries())
        .map(([processo, { soma, total }]) => ({
          processo,
          conformidade: parseFloat((soma / total).toFixed(1)),
        }))
        .sort((a, b) => b.conformidade - a.conformidade)
        .slice(0, 5);
      setTopProcessos(topProc);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do relatório',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      let y = margin;

      const checkPage = (needed = 20) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Header
      doc.setFillColor(46, 32, 110);
      doc.rect(0, 0, pageWidth, 70, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Consolidado - SIAC', margin, 35);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Gerado em ${new Date().toLocaleString('pt-BR')}`,
        margin,
        55
      );
      y = 100;

      // KPIs
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Indicadores Principais', margin, y);
      y += 20;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const kpiLines = [
        `Total de Análises: ${stats.total}`,
        `Conformidade Média: ${stats.avgConformidade.toFixed(1)}%`,
        `Taxa de Sucesso: ${stats.successRate.toFixed(1)}%`,
        `Tempo Médio de Processamento: ${stats.avgProcessingTime}s`,
      ];
      kpiLines.forEach((line) => {
        checkPage(16);
        doc.text(line, margin, y);
        y += 16;
      });
      y += 10;

      // Document types
      checkPage(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Distribuição por Tipo de Documento', margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      if (documentTypes.length === 0) {
        doc.text('Sem dados disponíveis.', margin, y);
        y += 16;
      } else {
        documentTypes.forEach((d) => {
          checkPage(16);
          doc.text(`• ${d.name}: ${d.value}`, margin, y);
          y += 16;
        });
      }
      y += 10;

      // Trend
      checkPage(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Tendência de Conformidade (7 dias)', margin, y);
      y += 18;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      conformityTrend.forEach((t) => {
        checkPage(16);
        doc.text(`${t.date}: ${t.conformidade}%`, margin, y);
        y += 16;
      });
      y += 10;

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `SIAC © ${new Date().getFullYear()} - Página ${i}/${pageCount}`,
          pageWidth / 2,
          pageHeight - 20,
          { align: 'center' }
        );
      }

      doc.save(`relatorio-consolidado-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Relatório exportado',
        description: 'O PDF foi baixado com sucesso.',
      });
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      toast({
        title: 'Erro ao exportar',
        description: err instanceof Error ? err.message : 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>

    {/* KPIs */}
    <div className="grid gap-6 md:grid-cols-4 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Análises
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Conformidade Média
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.avgConformidade.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Taxa de Sucesso
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.successRate.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tempo Médio
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {stats.avgProcessingTime}s
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Charts */}
    <div className="grid gap-6 md:grid-cols-2 mb-8">
      {/* Document Types */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo de Documento</CardTitle>
        </CardHeader>
        <CardContent>
          {documentTypes.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              Sem análises para exibir distribuição.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, _name, item) => [
                    `${value} análise${value === 1 ? '' : 's'}`,
                    getDocumentTypeById(item?.payload?.id)?.name || item?.payload?.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Conformity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Tendência de Conformidade (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conformityTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="conformidade"
                stroke="hsl(250, 60%, 55%)"
                strokeWidth={2}
                name="Conformidade (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>

    {/* Top 5 Secretarias com melhor Indicador de Conformidade */}
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Top 5 Secretarias com Melhor Conformidade</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Clique numa barra para ver o relatório da secretaria.
          </p>
        </div>
        <Link
          to="/reports?tab=secretaria"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap inline-flex items-center gap-1"
        >
          Ver detalhes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {topSecretarias.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Sem análises concluídas para calcular conformidade por secretaria.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSecretarias} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis
                dataKey="secretaria"
                type="category"
                width={150}
                tick={{ cursor: 'pointer', fill: 'hsl(224, 76%, 48%)' }}
                onClick={(e: { value?: string }) => goToSecretaria(e?.value)}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar
                dataKey="conformidade"
                fill="hsl(142, 76%, 36%)"
                name="Conformidade média (%)"
                cursor="pointer"
                onClick={(entry: { secretaria?: string }) => goToSecretaria(entry?.secretaria)}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>

    {/* Top 5 Processos com Melhor Conformidade */}
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Top 5 Processos com Melhor Conformidade</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Clique numa barra para ver o relatório do processo.
          </p>
        </div>
        <Link
          to="/reports?tab=consolidated"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap inline-flex items-center gap-1"
        >
          Ver detalhes
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {topProcessos.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
            Sem análises concluídas para calcular conformidade por processo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProcessos} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis
                dataKey="processo"
                type="category"
                width={160}
                tick={{ cursor: 'pointer', fill: 'hsl(224, 76%, 48%)', fontSize: 11 }}
                onClick={(e: { value?: string }) => goToProcesso(e?.value)}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Legend />
              <Bar
                dataKey="conformidade"
                fill="hsl(250, 60%, 55%)"
                name="Conformidade média (%)"
                cursor="pointer"
                onClick={(entry: { processo?: string }) => goToProcesso(entry?.processo)}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>

    {/* Export Button */}
    <div className="mt-8 flex justify-end">
      <Button onClick={handleExportPDF}>
        <Download className="h-4 w-4 mr-2" />
        Exportar Relatório Consolidado
      </Button>
    </div>
    </div>
  );
}

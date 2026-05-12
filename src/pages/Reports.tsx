import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

const COLORS = ['hsl(250, 60%, 55%)', 'hsl(320, 70%, 75%)', 'hsl(142, 76%, 36%)', 'hsl(45, 100%, 51%)', 'hsl(0, 72%, 51%)'];

export default function Reports() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgConformidade: 0,
    successRate: 0,
    avgProcessingTime: 0,
  });
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [conformityTrend, setConformityTrend] = useState<any[]>([]);
  const [topNonConformities, setTopNonConformities] = useState<any[]>([]);

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

      setStats({
        total,
        avgConformidade,
        successRate,
        avgProcessingTime: 45, // Placeholder
      });

      // Document types distribution
      const typeCount: Record<string, number> = {};
      analyses?.forEach((a) => {
        typeCount[a.tipo_documento] = (typeCount[a.tipo_documento] || 0) + 1;
      });
      setDocumentTypes(
        Object.entries(typeCount).map(([name, value]) => ({ name, value }))
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

      // Top non-conformities (placeholder - would need more detailed data)
      setTopNonConformities([
        { item: 'Documento incompleto', count: 12 },
        { item: 'Assinatura ausente', count: 8 },
        { item: 'Prazo vencido', count: 6 },
        { item: 'Formatação inadequada', count: 4 },
        { item: 'Informações inconsistentes', count: 3 },
      ]);
    } catch (error: any) {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios</h1>
        <p className="text-muted-foreground">
          Análise consolidada e insights sobre suas conformidades
        </p>
      </div>

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
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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

      {/* Top Non-Conformities */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Não-Conformidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topNonConformities} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="item" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(0, 72%, 51%)" name="Ocorrências" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 5 Secretarias com menos Não-Conformidades */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Top 5 Secretarias com Menos Não-Conformidades</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { secretaria: 'SEFAZ', count: 1 },
                { secretaria: 'SEDU', count: 2 },
                { secretaria: 'SESA', count: 3 },
                { secretaria: 'SEAG', count: 4 },
                { secretaria: 'SEJUS', count: 5 },
              ]}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="secretaria" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="hsl(142, 76%, 36%)" name="Não-Conformidades" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={() => {
          toast({
            title: 'Exportando relatório',
            description: 'Esta funcionalidade será implementada em breve',
          });
        }}>
          Exportar Relatório Consolidado
        </Button>
      </div>
    </div>
  );
}
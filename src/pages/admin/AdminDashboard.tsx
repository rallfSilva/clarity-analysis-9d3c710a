import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Settings as SettingsIcon,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

interface RecentUser {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    secretarias: 0,
    totalAnalyses: 0,
    todayAnalyses: 0,
    weekAnalyses: 0,
    successRate: 0,
    avgProcessingTime: 63,
  });
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      const [{ data: users }, { data: roles }, { data: analyses }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('role'),
        supabase.from('analyses').select('*'),
      ]);

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const todayAnalyses =
        analyses?.filter((a) => a.created_at.split('T')[0] === today).length || 0;
      const weekAnalyses = analyses?.filter((a) => a.created_at >= weekAgo).length || 0;
      const successCount = analyses?.filter((a) => a.status === 'success').length || 0;
      const successRate = analyses?.length ? (successCount / analyses.length) * 100 : 0;
      const admins = roles?.filter((r: any) => r.role === 'admin').length || 0;

      setStats({
        totalUsers: users?.length || 0,
        activeUsers: users?.filter((u) => u.is_active).length || 0,
        admins,
        secretarias: 0,
        totalAnalyses: analyses?.length || 0,
        todayAnalyses,
        weekAnalyses,
        successRate,
        avgProcessingTime: 63,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });
      setAnalysisData(
        last7Days.map((date) => {
          const dayAnalyses =
            analyses?.filter((a) => a.created_at.split('T')[0] === date) || [];
          return {
            date: new Date(date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            }),
            analises: dayAnalyses.length,
            sucesso: dayAnalyses.filter((a) => a.status === 'success').length,
          };
        }),
      );

      setRecentUsers((users || []).slice(0, 5) as RecentUser[]);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as estatísticas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const activePct = stats.totalUsers
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100)
    : 0;

  const kpiRow1 = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      hint: 'Usuários cadastrados',
      icon: Users,
    },
    {
      title: 'Usuários Ativos',
      value: stats.activeUsers,
      hint: `${activePct}% do total`,
      icon: UserCheck,
    },
    {
      title: 'Administradores',
      value: stats.admins,
      hint: 'Com acesso total',
      icon: ShieldCheck,
    },
    {
      title: 'Secretarias',
      value: stats.secretarias,
      hint: 'Órgãos representados',
      icon: Building2,
    },
  ];

  const kpiRow2 = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      hint: 'cadastrados no sistema',
      icon: Users,
    },
    {
      title: 'Análises (Hoje)',
      value: stats.todayAnalyses,
      hint: `${stats.weekAnalyses} esta semana`,
      icon: FileText,
    },
    {
      title: 'Taxa de Sucesso',
      value: `${stats.successRate.toFixed(1)}%`,
      hint: `${stats.totalAnalyses} total`,
      icon: CheckCircle,
    },
    {
      title: 'Tempo Médio',
      value: `${stats.avgProcessingTime}s`,
      hint: '\u00A0',
      icon: Clock,
    },
  ];

  const shortcuts = [
    {
      title: 'Gerenciar Usuários',
      desc: 'Visualize e edite usuários do sistema',
      icon: Users,
      to: '/admin/users',
    },
    {
      title: 'Gerenciar Prompts',
      desc: 'Configure prompts para análise de documentos',
      icon: MessageSquare,
      to: '/settings',
    },
    {
      title: 'Logs de Auditoria',
      desc: 'Veja o histórico de ações do sistema',
      icon: ClipboardList,
      to: '/admin/audit',
    },
    {
      title: 'Todas as Análises',
      desc: 'Visualize e gerencie todas as análises do sistema',
      icon: BarChart3,
      to: '/analyses',
    },
    {
      title: 'Configurações',
      desc: 'Configure o sistema',
      icon: SettingsIcon,
      to: '/settings',
    },
  ];

  const renderKpi = (
    item: { title: string; value: string | number; hint: string; icon: any },
    key: string,
  ) => {
    const Icon = item.icon;
    return (
      <Card key={key}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {item.title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{item.value}</div>
          <p className="text-xs text-muted-foreground mt-1">{item.hint}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, visualize estatísticas e configure o sistema.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {kpiRow1.map((k, i) => renderKpi(k, `r1-${i}`))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {kpiRow2.map((k, i) => renderKpi(k, `r2-${i}`))}
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Análises por Dia (Últimos 7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analysisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="analises" fill="hsl(250, 60%, 55%)" name="Total" />
                <Bar dataKey="sucesso" fill="hsl(142, 76%, 36%)" name="Sucesso" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 mb-8">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title} className="flex flex-col">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{s.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                <Button asChild variant="secondary" size="sm" className="self-start rounded-full">
                  <Link to={s.to}>
                    Acessar <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimos usuários cadastrados no sistema
          </p>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
          ) : (
            <div className="divide-y divide-border">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-sm text-primary">{u.email}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

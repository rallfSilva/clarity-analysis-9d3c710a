import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const kpis = [
    {
      title: 'Total de Análises',
      value: '0',
      icon: FileCheck,
      description: 'Últimos 30 dias',
      color: 'text-primary'
    },
    {
      title: 'Conformidade Média',
      value: '0%',
      icon: TrendingUp,
      description: 'Taxa de conformidade',
      color: 'text-accent'
    },
    {
      title: 'Em Processamento',
      value: '0',
      icon: Clock,
      description: 'Análises pendentes',
      color: 'text-muted-foreground'
    },
    {
      title: 'Não Conformidades',
      value: '0',
      icon: AlertCircle,
      description: 'Itens identificados',
      color: 'text-destructive'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo ao sistema de análise de conformidade
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card
              key={kpi.title}
              className="transition-all hover:shadow-[var(--shadow-card)] hover:scale-105 duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análises Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p>Nenhuma análise realizada ainda. Faça upload do primeiro documento!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
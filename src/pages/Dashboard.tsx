import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData, type Period } from '@/hooks/useDashboardData';
import { StatCards } from '@/components/dashboard/StatCards';
import { ComplianceChart } from '@/components/dashboard/ComplianceChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { RecentAnalyses } from '@/components/dashboard/RecentAnalyses';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>(30);
  const { data, isLoading } = useDashboardData(period);

  const name =
    (user?.user_metadata?.name as string)?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'Gestor';

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Olá, {name} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral das análises de conformidade no SIAC.
        </p>
      </div>

      <StatCards
        total={data.kpis.total}
        conformidadeMedia={data.kpis.conformidadeMedia}
        emProcessamento={data.kpis.emProcessamento}
        naoConformidades={data.kpis.naoConformidades}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ComplianceChart data={data.compliance} period={period} onPeriodChange={setPeriod} />
        <StatusChart data={data.statusDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DepartmentChart />
        <RecentAnalyses items={data.recent as any} />
      </div>

      <div className="text-center text-xs text-muted-foreground py-4 border-t border-border/60">
        Sistema integrado de análise de Conformidades<br />
        SIAC © 2026
      </div>
    </div>
  );
};

export default Dashboard;

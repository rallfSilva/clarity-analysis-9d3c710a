import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

interface DepartmentChartProps {
  data: { secretaria: string; quantidade: number }[];
  period: number;
}

export function DepartmentChart({ data, period }: DepartmentChartProps) {
  const navigate = useNavigate();

  const handleBarClick = (entry: { secretaria?: string }) => {
    if (!entry?.secretaria) return;
    navigate(
      `/reports?tab=secretaria&secretaria=${encodeURIComponent(entry.secretaria)}`,
    );
  };

  return (
    <Card className="p-6 rounded-2xl shadow-card border-border/60">
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Demandas por Secretaria</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quantidade de análises por secretaria (Últimos {period} dias) · clique numa barra para ver o relatório
          </p>
        </div>
        <Link
          to="/reports?tab=secretaria"
          className="text-xs font-medium text-primary hover:underline whitespace-nowrap inline-flex items-center gap-1"
        >
          Ver todas
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {data.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
          Sem análises no período.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
            <XAxis dataKey="secretaria" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 91%)', borderRadius: 12, fontSize: 12 }} />
            <Bar
              dataKey="quantidade"
              fill="hsl(224, 76%, 48%)"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
              cursor="pointer"
              onClick={handleBarClick}
            >
              <LabelList dataKey="quantidade" position="top" style={{ fontSize: 11, fill: 'hsl(220, 39%, 11%)', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

import { Card } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StatusChartProps {
  data: { name: string; value: number; color: string }[];
}

export function StatusChart({ data }: StatusChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <Card className="p-6 rounded-2xl shadow-card border-border/60">
      <h3 className="font-semibold text-foreground mb-4">Distribuição de Status</h3>
      <div className="flex items-center gap-6">
        <div className="w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 91%)', borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          {data.map((d) => {
            const pct = ((d.value / total) * 100).toFixed(0);
            return (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-foreground">{d.name}</span>
                </div>
                <span className="text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{d.value}</span> ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';

const MOCK = [
  { secretaria: 'SETRABES', quantidade: 38 },
  { secretaria: 'SEJUC', quantidade: 26 },
  { secretaria: 'FESP/SESP', quantidade: 21 },
  { secretaria: 'SEADI', quantidade: 18 },
  { secretaria: 'SEPI', quantidade: 15 },
  { secretaria: 'SECULT', quantidade: 12 },
  { secretaria: 'PM', quantidade: 8 },
  { secretaria: 'CBM', quantidade: 4 },
];

export function DepartmentChart() {
  return (
    <Card className="p-6 rounded-2xl shadow-card border-border/60">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-foreground">Demandas por Secretaria</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Quantidade de análises por secretaria (Últimos 30 dias)</p>
        </div>
        <Select defaultValue="30">
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={MOCK} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
          <XAxis dataKey="secretaria" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 91%)', borderRadius: 12, fontSize: 12 }} />
          <Bar dataKey="quantidade" fill="hsl(224, 76%, 48%)" radius={[6, 6, 0, 0]} maxBarSize={36}>
            <LabelList dataKey="quantidade" position="top" style={{ fontSize: 11, fill: 'hsl(220, 39%, 11%)', fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

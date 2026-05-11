import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { Period } from '@/hooks/useDashboardData';

interface ComplianceChartProps {
  data: { label: string; valor: number }[];
  period: Period;
  onPeriodChange: (p: Period) => void;
}

export function ComplianceChart({ data, period, onPeriodChange }: ComplianceChartProps) {
  return (
    <Card className="p-6 rounded-2xl shadow-card border-border/60">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-foreground">Resumo de Conformidade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Índice de conformidade (%)</p>
        </div>
        <Select value={String(period)} onValueChange={(v) => onPeriodChange(Number(v) as Period)}>
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
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCompliance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(220, 9%, 46%)' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 13% 91%)', borderRadius: 12, fontSize: 12 }}
            formatter={(v: number) => [`${v}%`, 'Conformidade']}
          />
          <Area type="monotone" dataKey="valor" stroke="hsl(224, 76%, 48%)" strokeWidth={2.5} fill="url(#colorCompliance)" dot={{ r: 3, fill: 'hsl(224, 76%, 48%)' }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

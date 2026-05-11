import { motion } from 'framer-motion';
import { FileText, BadgeCheck, Clock3, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardsProps {
  total: number;
  conformidadeMedia: number;
  emProcessamento: number;
  naoConformidades: number;
}

export function StatCards({ total, conformidadeMedia, emProcessamento, naoConformidades }: StatCardsProps) {
  const cards = [
    {
      title: 'Total de Análises',
      value: String(total),
      description: 'Últimos 30 dias',
      icon: FileText,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Conformidade Média',
      value: `${conformidadeMedia.toFixed(1)}%`,
      description: 'Das análises concluídas',
      icon: BadgeCheck,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      trend: '+8.3%',
      trendUp: true,
    },
    {
      title: 'Em Processamento',
      value: String(emProcessamento),
      description: 'Análises pendentes',
      icon: Clock3,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      trend: `+${emProcessamento}`,
      trendUp: true,
    },
    {
      title: 'Não Conformidades',
      value: String(naoConformidades),
      description: 'Itens identificados',
      icon: AlertTriangle,
      iconBg: 'bg-danger/10',
      iconColor: 'text-danger',
      trend: '-5%',
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((c, i) => {
        const Icon = c.icon;
        const TrendIcon = c.trendUp ? TrendingUp : TrendingDown;
        const trendColor = c.trendUp ? 'text-success' : 'text-danger';
        return (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
          >
            <Card className="p-5 rounded-2xl shadow-card border-border/60 hover:shadow-elegant transition-all">
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${c.iconBg}`}>
                  <Icon className={`h-6 w-6 ${c.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">{c.title}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{c.value}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
                      <TrendIcon className="h-3 w-3" />
                      {c.trend}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

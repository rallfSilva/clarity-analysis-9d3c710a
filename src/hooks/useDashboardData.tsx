import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export type Period = 7 | 30 | 90;

export function useDashboardData(period: Period = 30) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();

  return useQuery({
    queryKey: ['dashboard', user?.id, isAdmin, period],
    queryFn: async () => {
      let query = supabase.from('analyses').select('*');
      if (!isAdmin) query = query.eq('user_id', user!.id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const all = data || [];
      const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
      const periodItems = all.filter((a) => new Date(a.created_at) >= since);

      const concluidas = all.filter((a) => a.status === 'success');
      const emAndamento = all.filter((a) => a.status === 'processing');
      const pendentes = all.filter((a) => a.status === 'pending');
      const naoConformes = all.filter((a) => a.status === 'failed');

      const conformidades = concluidas
        .map((a) => Number(a.conformidade_percentual))
        .filter((n) => !isNaN(n));
      const conformidadeMedia = conformidades.length
        ? conformidades.reduce((s, n) => s + n, 0) / conformidades.length
        : 0;

      // Time series — average compliance per day in period
      const days: { date: string; label: string; valor: number }[] = [];
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const dayItems = concluidas.filter((a) => a.created_at.split('T')[0] === key);
        const vals = dayItems
          .map((a) => Number(a.conformidade_percentual))
          .filter((n) => !isNaN(n));
        const avg = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : 0;
        days.push({
          date: key,
          label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          valor: Math.round(avg * 10) / 10,
        });
      }

      return {
        kpis: {
          total: periodItems.length,
          totalAll: all.length,
          conformidadeMedia,
          emProcessamento: emAndamento.length + pendentes.length,
          naoConformidades: naoConformes.length,
        },
        statusDistribution: [
          { name: 'Concluídas', value: concluidas.length, color: 'hsl(142, 71%, 45%)' },
          { name: 'Em Andamento', value: emAndamento.length, color: 'hsl(224, 76%, 48%)' },
          { name: 'Pendentes', value: pendentes.length, color: 'hsl(38, 92%, 50%)' },
          { name: 'Não Conformes', value: naoConformes.length, color: 'hsl(0, 84%, 60%)' },
        ],
        compliance: days,
        recent: all.slice(0, 4),
      };
    },
    enabled: !!user,
  });
}

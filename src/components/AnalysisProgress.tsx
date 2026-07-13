import { CheckCircle2, Loader2, Circle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export type AnalysisStep = 0 | 1 | 2 | 3 | 4;

export const ANALYSIS_STEPS = [
  'Enviando arquivo',
  'Registrando análise',
  'Notificando processador',
  'Aguardando análise da IA',
  'Concluído',
] as const;

interface AnalysisProgressProps {
  step: AnalysisStep;
  error?: boolean;
  label?: string;
  className?: string;
}

export function AnalysisProgress({ step, error, label, className }: AnalysisProgressProps) {
  const percent = error ? 100 : Math.min(100, (step / 4) * 100);
  const current = ANALYSIS_STEPS[step] ?? ANALYSIS_STEPS[0];

  return (
    <div className={cn('space-y-3 rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {label ?? (error ? 'Erro no processamento' : current)}
        </span>
        <span className="text-muted-foreground">{Math.round(percent)}%</span>
      </div>
      <Progress
        value={percent}
        className={cn('h-2', error && '[&>div]:bg-destructive')}
      />
      <ol className="grid gap-1.5 text-xs sm:grid-cols-2 lg:grid-cols-4">
        {ANALYSIS_STEPS.slice(0, 4).map((s, i) => {
          const done = i < step;
          const active = i === step && !error;
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-2',
                done && 'text-primary',
                active && 'text-foreground font-medium',
                !done && !active && 'text-muted-foreground'
              )}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : active ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              <span>{s}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

import { getAllDocumentTypes } from '@/lib/documentTypes';
import type { ProcessGroup } from './groupAnalysesByProcess';

export type HealthLevel = 'green' | 'yellow' | 'red';

export interface HealthCriterion {
  label: string;
  value: string;
  met: boolean;
}

export interface ProcessHealth {
  level: HealthLevel;
  label: string;
  summary: string;
  criteria: HealthCriterion[];
}

export function computeProcessHealth(group: ProcessGroup): ProcessHealth {
  const errorCount = group.all.filter((a) => a.status === 'error').length;
  const hasError = errorCount > 0;
  const successCount = group.success.length;
  const allTypeIds = getAllDocumentTypes().map((t) => t.id);
  const typesWithSuccess = new Set(group.success.map((a) => a.tipo_documento));
  const isComplete = allTypeIds.every((id) => typesWithSuccess.has(id));

  const avg =
    successCount > 0
      ? group.success.reduce((s, a) => s + (a.conformidade_percentual || 0), 0) /
        successCount
      : 0;

  const criteria: HealthCriterion[] = [
    {
      label: 'Conformidade média ≥ 85%',
      value: successCount > 0 ? `${avg.toFixed(1)}%` : 'sem análises concluídas',
      met: successCount > 0 && avg >= 85,
    },
    {
      label: `Todos os ${allTypeIds.length} tipos analisados`,
      value: `${typesWithSuccess.size}/${allTypeIds.length}`,
      met: isComplete,
    },
    {
      label: 'Sem análises com erro',
      value: errorCount === 0 ? 'nenhum erro' : `${errorCount} erro(s)`,
      met: !hasError,
    },
  ];

  if (hasError) {
    return {
      level: 'red',
      label: 'Crítico',
      summary: 'Há análises com erro neste processo',
      criteria,
    };
  }
  if (successCount > 0 && avg < 70) {
    return {
      level: 'red',
      label: 'Crítico',
      summary: `Conformidade média ${avg.toFixed(1)}% abaixo de 70%`,
      criteria,
    };
  }
  if (successCount === 0) {
    return {
      level: 'yellow',
      label: 'Aguardando',
      summary: 'Nenhuma análise concluída ainda',
      criteria,
    };
  }
  if (avg >= 85 && isComplete) {
    return {
      level: 'green',
      label: 'Saudável',
      summary: `Conformidade ${avg.toFixed(1)}% e todos os tipos concluídos`,
      criteria,
    };
  }
  return {
    level: 'yellow',
    label: 'Atenção',
    summary: isComplete
      ? `Conformidade ${avg.toFixed(1)}% — abaixo da meta de 85%`
      : `Faltam ${allTypeIds.length - typesWithSuccess.size} tipo(s) de documento`,
    criteria,
  };
}

export function relativeTimeFromNow(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diffMs = now.getTime() - then;
  if (diffMs < 0) return 'agora';
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'há 1 dia';
  if (diffD < 30) return `há ${diffD} dias`;
  const diffMo = Math.floor(diffD / 30);
  if (diffMo === 1) return 'há 1 mês';
  if (diffMo < 12) return `há ${diffMo} meses`;
  const diffY = Math.floor(diffMo / 12);
  return diffY === 1 ? 'há 1 ano' : `há ${diffY} anos`;
}

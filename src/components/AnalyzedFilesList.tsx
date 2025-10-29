import { Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAnalysesByType } from '@/hooks/useAnalysesByType';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyzedFilesListProps {
  tipo: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Processando', variant: 'secondary' as const },
  processing: { label: 'Em Análise', variant: 'secondary' as const },
  success: { label: 'Concluída', variant: 'default' as const },
  error: { label: 'Erro', variant: 'destructive' as const },
};

export function AnalyzedFilesList({ tipo }: AnalyzedFilesListProps) {
  const { data: analyses, isLoading } = useAnalysesByType(tipo);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma análise encontrada para este tipo de documento</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Análises Recentes</h3>
      <div className="space-y-3">
        {analyses.map((analysis) => {
          const statusConfig = STATUS_CONFIG[analysis.status as keyof typeof STATUS_CONFIG];
          const fileName = analysis.arquivo_url.split('/').pop() || 'Arquivo';
          const conformidade = analysis.conformidade_percentual || 0;

          return (
            <div
              key={analysis.id}
              className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <p className="font-medium text-foreground truncate">
                      {analysis.processo}
                    </p>
                    <Badge variant={statusConfig.variant}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {analysis.status === 'success' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Conformidade</span>
                        <span className="font-medium text-foreground">
                          {conformidade.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={conformidade} className="h-2" />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(analysis.created_at), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>

                {analysis.status === 'success' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => {
                      // TODO: Implementar download do relatório PDF
                      console.log('Download análise:', analysis.id);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

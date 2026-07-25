import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getDocumentTypeById } from '@/lib/documentTypes';
import { IsolatedHtmlReport } from './IsolatedHtmlReport';
import type { ProcessGroup, Analysis } from '@/lib/reports/groupAnalysesByProcess';

interface ConsolidatedSectionsProps {
  group: ProcessGroup;
}

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('pt-BR') : '—';
}

function sectionsOrdered(group: ProcessGroup): Analysis[] {
  return [...group.success].sort((a, b) => {
    const tipoCmp = a.tipo_documento.localeCompare(b.tipo_documento);
    if (tipoCmp !== 0) return tipoCmp;
    return b.created_at > a.created_at ? 1 : -1;
  });
}

export function ConsolidatedSections({ group }: ConsolidatedSectionsProps) {
  const ordered = sectionsOrdered(group);

  if (ordered.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nenhuma análise concluída ainda para este processo.
        </AlertDescription>
      </Alert>
    );
  }

  const seenTypes = new Set<string>();
  return (
    <div className="space-y-6">
      {ordered.map((a) => {
        const docType = getDocumentTypeById(a.tipo_documento);
        const title = docType?.name || a.tipo_documento;
        const isFirstOfType = !seenTypes.has(a.tipo_documento);
        seenTypes.add(a.tipo_documento);
        return (
          <Card
            key={a.id}
            id={isFirstOfType ? `secao-${a.tipo_documento}` : undefined}
            className="consolidated-section scroll-mt-20"
          >
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>{title}</CardTitle>
                <div className="text-xs text-muted-foreground mt-1">
                  Análise de {fmtDate(a.completed_at || a.created_at)}
                </div>
              </div>
              {a.conformidade_percentual !== null && (
                <Badge variant="secondary">
                  conformidade {a.conformidade_percentual.toFixed(1)}%
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {a.relatorio_html ? (
                <IsolatedHtmlReport html={a.relatorio_html} />
              ) : a.relatorio_texto ? (
                <pre className="whitespace-pre-wrap text-sm">{a.relatorio_texto}</pre>
              ) : (
                <Badge variant="outline">Conteúdo indisponível</Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

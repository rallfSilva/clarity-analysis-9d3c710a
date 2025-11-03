import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function AnaliseRisco() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - Análise de Risco
        </h1>
        <p className="text-muted-foreground">
          Envie sua Análise de Risco da Contratação para análise de conformidade
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES['Análise de Risco']}
        titulo={DOCUMENT_DESCRIPTIONS['Análise de Risco'].titulo}
        descricao={DOCUMENT_DESCRIPTIONS['Análise de Risco'].descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS['Análise de Risco'].checklistItems}
      />
    </div>
  );
}

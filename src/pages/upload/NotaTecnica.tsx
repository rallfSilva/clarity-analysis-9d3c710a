import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function NotaTecnica() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - Nota Técnica
        </h1>
        <p className="text-muted-foreground">
          Envie sua Nota Técnica de Cotação de Preços para análise de conformidades
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES['Nota Técnica']}
        titulo={DOCUMENT_DESCRIPTIONS['Nota Técnica'].titulo}
        descricao={DOCUMENT_DESCRIPTIONS['Nota Técnica'].descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS['Nota Técnica'].checklistItems}
      />
    </div>
  );
}

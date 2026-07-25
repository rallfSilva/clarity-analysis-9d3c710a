import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function ETP() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - ETP
        </h1>
        <p className="text-muted-foreground">
          Envie seu Estudo Técnico Preliminar para análise de conformidades
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES.ETP}
        titulo={DOCUMENT_DESCRIPTIONS.ETP.titulo}
        descricao={DOCUMENT_DESCRIPTIONS.ETP.descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS.ETP.checklistItems}
      />
    </div>
  );
}

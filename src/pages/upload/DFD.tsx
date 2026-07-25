import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function DFD() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - DFD
        </h1>
        <p className="text-muted-foreground">
          Envie seu Documento de Formalização de Demanda para análise de conformidades
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES.DFD}
        titulo={DOCUMENT_DESCRIPTIONS.DFD.titulo}
        descricao={DOCUMENT_DESCRIPTIONS.DFD.descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS.DFD.checklistItems}
      />
    </div>
  );
}

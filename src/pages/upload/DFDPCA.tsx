import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function DFDPCA() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - DFD do PCA
        </h1>
        <p className="text-muted-foreground">
          Envie o Documento de Formalização de Demanda do PCA para análise de conformidades
          conforme o Decreto nº 39.050-E/2025 e o Decreto nº 36.203-E/2024
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES['DFD do PCA']}
        titulo={DOCUMENT_DESCRIPTIONS['DFD do PCA'].titulo}
        descricao={DOCUMENT_DESCRIPTIONS['DFD do PCA'].descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS['DFD do PCA'].checklistItems}
      />
    </div>
  );
}

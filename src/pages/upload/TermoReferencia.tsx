import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function TermoReferencia() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Nova Análise - Termo de Referência
        </h1>
        <p className="text-muted-foreground">
          Envie seu Termo de Referência para análise de conformidade
        </p>
      </div>

      <DocumentUploadSection
        tipo={DOCUMENT_TYPES['Termo de Referência']}
        titulo={DOCUMENT_DESCRIPTIONS['Termo de Referência'].titulo}
        descricao={DOCUMENT_DESCRIPTIONS['Termo de Referência'].descricao}
        checklistItems={DOCUMENT_DESCRIPTIONS['Termo de Referência'].checklistItems}
      />
    </div>
  );
}

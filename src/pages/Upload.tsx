import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUploadSection } from '@/components/DocumentUploadSection';
import { DOCUMENT_DESCRIPTIONS, DOCUMENT_TYPES } from '@/lib/documentContent';

export default function Upload() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Nova Análise</h1>
        <p className="text-muted-foreground">
          Selecione o tipo de documento para iniciar a análise de conformidade
        </p>
      </div>

      <Tabs defaultValue="DFD" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto gap-2 bg-transparent">
          <TabsTrigger value="DFD" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            DFD
          </TabsTrigger>
          <TabsTrigger value="ETP" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            ETP
          </TabsTrigger>
          <TabsTrigger value="Nota Técnica" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Nota Técnica
          </TabsTrigger>
          <TabsTrigger value="Análise de Risco" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Análise de Risco
          </TabsTrigger>
          <TabsTrigger value="Termo de Referência" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Termo de Referência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="DFD" className="mt-6">
          <DocumentUploadSection
            tipo={DOCUMENT_TYPES.DFD}
            titulo={DOCUMENT_DESCRIPTIONS.DFD.titulo}
            descricao={DOCUMENT_DESCRIPTIONS.DFD.descricao}
            checklistItems={DOCUMENT_DESCRIPTIONS.DFD.checklistItems}
          />
        </TabsContent>

        <TabsContent value="ETP" className="mt-6">
          <DocumentUploadSection
            tipo={DOCUMENT_TYPES.ETP}
            titulo={DOCUMENT_DESCRIPTIONS.ETP.titulo}
            descricao={DOCUMENT_DESCRIPTIONS.ETP.descricao}
            checklistItems={DOCUMENT_DESCRIPTIONS.ETP.checklistItems}
          />
        </TabsContent>

        <TabsContent value="Nota Técnica" className="mt-6">
          <DocumentUploadSection
            tipo={DOCUMENT_TYPES['Nota Técnica']}
            titulo={DOCUMENT_DESCRIPTIONS['Nota Técnica'].titulo}
            descricao={DOCUMENT_DESCRIPTIONS['Nota Técnica'].descricao}
            checklistItems={DOCUMENT_DESCRIPTIONS['Nota Técnica'].checklistItems}
          />
        </TabsContent>

        <TabsContent value="Análise de Risco" className="mt-6">
          <DocumentUploadSection
            tipo={DOCUMENT_TYPES['Análise de Risco']}
            titulo={DOCUMENT_DESCRIPTIONS['Análise de Risco'].titulo}
            descricao={DOCUMENT_DESCRIPTIONS['Análise de Risco'].descricao}
            checklistItems={DOCUMENT_DESCRIPTIONS['Análise de Risco'].checklistItems}
          />
        </TabsContent>

        <TabsContent value="Termo de Referência" className="mt-6">
          <DocumentUploadSection
            tipo={DOCUMENT_TYPES['Termo de Referência']}
            titulo={DOCUMENT_DESCRIPTIONS['Termo de Referência'].titulo}
            descricao={DOCUMENT_DESCRIPTIONS['Termo de Referência'].descricao}
            checklistItems={DOCUMENT_DESCRIPTIONS['Termo de Referência'].checklistItems}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
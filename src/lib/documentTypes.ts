export interface DocumentType {
  id: string;
  name: string;
  shortName: string;
  description: string;
  fullDescription: string;
  checklist: string[];
  route: string;
}

export const DOCUMENT_TYPES: Record<string, DocumentType> = {
  dfd: {
    id: 'dfd',
    name: 'Documento de Formalização de Demanda',
    shortName: 'DFD',
    description: 'Formaliza a necessidade da contratação e inicia o planejamento.',
    fullDescription: 'O DFD é o documento que formaliza a necessidade da contratação e inicia o processo de planejamento. Este checklist verifica se o documento contém todos os elementos obrigatórios conforme a IN SEGES/MP nº 01/2019, incluindo: justificativa da necessidade, descrição da solução, estimativa de custos e indicação de disponibilidade orçamentária.',
    checklist: [
      'Identificação da necessidade',
      'Descrição da solução pretendida',
      'Estimativa de custos',
      'Previsão de impacto econômico',
      'Disponibilidade orçamentária',
    ],
    route: '/upload/dfd',
  },
  etp: {
    id: 'etp',
    name: 'Estudo Técnico Preliminar',
    shortName: 'ETP',
    description: 'Fundamenta tecnicamente a contratação.',
    fullDescription: 'O ETP é o documento que fundamenta tecnicamente a contratação. Este checklist avalia se o estudo apresenta análise de viabilidade, requisitos técnicos, riscos, estimativa de preços e prazo de execução conforme exigido pela legislação vigente.',
    checklist: [
      'Análise de viabilidade da contratação',
      'Descrição dos requisitos técnicos',
      'Estimativa de preços e prazos',
      'Análise de riscos',
      'Justificativa do objeto e escopo',
    ],
    route: '/upload/etp',
  },
  'nota-tecnica': {
    id: 'nota-tecnica',
    name: 'Nota Técnica de Cotação de Preços',
    shortName: 'Nota Técnica',
    description: 'Documenta pesquisa de mercado e análise de preços.',
    fullDescription: 'A Nota Técnica documenta a pesquisa de mercado e a análise de preços para subsidiar a contratação. Este checklist verifica se foram realizadas cotações com no mínimo 3 fornecedores, apresentação de justificativa para o preço adotado e conformidade com os valores de referência.',
    checklist: [
      'Cotação de no mínimo 3 fornecedores',
      'Metodologia de pesquisa de preços',
      'Justificativa do preço de referência',
      'Análise de adequação orçamentária',
      'Comparação com contratações similares',
    ],
    route: '/upload/nota-tecnica',
  },
  'analise-risco': {
    id: 'analise-risco',
    name: 'Análise de Risco da Contratação',
    shortName: 'Análise de Risco',
    description: 'Identifica e avalia riscos da contratação.',
    fullDescription: 'O documento de Análise de Risco identifica e avalia os riscos associados à contratação. Este checklist verifica se foram identificados riscos técnicos, operacionais, financeiros e se há plano de mitigação adequado para cada risco mapeado.',
    checklist: [
      'Identificação de riscos (técnicos, operacionais, financeiros)',
      'Classificação de probabilidade e impacto',
      'Plano de mitigação de riscos',
      'Responsáveis pela gestão de riscos',
      'Monitoramento e revisão periódica',
    ],
    route: '/upload/analise-risco',
  },
  'termo-referencia': {
    id: 'termo-referencia',
    name: 'Termo de Referência',
    shortName: 'Termo de Referência',
    description: 'Detalha o objeto da contratação.',
    fullDescription: 'O Termo de Referência é o documento que detalha o objeto da contratação, incluindo especificações técnicas, critérios de aceitação e obrigações das partes. Este checklist verifica a conformidade com os requisitos legais e a completude das informações.',
    checklist: [
      'Descrição detalhada do objeto',
      'Justificativa da contratação',
      'Especificações técnicas completas',
      'Critérios de aceitação',
      'Obrigações do contratante e contratado',
      'Prazo de execução e vigência',
      'Forma de pagamento',
    ],
    route: '/upload/termo-referencia',
  },
};

export function getDocumentTypeById(id: string): DocumentType | undefined {
  return DOCUMENT_TYPES[id];
}

export function getAllDocumentTypes(): DocumentType[] {
  return Object.values(DOCUMENT_TYPES);
}

export const DOCUMENT_TYPES = {
  DFD: 'DFD',
  ETP: 'ETP',
  'Nota Técnica': 'Nota Técnica',
  'Análise de Risco': 'Análise de Risco',
  'Termo de Referência': 'Termo de Referência',
} as const;

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_DESCRIPTIONS = {
  DFD: {
    titulo: "Documento de Formalização de Demanda (DFD)",
    descricao: `O DFD é o documento que formaliza a necessidade da contratação e inicia o processo de planejamento. Este checklist verifica se o documento contém todos os elementos obrigatórios conforme a IN SEGES/MP nº 01/2019, incluindo: justificativa da necessidade, descrição da solução, estimativa de custos e indicação de disponibilidade orçamentária.`,
    checklistItems: [
      "Identificação da necessidade",
      "Descrição da solução pretendida",
      "Estimativa de custos",
      "Previsão de impacto econômico",
      "Disponibilidade orçamentária"
    ]
  },
  ETP: {
    titulo: "Estudo Técnico Preliminar (ETP)",
    descricao: `O ETP é o documento que fundamenta tecnicamente a contratação. Este checklist avalia se o estudo apresenta análise de viabilidade, requisitos técnicos, riscos, estimativa de preços e prazo de execução conforme exigido pela legislação vigente.`,
    checklistItems: [
      "Análise de viabilidade da contratação",
      "Descrição dos requisitos técnicos",
      "Estimativa de preços e prazos",
      "Análise de riscos",
      "Justificativa do objeto e escopo"
    ]
  },
  "Nota Técnica": {
    titulo: "Nota Técnica de Cotação de Preços",
    descricao: `A Nota Técnica documenta a pesquisa de mercado e a análise de preços para subsidiar a contratação. Este checklist verifica se foram realizadas cotações com no mínimo 3 fornecedores, apresentação de justificativa para o preço adotado e conformidade com os valores de referência.`,
    checklistItems: [
      "Cotação de no mínimo 3 fornecedores",
      "Metodologia de pesquisa de preços",
      "Justificativa do preço de referência",
      "Análise de adequação orçamentária",
      "Comparação com contratações similares"
    ]
  },
  "Análise de Risco": {
    titulo: "Análise de Risco da Contratação",
    descricao: `O documento de Análise de Risco identifica e avalia os riscos associados à contratação. Este checklist verifica se foram identificados riscos técnicos, operacionais, financeiros e se há plano de mitigação adequado para cada risco mapeado.`,
    checklistItems: [
      "Identificação de riscos (técnicos, operacionais, financeiros)",
      "Classificação de probabilidade e impacto",
      "Plano de mitigação de riscos",
      "Responsáveis pela gestão de riscos",
      "Monitoramento e revisão periódica"
    ]
  },
  "Termo de Referência": {
    titulo: "Termo de Referência (TR)",
    descricao: `O Termo de Referência é o documento que detalha o objeto da contratação. Este checklist avalia se o TR apresenta descrição clara do objeto, justificativa, especificações técnicas, critérios de aceitação, obrigações das partes e demais elementos obrigatórios.`,
    checklistItems: [
      "Descrição detalhada do objeto",
      "Justificativa da contratação",
      "Especificações técnicas completas",
      "Critérios de aceitação",
      "Obrigações do contratante e contratado",
      "Prazo de execução e vigência",
      "Forma de pagamento"
    ]
  }
} as const;

export const FUNDAMENTACAO_JURIDICA = {
  titulo: "Fundamentação Jurídica",
  items: [
    "Lei n° 14.133, 1° de abril de 2021, Lei de Licitações e Contratos Administrativos.",
    "Decreto nº 39.050-E de 18 de agosto de 2025 - Nas contratações no âmbito da Administração Pública Estadual Direta, Autárquica e Fundacional do Estado de Roraima.",
    "INSTRUÇÃO NORMATIVA SEGES/ME Nº 81, DE 25 DE NOVEMBRO DE 2022, INSTRUÇÃO NORMATIVA SEGES Nº 58, DE 8 DE AGOSTO DE 2022 e INSTRUÇÃO NORMATIVA SEGES/ME Nº 65, DE 7 DE JULHO DE 2021"
  ],
  srp: {
    titulo: "Fundamentação da adoção do SRP",
    items: [
      "Decreto n° 11.462, de 31 de março de 2023 - No caso de contratações provenientes de recursos da União decorrentes de transferências voluntárias.",
      "Decreto nº 37.424-E, de 19 de março de 2025 - Nas contratações no âmbito da Administração Pública Estadual Direta, Autárquica e Fundacional do Poder Executivo do Estado de Roraima."
    ]
  }
} as const;

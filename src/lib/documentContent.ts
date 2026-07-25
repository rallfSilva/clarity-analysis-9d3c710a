// Os valores são os SLUGS gravados em analyses.tipo_documento — mesmo formato
// usado pelo banco, pelo n8n e pelos relatórios (getDocumentTypeById). As chaves
// (nomes de exibição) continuam sendo usadas para indexar DOCUMENT_DESCRIPTIONS.
export const DOCUMENT_TYPES = {
  DFD: 'dfd',
  'DFD do PCA': 'dfd-pca',
  ETP: 'etp',
  'Nota Técnica': 'nota-tecnica',
  'Análise de Risco': 'analise-risco',
  'Termo de Referência': 'termo-referencia',
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
  "DFD do PCA": {
    titulo: "Documento de Formalização de Demanda do PCA (DFD do PCA)",
    descricao: `O DFD do PCA formaliza a demanda no âmbito do Plano de Contratações Anual (PCA), conforme o Decreto nº 39.050-E/2025 e o Decreto nº 36.203-E/2024. Este checklist verifica os requisitos obrigatórios previstos no art. 5º, §1º do Decreto nº 39.050-E/2025 e no art. 6º do Decreto nº 36.203-E/2024, incluindo justificativa, descrição sucinta, quantidade estimada, valor estimado, data pretendida, grau de prioridade, correlação com outros DFDs e identificação da área requisitante, além da validação das assinaturas eletrônicas.`,
    checklistItems: [
      "Justificativa da necessidade da contratação",
      "Descrição sucinta da demanda",
      "Quantidade estimada (expectativa de consumo anual)",
      "Estimativa preliminar do valor da contratação",
      "Data pretendida para a conclusão da contratação",
      "Grau de prioridade (baixo, médio ou alto)",
      "Correlação ou interdependência com outros DFDs",
      "Identificação da área requisitante e do responsável",
      "Assinaturas eletrônicas válidas (nome + data)"
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

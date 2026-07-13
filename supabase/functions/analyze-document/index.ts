import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Checklist específico para ETP baseado na Lei 14.133/2021
const ETP_CHECKLIST = [
  { codigo: 'ETP-01', descricao: 'Descrição da necessidade da contratação, considerado o problema a ser resolvido sob a perspectiva do interesse público' },
  { codigo: 'ETP-02', descricao: 'Área requisitante, quantidade de servidores/empregados, prazo estimado e natureza do serviço' },
  { codigo: 'ETP-03', descricao: 'Previsão orçamentária, com indicação das rubricas e disponibilidade de recursos' },
  { codigo: 'ETP-04', descricao: 'Descrição dos requisitos da contratação necessários e suficientes à escolha da solução' },
  { codigo: 'ETP-05', descricao: 'Levantamento de mercado e justificativa da escolha do tipo de solução a contratar' },
  { codigo: 'ETP-06', descricao: 'Estimativa das quantidades a serem contratadas, acompanhada das memórias de cálculo e documentos que lhe dão suporte' },
  { codigo: 'ETP-07', descricao: 'Estimativa do valor da contratação, acompanhada dos preços unitários referenciais e memórias de cálculo' },
  { codigo: 'ETP-08', descricao: 'Justificativa técnica e econômica da escolha do tipo de solução' },
  { codigo: 'ETP-09', descricao: 'Descrição da solução como um todo, inclusive das exigências relacionadas à manutenção e assistência técnica' },
  { codigo: 'ETP-10', descricao: 'Demonstrativo da viabilidade técnica e econômica da contratação' },
  { codigo: 'ETP-11', descricao: 'Providências a serem adotadas para adequação do ambiente organizacional' },
  { codigo: 'ETP-12', descricao: 'Matriz de riscos, quando necessária' },
  { codigo: 'ETP-13', descricao: 'Justificativa para o parcelamento ou não da contratação' },
];

// Prompt específico para análise de ETP
const ETP_SYSTEM_PROMPT = `Você atuará como um analista técnico especializado em licitações públicas sob a Lei nº 14.133/2021.

Sua tarefa é realizar uma análise técnica completa e fundamentada sobre o Estudo Técnico Preliminar (ETP), avaliando todos os itens aplicáveis do checklist.

INSTRUÇÕES ESPECÍFICAS:
• Classifique cada item como:
  - ATENDE (✔️): Item completamente atendido
  - ATENDE_PARCIALMENTE (⚠️): Item parcialmente atendido, com ressalvas
  - NAO_ATENDE (❌): Item não atendido ou ausente
  - NAO_SE_APLICA (🛑): Item não aplicável ao caso concreto

• Fundamente tecnicamente CADA resposta com base no conteúdo do ETP
• Aponte em qual seção ou página do ETP o item foi atendido ou negligenciado
• Seja específico nas observações, citando trechos do documento quando possível

IMPORTANTE: Sua análise deve ser objetiva, técnica e fundamentada na legislação vigente (Lei nº 14.133/2021, Decreto nº 39.050-E/2025 e INs aplicáveis).`;

const ETP_USER_PROMPT = (processo: string, checklistText: string) => `
Analise o Estudo Técnico Preliminar (ETP) anexo referente ao processo "${processo}" com base nos itens do checklist da Lei 14.133/2021.

CHECKLIST DE VERIFICAÇÃO:
${checklistText}

FORMATO DE RESPOSTA:
Para cada item do checklist, forneça:
1. Código do item
2. Classificação de conformidade (ATENDE, ATENDE_PARCIALMENTE, NAO_ATENDE, NAO_SE_APLICA)
3. Observações detalhadas com fundamentação técnica e referência à seção/página do ETP

Ao final, forneça uma CONCLUSÃO TÉCNICA DO ETP contendo:
- Diagnóstico resumido sobre a adequação do ETP
- Pontos fortes identificados no documento
- Ausências críticas ou itens que necessitam correção
- Parecer final sobre se o ETP é suficiente para subsidiar a contratação pública pretendida
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { analysis_id } = await req.json();
    
    if (!analysis_id) {
      throw new Error('analysis_id é obrigatório');
    }

    // Get analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysis_id)
      .single();

    if (fetchError || !analysis) {
      throw new Error('Análise não encontrada');
    }

    // Fetch analyst profile for traceability
    const { data: analystProfile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', analysis.user_id)
      .maybeSingle();
    const analyst = {
      name: analystProfile?.name || 'Analista não identificado',
      email: analystProfile?.email || '—',
      shortId: analysis.user_id.slice(0, 8),
    };

    console.log('Starting analysis for:', analysis.tipo_documento, 'Process:', analysis.processo);

    // Update status to processing
    await supabase
      .from('analyses')
      .update({ status: 'processing' })
      .eq('id', analysis_id);

    // Download file from storage
    const filePath = analysis.arquivo_url.split('/').pop();
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(`${analysis.user_id}/${filePath}`);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Erro ao baixar arquivo');
    }

    // Convert file to base64 for AI processing (chunked to avoid stack overflow)
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    const base64 = btoa(binary);
    
    console.log('File converted to base64, length:', base64.length);

    // Determine if this is an ETP analysis
    const isETP = analysis.tipo_documento === 'ETP';
    
    let resultado: any;
    let relatorio_html: string;
    let relatorio_texto: string;

    if (isETP) {
      // Use specialized ETP analysis
      console.log('Using specialized ETP analysis prompt');
      
      const checklistText = ETP_CHECKLIST.map(item => `- ${item.codigo}: ${item.descricao}`).join('\n');
      
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: ETP_SYSTEM_PROMPT },
            { role: 'user', content: ETP_USER_PROMPT(analysis.processo || 'Não informado', checklistText) }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'gerar_analise_etp',
              description: 'Gera análise técnica estruturada do ETP conforme Lei 14.133/2021',
              parameters: {
                type: 'object',
                properties: {
                  tabela_analise: {
                    type: 'array',
                    description: 'Tabela com análise de cada item do checklist',
                    items: {
                      type: 'object',
                      properties: {
                        numero: { type: 'number', description: 'Número sequencial do item' },
                        codigo: { type: 'string', description: 'Código do item (ex: ETP-01)' },
                        item_verificado: { type: 'string', description: 'Descrição do item verificado' },
                        conformidade: { 
                          type: 'string', 
                          enum: ['ATENDE', 'ATENDE_PARCIALMENTE', 'NAO_ATENDE', 'NAO_SE_APLICA'],
                          description: 'Classificação de conformidade do item'
                        },
                        observacoes: { type: 'string', description: 'Observações detalhadas com fundamentação técnica e referência à seção/página do ETP' }
                      },
                      required: ['numero', 'codigo', 'item_verificado', 'conformidade', 'observacoes']
                    }
                  },
                  conclusao_tecnica: {
                    type: 'object',
                    description: 'Conclusão técnica do ETP',
                    properties: {
                      diagnostico_resumido: { type: 'string', description: 'Diagnóstico resumido sobre a adequação do ETP' },
                      pontos_fortes: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Lista de pontos fortes identificados no documento'
                      },
                      ausencias_criticas: { 
                        type: 'array', 
                        items: { type: 'string' },
                        description: 'Lista de ausências críticas ou itens que necessitam correção'
                      },
                      parecer_adequacao: { type: 'string', description: 'Parecer final sobre se o ETP é suficiente para subsidiar a contratação pública pretendida' }
                    },
                    required: ['diagnostico_resumido', 'pontos_fortes', 'ausencias_criticas', 'parecer_adequacao']
                  },
                  conformidade_percentual: { 
                    type: 'number', 
                    minimum: 0, 
                    maximum: 100,
                    description: 'Percentual geral de conformidade do ETP'
                  }
                },
                required: ['tabela_analise', 'conclusao_tecnica', 'conformidade_percentual']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'gerar_analise_etp' } }
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI Response error:', aiResponse.status, errorText);
        if (aiResponse.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (aiResponse.status === 402) {
          throw new Error('Créditos insuficientes. Entre em contato com o administrador.');
        }
        throw new Error('Erro ao processar análise com IA');
      }

      const aiData = await aiResponse.json();
      console.log('AI Response received');
      
      const toolCall = aiData.choices[0].message.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('Resposta da IA não contém análise estruturada');
      }
      
      resultado = JSON.parse(toolCall.function.arguments);
      console.log('ETP Analysis result parsed, conformidade:', resultado.conformidade_percentual);

      // Generate ETP-specific HTML report with table format
      relatorio_html = generateETPHtmlReport(analysis, resultado, analyst);
      relatorio_texto = generateETPTextReport(analysis, resultado, analyst);
      
    } else {
      // Use generic analysis for other document types
      console.log('Using generic analysis for:', analysis.tipo_documento);
      
      const checklist = analysis.checklist || [
        { codigo: 'DOC-01', descricao: 'Documento está legível e completo' },
        { codigo: 'DOC-02', descricao: 'Informações obrigatórias presentes' },
        { codigo: 'DOC-03', descricao: 'Formatação adequada' },
        { codigo: 'DOC-04', descricao: 'Assinaturas e carimbos presentes' },
        { codigo: 'DOC-05', descricao: 'Datas e prazos válidos' }
      ];

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em análise de conformidade de documentos jurídicos e administrativos.
Analise documentos contra checklists de conformidade e forneça relatórios detalhados.`
            },
            {
              role: 'user',
              content: `Analise este documento do tipo "${analysis.tipo_documento}" referente ao processo "${analysis.processo}".

Checklist de verificação:
${checklist.map((item: any) => `- ${item.codigo}: ${item.descricao}`).join('\n')}

Para cada item do checklist, verifique:
1. Se está CONFORME (atende completamente)
2. Se está NÃO CONFORME (não atende)
3. Se está PARCIALMENTE CONFORME (atende parcialmente)
4. Justificativa detalhada da avaliação
5. Recomendações de correção (se aplicável)

Forneça também:
- Resumo executivo da análise
- Principais indicadores de conformidade encontrados
- Percentual geral de conformidade
- Recomendações prioritárias`
            }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'gerar_analise_conformidade',
              description: 'Gera análise estruturada de conformidade',
              parameters: {
                type: 'object',
                properties: {
                  resumo_executivo: { type: 'string' },
                  itens_checklist: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        codigo: { type: 'string' },
                        status: { type: 'string', enum: ['CONFORME', 'NÃO CONFORME', 'PARCIALMENTE CONFORME'] },
                        justificativa: { type: 'string' },
                        recomendacao: { type: 'string' }
                      }
                    }
                  },
                  principais_nao_conformidades: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  conformidade_percentual: { type: 'number', minimum: 0, maximum: 100 },
                  recomendacoes_prioritarias: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['resumo_executivo', 'itens_checklist', 'conformidade_percentual']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'gerar_analise_conformidade' } }
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (aiResponse.status === 402) {
          throw new Error('Créditos insuficientes. Entre em contato com o administrador.');
        }
        throw new Error('Erro ao processar análise com IA');
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices[0].message.tool_calls?.[0];
      resultado = JSON.parse(toolCall.function.arguments);

      // Generate generic HTML report
      relatorio_html = generateGenericHtmlReport(analysis, resultado, analyst);
      relatorio_texto = generateGenericTextReport(analysis, resultado, analyst);
    }

    // Update analysis with results
    const { error: updateError } = await supabase
      .from('analyses')
      .update({
        status: 'success',
        resultado_json: resultado,
        relatorio_html,
        relatorio_texto,
        conformidade_percentual: resultado.conformidade_percentual,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysis_id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: analysis.user_id,
      action: 'analysis_completed',
      details: {
        analysis_id,
        processo: analysis.processo,
        tipo_documento: analysis.tipo_documento,
        conformidade: resultado.conformidade_percentual,
      },
    });

    console.log('Analysis completed successfully:', analysis_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis_id,
        conformidade: resultado.conformidade_percentual 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in analyze-document:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper function to get conformity icon and color
function getConformityStyle(conformidade: string) {
  switch (conformidade) {
    case 'ATENDE':
      return { icon: '✔️', color: 'hsl(142, 76%, 36%)', bgColor: 'hsl(142, 76%, 95%)' };
    case 'ATENDE_PARCIALMENTE':
      return { icon: '⚠️', color: 'hsl(45, 100%, 40%)', bgColor: 'hsl(45, 100%, 95%)' };
    case 'NAO_ATENDE':
      return { icon: '❌', color: 'hsl(0, 72%, 51%)', bgColor: 'hsl(0, 72%, 95%)' };
    case 'NAO_SE_APLICA':
      return { icon: '🛑', color: 'hsl(220, 13%, 46%)', bgColor: 'hsl(220, 13%, 95%)' };
    default:
      return { icon: '❓', color: 'hsl(220, 13%, 46%)', bgColor: 'hsl(220, 13%, 95%)' };
  }
}

// Generate ETP-specific HTML report
function generateETPHtmlReport(analysis: any, resultado: any, analyst: { name: string; email: string; shortId: string }): string {
  const conformidadeFormatted = resultado.conformidade_percentual?.toFixed(1) || '0.0';
  
  const tableRows = resultado.tabela_analise?.map((item: any) => {
    const style = getConformityStyle(item.conformidade);
    return `
      <tr>
        <td style="padding: 12px; border: 1px solid hsl(250, 20%, 85%); text-align: center; font-weight: 600;">${item.numero}</td>
        <td style="padding: 12px; border: 1px solid hsl(250, 20%, 85%); font-weight: 600; color: hsl(250, 60%, 45%);">${item.codigo}</td>
        <td style="padding: 12px; border: 1px solid hsl(250, 20%, 85%);">${item.item_verificado}</td>
        <td style="padding: 12px; border: 1px solid hsl(250, 20%, 85%); text-align: center; background: ${style.bgColor};">
          <span style="color: ${style.color}; font-weight: bold;">${style.icon} ${item.conformidade.replace('_', ' ')}</span>
        </td>
        <td style="padding: 12px; border: 1px solid hsl(250, 20%, 85%); font-size: 13px;">${item.observacoes}</td>
      </tr>
    `;
  }).join('') || '';

  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 1000px; margin: 0 auto; padding: 2rem; background: white;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 3px solid hsl(250, 60%, 55%);">
        <h1 style="color: hsl(250, 60%, 45%); margin: 0 0 0.5rem 0; font-size: 1.75rem;">
          Relatório de Análise Técnica - ETP
        </h1>
        <p style="color: hsl(250, 30%, 50%); margin: 0; font-size: 0.95rem;">
          Estudo Técnico Preliminar • Lei nº 14.133/2021
        </p>
      </div>

      <!-- Document Info Card -->
      <div style="background: linear-gradient(135deg, hsl(250, 60%, 97%), hsl(250, 50%, 95%)); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid hsl(250, 40%, 90%);">
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
          <div>
            <p style="margin: 0.25rem 0; color: hsl(250, 30%, 40%);"><strong>Processo:</strong> ${analysis.processo || 'Não informado'}</p>
            <p style="margin: 0.25rem 0; color: hsl(250, 30%, 40%);"><strong>Tipo de Documento:</strong> ${analysis.tipo_documento}</p>
          </div>
          <div>
            <p style="margin: 0.25rem 0; color: hsl(250, 30%, 40%);"><strong>Data da Análise:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <p style="margin: 0.25rem 0; color: hsl(250, 30%, 40%);"><strong>Conformidade Geral:</strong> 
              <span style="font-size: 1.25rem; font-weight: bold; color: ${resultado.conformidade_percentual >= 70 ? 'hsl(142, 76%, 36%)' : resultado.conformidade_percentual >= 40 ? 'hsl(45, 100%, 40%)' : 'hsl(0, 72%, 51%)'};">
                ${conformidadeFormatted}%
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Analyst Identification -->
      <div style="background: hsl(220, 30%, 97%); padding: 1rem 1.5rem; border-radius: 12px; margin-bottom: 2rem; border-left: 4px solid hsl(224, 76%, 48%);">
        <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: hsl(224, 60%, 30%);">Analista Responsável</p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem 1rem; font-size: 0.9rem; color: hsl(220, 20%, 30%);">
          <p style="margin: 0;"><strong>Nome:</strong> ${analyst.name}</p>
          <p style="margin: 0;"><strong>E-mail:</strong> ${analyst.email}</p>
          <p style="margin: 0;"><strong>ID:</strong> ${analyst.shortId}</p>
          <p style="margin: 0;"><strong>Relatório emitido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <!-- Analysis Table -->
      <div style="margin-bottom: 2rem;">
        <h2 style="color: hsl(250, 60%, 45%); font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid hsl(250, 60%, 90%);">
          Tabela de Análise de Conformidade
        </h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: hsl(250, 60%, 55%); color: white;">
                <th style="padding: 12px; border: 1px solid hsl(250, 60%, 45%); width: 50px;">Nº</th>
                <th style="padding: 12px; border: 1px solid hsl(250, 60%, 45%); width: 80px;">Código</th>
                <th style="padding: 12px; border: 1px solid hsl(250, 60%, 45%);">Item Verificado</th>
                <th style="padding: 12px; border: 1px solid hsl(250, 60%, 45%); width: 140px;">Conformidade</th>
                <th style="padding: 12px; border: 1px solid hsl(250, 60%, 45%);">Observações</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Technical Conclusion -->
      <div style="margin-top: 2rem; background: hsl(250, 60%, 98%); border-radius: 12px; padding: 1.5rem; border: 1px solid hsl(250, 40%, 90%);">
        <h2 style="color: hsl(250, 60%, 45%); font-size: 1.25rem; margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid hsl(250, 60%, 85%);">
          Conclusão Técnica do ETP
        </h2>
        
        <div style="margin-bottom: 1.5rem;">
          <h3 style="color: hsl(250, 50%, 40%); font-size: 1rem; margin: 0 0 0.5rem 0;">Diagnóstico Resumido</h3>
          <p style="margin: 0; text-align: justify; line-height: 1.6; color: hsl(250, 20%, 30%);">
            ${resultado.conclusao_tecnica?.diagnostico_resumido || 'Não disponível'}
          </p>
        </div>

        ${resultado.conclusao_tecnica?.pontos_fortes?.length > 0 ? `
          <div style="margin-bottom: 1.5rem; background: hsl(142, 76%, 97%); padding: 1rem; border-radius: 8px; border-left: 4px solid hsl(142, 76%, 36%);">
            <h3 style="color: hsl(142, 76%, 30%); font-size: 1rem; margin: 0 0 0.75rem 0;">✔️ Pontos Fortes</h3>
            <ul style="margin: 0; padding-left: 1.25rem; color: hsl(142, 50%, 25%);">
              ${resultado.conclusao_tecnica.pontos_fortes.map((ponto: string) => `<li style="margin: 0.5rem 0;">${ponto}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${resultado.conclusao_tecnica?.ausencias_criticas?.length > 0 ? `
          <div style="margin-bottom: 1.5rem; background: hsl(0, 72%, 97%); padding: 1rem; border-radius: 8px; border-left: 4px solid hsl(0, 72%, 51%);">
            <h3 style="color: hsl(0, 72%, 35%); font-size: 1rem; margin: 0 0 0.75rem 0;">❌ Ausências Críticas</h3>
            <ul style="margin: 0; padding-left: 1.25rem; color: hsl(0, 50%, 30%);">
              ${resultado.conclusao_tecnica.ausencias_criticas.map((ausencia: string) => `<li style="margin: 0.5rem 0;">${ausencia}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div style="background: hsl(250, 60%, 95%); padding: 1rem; border-radius: 8px; border-left: 4px solid hsl(250, 60%, 55%);">
          <h3 style="color: hsl(250, 60%, 40%); font-size: 1rem; margin: 0 0 0.5rem 0;">📋 Parecer de Adequação</h3>
          <p style="margin: 0; text-align: justify; line-height: 1.6; color: hsl(250, 30%, 25%); font-weight: 500;">
            ${resultado.conclusao_tecnica?.parecer_adequacao || 'Não disponível'}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid hsl(250, 20%, 85%); text-align: center; font-size: 0.85rem; color: hsl(250, 20%, 50%);">
        <p style="margin: 0;">Relatório gerado automaticamente pelo Sistema de Análise de Conformidade</p>
        <p style="margin: 0.25rem 0;">Lei nº 14.133/2021 • Decreto nº 39.050-E/2025</p>
      </div>
    </div>
  `;
}

// Generate ETP-specific text report
function generateETPTextReport(analysis: any, resultado: any, analyst: { name: string; email: string; shortId: string }): string {
  const conformidadeFormatted = resultado.conformidade_percentual?.toFixed(1) || '0.0';
  
  const tableContent = resultado.tabela_analise?.map((item: any) => {
    const statusMap: Record<string, string> = {
      'ATENDE': '✔️ ATENDE',
      'ATENDE_PARCIALMENTE': '⚠️ ATENDE PARCIALMENTE',
      'NAO_ATENDE': '❌ NÃO ATENDE',
      'NAO_SE_APLICA': '🛑 NÃO SE APLICA'
    };
    const statusLabel = statusMap[item.conformidade] || item.conformidade;
    
    return `
${item.numero}. ${item.codigo} - ${item.item_verificado}
   Conformidade: ${statusLabel}
   Observações: ${item.observacoes}
`;
  }).join('\n') || '';

  return `
================================================================================
                    RELATÓRIO DE ANÁLISE TÉCNICA - ETP
              Estudo Técnico Preliminar • Lei nº 14.133/2021
================================================================================

ANALISTA RESPONSÁVEL
--------------------
Nome: ${analyst.name}
E-mail: ${analyst.email}
ID: ${analyst.shortId}
Relatório emitido em: ${new Date().toLocaleString('pt-BR')}

INFORMAÇÕES DO DOCUMENTO
------------------------
Processo: ${analysis.processo || 'Não informado'}
Tipo de Documento: ${analysis.tipo_documento}
Data da Análise: ${new Date().toLocaleString('pt-BR')}
Conformidade Geral: ${conformidadeFormatted}%


================================================================================
                        TABELA DE ANÁLISE DE CONFORMIDADE
================================================================================
${tableContent}

================================================================================
                           CONCLUSÃO TÉCNICA DO ETP
================================================================================

DIAGNÓSTICO RESUMIDO
--------------------
${resultado.conclusao_tecnica?.diagnostico_resumido || 'Não disponível'}

${resultado.conclusao_tecnica?.pontos_fortes?.length > 0 ? `
PONTOS FORTES
-------------
${resultado.conclusao_tecnica.pontos_fortes.map((ponto: string, i: number) => `${i + 1}. ${ponto}`).join('\n')}
` : ''}

${resultado.conclusao_tecnica?.ausencias_criticas?.length > 0 ? `
AUSÊNCIAS CRÍTICAS
------------------
${resultado.conclusao_tecnica.ausencias_criticas.map((ausencia: string, i: number) => `${i + 1}. ${ausencia}`).join('\n')}
` : ''}

PARECER DE ADEQUAÇÃO
--------------------
${resultado.conclusao_tecnica?.parecer_adequacao || 'Não disponível'}

================================================================================
Relatório gerado automaticamente pelo Sistema de Análise de Conformidade
Lei nº 14.133/2021 • Decreto nº 39.050-E/2025
================================================================================
  `.trim();
}

// Generate generic HTML report (for other document types)
function generateGenericHtmlReport(analysis: any, resultado: any, analyst: { name: string; email: string; shortId: string }): string {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
      <h1 style="color: hsl(250, 60%, 55%); border-bottom: 2px solid hsl(250, 60%, 55%); padding-bottom: 1rem;">
        Relatório de Análise de Conformidade
      </h1>

      <div style="background: hsl(220, 30%, 97%); padding: 1rem 1.5rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid hsl(224, 76%, 48%);">
        <h2 style="color: hsl(224, 60%, 30%); margin: 0 0 0.5rem 0; font-size: 1.1rem;">Analista Responsável</h2>
        <p style="margin: 0.25rem 0;"><strong>Nome:</strong> ${analyst.name}</p>
        <p style="margin: 0.25rem 0;"><strong>E-mail:</strong> ${analyst.email}</p>
        <p style="margin: 0.25rem 0;"><strong>ID:</strong> ${analyst.shortId}</p>
        <p style="margin: 0.25rem 0;"><strong>Relatório emitido em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div style="background: hsl(250, 60%, 97%); padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
        <h2 style="color: hsl(250, 60%, 35%); margin-top: 0;">Informações do Documento</h2>
        <p><strong>Processo:</strong> ${analysis.processo}</p>
        <p><strong>Tipo:</strong> ${analysis.tipo_documento}</p>
        <p><strong>Data da Análise:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>Conformidade Geral:</strong> ${resultado.conformidade_percentual?.toFixed(1) || '0.0'}%</p>
      </div>


      <div style="margin: 2rem 0;">
        <h2 style="color: hsl(250, 60%, 35%);">Resumo Executivo</h2>
        <p style="text-align: justify;">${resultado.resumo_executivo}</p>
      </div>

      <div style="margin: 2rem 0;">
        <h2 style="color: hsl(250, 60%, 35%);">Análise Detalhada do Checklist</h2>
        ${resultado.itens_checklist?.map((item: any) => `
          <div style="border-left: 4px solid ${
            item.status === 'CONFORME' ? 'hsl(142, 76%, 36%)' :
            item.status === 'NÃO CONFORME' ? 'hsl(0, 72%, 51%)' :
            'hsl(45, 100%, 51%)'
          }; padding: 1rem; margin: 1rem 0; background: white; border-radius: 4px;">
            <h3 style="margin: 0 0 0.5rem 0; color: hsl(250, 60%, 35%);">${item.codigo}</h3>
            <p style="margin: 0.5rem 0;"><strong>Status:</strong> 
              <span style="color: ${
                item.status === 'CONFORME' ? 'hsl(142, 76%, 36%)' :
                item.status === 'NÃO CONFORME' ? 'hsl(0, 72%, 51%)' :
                'hsl(45, 100%, 51%)'
              }; font-weight: bold;">${item.status}</span>
            </p>
            <p style="text-align: justify;"><strong>Justificativa:</strong> ${item.justificativa}</p>
            ${item.recomendacao ? `<p style="text-align: justify;"><strong>Recomendação:</strong> ${item.recomendacao}</p>` : ''}
          </div>
        `).join('') || ''}
      </div>

      ${resultado.principais_nao_conformidades?.length > 0 ? `
        <div style="margin: 2rem 0; background: hsl(0, 72%, 97%); padding: 1.5rem; border-radius: 8px;">
          <h2 style="color: hsl(0, 72%, 35%); margin-top: 0;">Principais Indicadores de Conformidade</h2>
          <ul style="margin: 0;">
            ${resultado.principais_nao_conformidades.map((nc: string) => `<li style="margin: 0.5rem 0;">${nc}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${resultado.recomendacoes_prioritarias?.length > 0 ? `
        <div style="margin: 2rem 0; background: hsl(142, 76%, 97%); padding: 1.5rem; border-radius: 8px;">
          <h2 style="color: hsl(142, 76%, 35%); margin-top: 0;">Recomendações Prioritárias</h2>
          <ol style="margin: 0;">
            ${resultado.recomendacoes_prioritarias.map((rec: string) => `<li style="margin: 0.5rem 0;">${rec}</li>`).join('')}
          </ol>
        </div>
      ` : ''}
    </div>
  `;
}

// Generate generic text report (for other document types)
function generateGenericTextReport(analysis: any, resultado: any, analyst: { name: string; email: string; shortId: string }): string {
  return `
RELATÓRIO DE ANÁLISE DE CONFORMIDADE

ANALISTA RESPONSÁVEL
Nome: ${analyst.name}
E-mail: ${analyst.email}
ID: ${analyst.shortId}
Relatório emitido em: ${new Date().toLocaleString('pt-BR')}

INFORMAÇÕES DO DOCUMENTO
Processo: ${analysis.processo}
Tipo: ${analysis.tipo_documento}
Data da Análise: ${new Date().toLocaleString('pt-BR')}
Conformidade Geral: ${resultado.conformidade_percentual?.toFixed(1) || '0.0'}%


RESUMO EXECUTIVO
${resultado.resumo_executivo}

ANÁLISE DETALHADA DO CHECKLIST
${resultado.itens_checklist?.map((item: any) => `
${item.codigo} - ${item.status}
Justificativa: ${item.justificativa}
${item.recomendacao ? `Recomendação: ${item.recomendacao}` : ''}
`).join('\n') || ''}

${resultado.principais_nao_conformidades?.length > 0 ? `
PRINCIPAIS INDICADORES DE CONFORMIDADE
${resultado.principais_nao_conformidades.map((nc: string, i: number) => `${i + 1}. ${nc}`).join('\n')}
` : ''}

${resultado.recomendacoes_prioritarias?.length > 0 ? `
RECOMENDAÇÕES PRIORITÁRIAS
${resultado.recomendacoes_prioritarias.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
` : ''}
  `.trim();
}

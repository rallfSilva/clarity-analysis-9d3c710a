import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      throw new Error('Erro ao baixar arquivo');
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Prepare checklist
    const checklist = analysis.checklist || [
      { codigo: 'DOC-01', descricao: 'Documento está legível e completo' },
      { codigo: 'DOC-02', descricao: 'Informações obrigatórias presentes' },
      { codigo: 'DOC-03', descricao: 'Formatação adequada' },
      { codigo: 'DOC-04', descricao: 'Assinaturas e carimbos presentes' },
      { codigo: 'DOC-05', descricao: 'Datas e prazos válidos' }
    ];

    // Call Lovable AI
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
- Principais não-conformidades encontradas
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
    const resultado = JSON.parse(toolCall.function.arguments);

    // Generate HTML report
    const relatorio_html = `
      <div style="font-family: Inter, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem;">
        <h1 style="color: hsl(250, 60%, 55%); border-bottom: 2px solid hsl(250, 60%, 55%); padding-bottom: 1rem;">
          Relatório de Análise de Conformidade
        </h1>
        
        <div style="background: hsl(250, 60%, 97%); padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
          <h2 style="color: hsl(250, 60%, 35%); margin-top: 0;">Informações do Documento</h2>
          <p><strong>Processo:</strong> ${analysis.processo}</p>
          <p><strong>Tipo:</strong> ${analysis.tipo_documento}</p>
          <p><strong>Data da Análise:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <p><strong>Conformidade Geral:</strong> ${resultado.conformidade_percentual.toFixed(1)}%</p>
        </div>

        <div style="margin: 2rem 0;">
          <h2 style="color: hsl(250, 60%, 35%);">Resumo Executivo</h2>
          <p style="text-align: justify;">${resultado.resumo_executivo}</p>
        </div>

        <div style="margin: 2rem 0;">
          <h2 style="color: hsl(250, 60%, 35%);">Análise Detalhada do Checklist</h2>
          ${resultado.itens_checklist.map((item: any) => `
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
          `).join('')}
        </div>

        ${resultado.principais_nao_conformidades?.length > 0 ? `
          <div style="margin: 2rem 0; background: hsl(0, 72%, 97%); padding: 1.5rem; border-radius: 8px;">
            <h2 style="color: hsl(0, 72%, 35%); margin-top: 0;">Principais Não-Conformidades</h2>
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

    // Generate text report
    const relatorio_texto = `
RELATÓRIO DE ANÁLISE DE CONFORMIDADE

INFORMAÇÕES DO DOCUMENTO
Processo: ${analysis.processo}
Tipo: ${analysis.tipo_documento}
Data da Análise: ${new Date().toLocaleString('pt-BR')}
Conformidade Geral: ${resultado.conformidade_percentual.toFixed(1)}%

RESUMO EXECUTIVO
${resultado.resumo_executivo}

ANÁLISE DETALHADA DO CHECKLIST
${resultado.itens_checklist.map((item: any) => `
${item.codigo} - ${item.status}
Justificativa: ${item.justificativa}
${item.recomendacao ? `Recomendação: ${item.recomendacao}` : ''}
`).join('\n')}

${resultado.principais_nao_conformidades?.length > 0 ? `
PRINCIPAIS NÃO-CONFORMIDADES
${resultado.principais_nao_conformidades.map((nc: string, i: number) => `${i + 1}. ${nc}`).join('\n')}
` : ''}

${resultado.recomendacoes_prioritarias?.length > 0 ? `
RECOMENDAÇÕES PRIORITÁRIAS
${resultado.recomendacoes_prioritarias.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n')}
` : ''}
    `.trim();

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
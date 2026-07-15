import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NormalizedReport, SituacaoNormalizada } from './reportUtils';
import { processingDurationLabel } from './reportUtils';

interface Analysis {
  id: string;
  processo: string;
  tipo_documento: string;
  status: string;
  conformidade_percentual: number | null;
  created_at: string;
  completed_at: string | null;
  relatorio_html: string | null;
  resultado_json?: any;
  user_id: string;
}

interface Analyst {
  name: string;
  email: string;
}

const COLORS = {
  navy: [11, 31, 77] as [number, number, number],
  primary: [29, 78, 216] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  danger: [239, 68, 68] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  border: [229, 231, 235] as [number, number, number],
  bgLight: [245, 247, 251] as [number, number, number],
  text: [17, 24, 39] as [number, number, number],
};

function situacaoColors(s: SituacaoNormalizada) {
  switch (s) {
    case 'conforme': return { fill: COLORS.success, text: [255, 255, 255] as [number, number, number], label: 'Conforme' };
    case 'parcial': return { fill: COLORS.warning, text: [255, 255, 255] as [number, number, number], label: 'Parcial' };
    case 'nao_conforme': return { fill: COLORS.danger, text: [255, 255, 255] as [number, number, number], label: 'Não Conforme' };
    default: return { fill: COLORS.muted, text: [255, 255, 255] as [number, number, number], label: 'N/A' };
  }
}

export async function exportReportPDF(analysis: Analysis, analyst: Analyst | null, report: NormalizedReport) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;

  const conformidade = analysis.conformidade_percentual ?? report.conformidadePercentual ?? 0;
  const tempo = processingDurationLabel(analysis.created_at, analysis.completed_at);
  const analystName = analyst?.name || 'Analista não identificado';
  const analystEmail = analyst?.email || '—';
  const analystShortId = analysis.user_id.slice(0, 8);

  let y = 0;

  // ============ Institutional header ============
  doc.setFillColor(...COLORS.navy);
  doc.rect(0, 0, pageW, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SIAC-SELC', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sistema Integrado de Análise de Conformidades', margin, 19);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Relatório Executivo de Auditoria', margin, 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Lei nº 14.133/2021', pageW - margin, 27, { align: 'right' });

  y = 42;

  // ============ Title + circular gauge area ============
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Análise de Conformidade', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Processo ${analysis.processo || 'N/A'}  •  Tipo ${analysis.tipo_documento}`, margin, y);
  y += 8;

  // Conformity gauge box (right)
  const gaugeX = pageW - margin - 60;
  const gaugeY = y;
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(...COLORS.bgLight);
  doc.roundedRect(gaugeX, gaugeY, 60, 26, 3, 3, 'FD');
  const gaugeColor: [number, number, number] =
    conformidade >= 80 ? COLORS.success : conformidade >= 50 ? COLORS.warning : COLORS.danger;
  doc.setTextColor(...gaugeColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(`${conformidade.toFixed(1)}%`, gaugeX + 30, gaugeY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('Conformidade Geral', gaugeX + 30, gaugeY + 17, { align: 'center' });
  // progress bar
  const barW = 50, barH = 3;
  const barX = gaugeX + 5, barY = gaugeY + 20;
  doc.setFillColor(...COLORS.border);
  doc.roundedRect(barX, barY, barW, barH, 1.5, 1.5, 'F');
  doc.setFillColor(...gaugeColor);
  doc.roundedRect(barX, barY, (barW * conformidade) / 100, barH, 1.5, 1.5, 'F');

  // Metadata block (left of gauge)
  doc.setTextColor(...COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const metaLines = [
    `Data: ${format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    `Tempo de processamento: ${tempo}`,
    `Analista: ${analystName}`,
    `E-mail: ${analystEmail}  •  ID ${analystShortId}`,
  ];
  metaLines.forEach((line, i) => doc.text(line, margin, y + 4 + i * 5));
  y += 30;

  // ============ Indicator cards ============
  const cardData = [
    { label: 'Itens Avaliados', value: String(report.items.length), color: COLORS.primary },
    { label: 'Conforme', value: String(report.totals.conforme), color: COLORS.success },
    { label: 'Parcial', value: String(report.totals.parcial), color: COLORS.warning },
    { label: 'Não Conforme', value: String(report.totals.nao_conforme), color: COLORS.danger },
  ];
  const cardW = (pageW - margin * 2 - 9) / 4;
  const cardH = 20;
  cardData.forEach((c, i) => {
    const x = margin + i * (cardW + 3);
    doc.setDrawColor(...COLORS.border);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
    doc.setFillColor(...c.color);
    doc.rect(x, y, 2, cardH, 'F');
    doc.setTextColor(...COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(c.label.toUpperCase(), x + 5, y + 7);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(c.value, x + 5, y + 15);
  });
  y += cardH + 8;

  // ============ Executive summary ============
  const summaryText = report.resumoExecutivo || report.diagnostico;
  if (summaryText) {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, 'Resumo Executivo', margin, y, pageW);
    doc.setFillColor(...COLORS.bgLight);
    const lines = doc.splitTextToSize(summaryText, pageW - margin * 2 - 6);
    const blockH = lines.length * 4.5 + 6;
    doc.roundedRect(margin, y, pageW - margin * 2, blockH, 2, 2, 'F');
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(lines, margin + 3, y + 5);
    y += blockH + 4;
  }

  // Strengths / weaknesses
  if (report.pontosFortes.length || report.ausenciasCriticas.length) {
    y = ensureSpace(doc, y, 20);
    const colW = (pageW - margin * 2 - 4) / 2;
    const startY = y;
    let leftBottom = y, rightBottom = y;
    if (report.pontosFortes.length) {
      leftBottom = drawBulletCard(doc, 'Pontos Fortes', report.pontosFortes, margin, y, colW, COLORS.success);
    }
    if (report.ausenciasCriticas.length) {
      rightBottom = drawBulletCard(doc, 'Ausências Críticas', report.ausenciasCriticas, margin + colW + 4, y, colW, COLORS.danger);
    }
    y = Math.max(leftBottom, rightBottom, startY) + 4;
  }

  // ============ Analysis table ============
  if (report.items.length > 0) {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, 'Tabela de Análise', margin, y, pageW);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Item', 'Elemento Avaliado', 'Situação', 'Observação', 'Recomendação']],
      body: report.items.map((it) => [
        it.codigo,
        it.elemento,
        situacaoColors(it.situacao).label,
        it.observacao,
        it.recomendacao || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2, valign: 'top', textColor: COLORS.text as any },
      headStyles: { fillColor: COLORS.navy as any, textColor: 255, fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [249, 250, 252] as any },
      columnStyles: {
        0: { cellWidth: 18, fontStyle: 'bold' },
        1: { cellWidth: 45 },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 50 },
        4: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const item = report.items[data.row.index];
          const c = situacaoColors(item.situacao);
          data.cell.styles.fillColor = c.fill as any;
          data.cell.styles.textColor = c.text as any;
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // ============ Recommendations ============
  if (report.recomendacoes.length > 0) {
    y = ensureSpace(doc, y, 30);
    y = drawSectionTitle(doc, 'Recomendações da Auditoria', margin, y, pageW);
    doc.setTextColor(...COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    report.recomendacoes.forEach((r, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${r}`, pageW - margin * 2 - 4);
      y = ensureSpace(doc, y, lines.length * 5 + 2);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 1;
    });
    y += 3;
  }

  // ============ Conclusion ============
  if (report.parecerFinal || report.diagnostico) {
    y = ensureSpace(doc, y, 40);
    y = drawSectionTitle(doc, 'Conclusão Técnica', margin, y, pageW);
    doc.setFillColor(...COLORS.bgLight);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.4);
    const parecer = report.parecerFinal || report.diagnostico || '';
    const situacaoFinal = conformidade >= 80 ? 'Adequado' : conformidade >= 50 ? 'Adequado com Ressalvas' : 'Inadequado';
    const lines = doc.splitTextToSize(parecer, pageW - margin * 2 - 6);
    const blockH = lines.length * 4.5 + 22;
    doc.roundedRect(margin, y, pageW - margin * 2, blockH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.text(`${conformidade.toFixed(1)}%  •  ${situacaoFinal}`, margin + 3, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    doc.text(lines, margin + 3, y + 15);
    y += blockH + 4;
  }

  // ============ Footer on every page ============
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Analista: ${analystName} (${analystShortId}) • Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      margin, pageH - 7,
    );
    doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - 7, { align: 'right' });
  }

  const fileName = `Relatorio_${analysis.tipo_documento.replace(/\s+/g, '_')}_${(analysis.processo || 'sem-processo').replace(/[\/\\]/g, '_')}_${format(new Date(analysis.created_at), 'ddMMyyyy')}.pdf`;
  doc.save(fileName);
}

// ==== helpers ====
function ensureSpace(doc: any, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSectionTitle(doc: any, title: string, margin: number, y: number, pageW: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.navy);
  doc.text(title, margin, y);
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + 40, y + 1.5);
  return y + 7;
}

function drawBulletCard(
  doc: any, title: string, items: string[], x: number, y: number, w: number, color: [number, number, number],
): number {
  doc.setDrawColor(...COLORS.border);
  doc.setFillColor(255, 255, 255);
  const lineHeights = items.map((it) => doc.splitTextToSize(`• ${it}`, w - 8).length * 4);
  const h = 10 + lineHeights.reduce((a, b) => a + b + 1, 0);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFillColor(...color);
  doc.rect(x, y, 2, h, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...color);
  doc.text(title.toUpperCase(), x + 5, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  let cy = y + 11;
  items.forEach((it) => {
    const lines = doc.splitTextToSize(`• ${it}`, w - 8);
    doc.text(lines, x + 5, cy);
    cy += lines.length * 4 + 1;
  });
  return y + h;
}

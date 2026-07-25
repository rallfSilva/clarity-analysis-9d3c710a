import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NormalizedReport, NormalizedItem, SituacaoNormalizada } from './reportUtils';
import { processingDurationLabel } from './reportUtils';
import { getDocumentTypeById } from './documentTypes';

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

type RGB = [number, number, number];

const C = {
  navy: [11, 31, 77] as RGB,
  primary: [29, 78, 216] as RGB,
  text: [17, 24, 39] as RGB,
  muted: [107, 114, 128] as RGB,
  border: [226, 232, 240] as RGB,
  bg: [248, 250, 252] as RGB,
  // soft tinted backgrounds (readable in print)
  successBg: [220, 252, 231] as RGB,
  successText: [21, 128, 61] as RGB,
  warnBg: [254, 243, 199] as RGB,
  warnText: [161, 98, 7] as RGB,
  dangerBg: [254, 226, 226] as RGB,
  dangerText: [185, 28, 28] as RGB,
  grayBg: [241, 245, 249] as RGB,
  grayText: [71, 85, 105] as RGB,
  orangeBg: [255, 237, 213] as RGB,
  orangeText: [194, 65, 12] as RGB,
};

function situacaoStyle(s: SituacaoNormalizada) {
  switch (s) {
    case 'conforme': return { bg: C.successBg, fg: C.successText, label: 'Conforme' };
    case 'parcial': return { bg: C.warnBg, fg: C.warnText, label: 'Parcialmente Conforme' };
    case 'nao_conforme': return { bg: C.dangerBg, fg: C.dangerText, label: 'Não Conforme' };
    default: return { bg: C.grayBg, fg: C.grayText, label: 'Não se Aplica' };
  }
}


export async function exportReportPDF(analysis: Analysis, analyst: Analyst | null, report: NormalizedReport) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;

  const conformidade = analysis.conformidade_percentual ?? report.conformidadePercentual ?? 0;
  const tempo = processingDurationLabel(analysis.created_at, analysis.completed_at);
  const analystName = analyst?.name || 'Analista não identificado';
  const analystEmail = analyst?.email || '—';
  const analystShortId = analysis.user_id.slice(0, 8);
  const tipoLabel = getDocumentTypeById(analysis.tipo_documento)?.shortName ?? analysis.tipo_documento;

  // ============ Header (navy band) ============
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('SIAC', margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Sistema Integrado de Análise de Conformidades', margin, 17);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Relatório de Análise de Conformidades', pageW - margin, 12, { align: 'right' });

  let y = 36;

  // ============ Title ============
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Análise de Conformidades', margin, y);
  y += 8;

  // ============ Metadata card (two columns) ============
  const metaH = 32;
  doc.setDrawColor(...C.border);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentW, metaH, 2, 2, 'FD');

  const col1X = margin + 5;
  const col2X = margin + contentW / 2 + 2;
  const rows: Array<[string, string, string, string]> = [
    ['Processo', analysis.processo || '—', 'Tipo', tipoLabel],
    ['Data', format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), 'Tempo', tempo],
    ['Analista', analystName, 'E-mail', analystEmail],
  ];
  doc.setFontSize(8);
  rows.forEach((r, i) => {
    const rowY = y + 7 + i * 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.muted);
    doc.text(r[0].toUpperCase(), col1X, rowY);
    doc.text(r[2].toUpperCase(), col2X, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.text);
    doc.setFontSize(10);
    doc.text(truncate(doc, r[1], contentW / 2 - 10), col1X, rowY + 4);
    doc.text(truncate(doc, r[3], contentW / 2 - 10), col2X, rowY + 4);
    doc.setFontSize(8);
  });
  y += metaH + 6;

  // ============ Gauge card ============
  const gaugeH = 22;
  const gaugeColor: RGB =
    conformidade >= 80 ? C.successText : conformidade >= 50 ? C.warnText : C.dangerText;
  doc.setDrawColor(...C.border);
  doc.setFillColor(...C.bg);
  doc.roundedRect(margin, y, contentW, gaugeH, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...C.text);
  doc.text('Conformidade Geral', margin + 5, y + 8);
  doc.setFontSize(16);
  doc.setTextColor(...gaugeColor);
  doc.text(`${conformidade.toFixed(1)}%`, pageW - margin - 5, y + 9, { align: 'right' });
  // bar
  const barX = margin + 5;
  const barY = y + 13;
  const barW = contentW - 10;
  const barH = 4;
  doc.setFillColor(...C.border);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');
  doc.setFillColor(...gaugeColor);
  doc.roundedRect(barX, barY, (barW * Math.max(0, Math.min(100, conformidade))) / 100, barH, 2, 2, 'F');
  y += gaugeH + 6;

  // ============ Indicator cards ============
  const cardData = [
    { label: 'Itens Avaliados', value: String(report.items.length), color: C.primary },
    { label: 'Conforme', value: String(report.totals.conforme), color: C.successText },
    { label: 'Parcial', value: String(report.totals.parcial), color: C.warnText },
    { label: 'Não Conforme', value: String(report.totals.nao_conforme), color: C.dangerText },
  ];
  const gap = 4;
  const cardW = (contentW - gap * 3) / 4;
  const cardH = 22;
  y = ensureSpace(doc, y, cardH + 6);
  cardData.forEach((c, i) => {
    const x = margin + i * (cardW + gap);
    doc.setDrawColor(...C.border);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');
    doc.setFillColor(...c.color);
    doc.rect(x, y, 2.5, cardH, 'F');
    doc.setTextColor(...C.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(c.label.toUpperCase(), x + 6, y + 8);
    doc.setTextColor(...C.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(c.value, x + 6, y + 17);
  });
  y += cardH + 8;

  // ============ Executive summary ============
  const summaryText = report.resumoExecutivo || report.diagnostico;
  if (summaryText) {
    y = drawSection(doc, 'Resumo Executivo', margin, y, contentW);
    y = drawTextBlock(doc, summaryText, margin, y, contentW, C.bg);
  }

  // Strengths / weaknesses side-by-side
  if (report.pontosFortes.length || report.ausenciasCriticas.length) {
    y = ensureSpace(doc, y, 30);
    const colW = (contentW - 4) / 2;
    const startY = y;
    let leftB = y, rightB = y;
    if (report.pontosFortes.length) {
      leftB = drawBulletCard(doc, 'Pontos Fortes', report.pontosFortes, margin, y, colW, C.successText);
    }
    if (report.ausenciasCriticas.length) {
      rightB = drawBulletCard(doc, 'Ausências Críticas', report.ausenciasCriticas, margin + colW + 4, y, colW, C.dangerText);
    }
    y = Math.max(leftB, rightB, startY) + 6;
  }

  // ============ Analysis table ============
  if (report.items.length > 0) {
    y = ensureSpace(doc, y, 30);
    y = drawSection(doc, 'Tabela de Análise', margin, y, contentW);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      tableWidth: contentW,
      head: [['Item', 'Elemento Avaliado', 'Situação', 'Observações / Evidências']],
      body: report.items.map((it) => [
        it.codigo,
        it.elemento,
        situacaoStyle(it.situacao).label,
        [it.observacao, it.recomendacao].filter(Boolean).join('\n\n') || '—',
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 3,
        valign: 'top',
        overflow: 'linebreak',
        lineColor: C.border as any,
        lineWidth: 0.2,
        textColor: C.text as any,
      },
      headStyles: {
        fillColor: C.navy as any,
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'left',
        cellPadding: 3.5,
      },
      alternateRowStyles: { fillColor: [250, 251, 253] as any },
      columnStyles: {
        0: { cellWidth: 16, fontStyle: 'bold', halign: 'left' },
        1: { cellWidth: 60 },
        2: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 'auto' },
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const item = report.items[data.row.index];
          if (!item) return;
          if (data.column.index === 2) {
            const s = situacaoStyle(item.situacao);
            data.cell.styles.fillColor = s.bg as any;
            data.cell.styles.textColor = s.fg as any;
          }
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ============ Recommendations ============
  if (report.recomendacoes.length > 0) {
    y = ensureSpace(doc, y, 20);
    y = drawSection(doc, 'Recomendações da Auditoria', margin, y, contentW);
    doc.setTextColor(...C.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    report.recomendacoes.forEach((r, i) => {
      const lines: string[] = doc.splitTextToSize(`${i + 1}. ${r}`, contentW - 4);
      y = ensureSpace(doc, y, lines.length * 5 + 2);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5 + 2;
    });
    y += 4;
  }

  // ============ Conclusion ============
  if (report.parecerFinal || report.diagnostico) {
    y = ensureSpace(doc, y, 40);
    y = drawSection(doc, 'Conclusão Técnica', margin, y, contentW);
    const parecer = report.parecerFinal || report.diagnostico || '';
    const situacaoFinal = conformidade >= 80 ? 'Adequado' : conformidade >= 50 ? 'Adequado com Ressalvas' : 'Inadequado';
    const lines: string[] = doc.splitTextToSize(parecer, contentW - 8);
    const blockH = lines.length * 4.8 + 20;
    y = ensureSpace(doc, y, blockH);
    doc.setDrawColor(...C.primary);
    doc.setFillColor(...C.bg);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentW, blockH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.primary);
    doc.text(`${conformidade.toFixed(1)}%  •  ${situacaoFinal}`, margin + 4, y + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...C.text);
    doc.text(lines, margin + 4, y + 16);
    y += blockH + 4;
  }

  // ============ Footer ============
  const total = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.muted);
    doc.text(
      `Analista: ${analystName} (${analystShortId}) • Gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`,
      margin, pageH - 6,
    );
    doc.text(`Página ${i} de ${total}`, pageW - margin, pageH - 6, { align: 'right' });
  }

  const fileName = `Relatorio_${tipoLabel.replace(/\s+/g, '_')}_${(analysis.processo || 'sem-processo').replace(/[\/\\]/g, '_')}_${format(new Date(analysis.created_at), 'ddMMyyyy')}.pdf`;
  doc.save(fileName);
}

// ==== helpers ====
function ensureSpace(doc: any, y: number, needed: number): number {
  const pageH = doc.internal.pageSize.getHeight();
  if (y + needed > pageH - 18) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSection(doc: any, title: string, margin: number, y: number, contentW: number): number {
  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.navy);
  doc.text(title, margin, y);
  doc.setDrawColor(...C.primary);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 40, y + 1.5);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.line(margin + 42, y + 1.5, margin + contentW, y + 1.5);
  return y + 7;
}

function drawTextBlock(doc: any, text: string, margin: number, y: number, contentW: number, bg: RGB): number {
  const lines: string[] = doc.splitTextToSize(text, contentW - 8);
  const h = lines.length * 4.8 + 8;
  y = ensureSpace(doc, y, h + 4);
  doc.setFillColor(...bg);
  doc.setDrawColor(...C.border);
  doc.roundedRect(margin, y, contentW, h, 2, 2, 'FD');
  doc.setTextColor(...C.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(lines, margin + 4, y + 6);
  return y + h + 5;
}

function drawBulletCard(
  doc: any, title: string, items: string[], x: number, y: number, w: number, color: RGB,
): number {
  const lineHeights = items.map((it) => (doc.splitTextToSize(`• ${it}`, w - 10) as string[]).length * 4.5);
  const h = 12 + lineHeights.reduce((a, b) => a + b + 1.5, 0);
  doc.setDrawColor(...C.border);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  doc.setFillColor(...color);
  doc.rect(x, y, 2.5, h, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...color);
  doc.text(title.toUpperCase(), x + 6, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.text);
  let cy = y + 12;
  items.forEach((it) => {
    const lines: string[] = doc.splitTextToSize(`• ${it}`, w - 10);
    doc.text(lines, x + 6, cy);
    cy += lines.length * 4.5 + 1.5;
  });
  return y + h;
}

function truncate(doc: any, text: string, maxW: number): string {
  if (!text) return '—';
  if (doc.getTextWidth(text) <= maxW) return text;
  let t = text;
  while (t.length > 3 && doc.getTextWidth(t + '…') > maxW) t = t.slice(0, -1);
  return t + '…';
}

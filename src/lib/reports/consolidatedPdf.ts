import jsPDF from 'jspdf';
import { getDocumentTypeById } from '@/lib/documentTypes';
import type { ProcessGroup, Analysis } from './groupAnalysesByProcess';

function sanitizeFilename(s: string): string {
  return s.replace(/[\\/:*?"<>|\s]+/g, '-').replace(/^-+|-+$/g, '') || 'processo';
}

export function htmlToReadableText(html: string): string {
  if (typeof document === 'undefined') {
    return html
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<\s*br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  const container = document.createElement('div');
  container.innerHTML = html;
  container.querySelectorAll('style, script, head').forEach((el) => el.remove());
  container
    .querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, tr, br')
    .forEach((el) => el.appendChild(document.createTextNode('\n')));
  container.querySelectorAll('li').forEach((el) => {
    el.insertBefore(document.createTextNode('• '), el.firstChild);
  });
  const text = container.textContent || '';
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function avgConformidade(success: Analysis[]): number {
  if (!success.length) return 0;
  return success.reduce((sum, a) => sum + (a.conformidade_percentual || 0), 0) / success.length;
}

export function exportConsolidatedProcessPDF(group: ProcessGroup): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const checkPage = (needed = 20) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFillColor(46, 32, 110);
  doc.rect(0, 0, pageWidth, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Relatório Consolidado - Processo ${group.processo}`, margin, 35);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margin, 55);
  y = 100;

  // Resumo
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Processo', margin, y);
  y += 20;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const resumo = [
    `Conformidade Média: ${avgConformidade(group.success).toFixed(1)}%`,
    `Análises Concluídas: ${group.success.length} de ${group.all.length}`,
    `Documentos Pendentes: ${group.pending.length}`,
  ];
  for (const line of resumo) {
    checkPage(16);
    doc.text(line, margin, y);
    y += 16;
  }
  y += 10;

  // Seções por análise success (ordem: tipo asc, data desc)
  const ordered = [...group.success].sort((a, b) => {
    const t = a.tipo_documento.localeCompare(b.tipo_documento);
    return t !== 0 ? t : (b.created_at > a.created_at ? 1 : -1);
  });

  if (ordered.length === 0) {
    checkPage(16);
    doc.setFont('helvetica', 'italic');
    doc.text('Nenhuma análise concluída para este processo.', margin, y);
  }

  for (const a of ordered) {
    checkPage(40);
    const docType = getDocumentTypeById(a.tipo_documento);
    const name = docType?.name || a.tipo_documento;
    const dataStr = new Date(a.completed_at || a.created_at).toLocaleDateString('pt-BR');
    const conf =
      a.conformidade_percentual !== null
        ? `${a.conformidade_percentual.toFixed(1)}%`
        : '—';

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${name} — ${dataStr} — ${conf}`, margin, y);
    y += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const html = a.relatorio_html?.trim();
    const text =
      (html ? htmlToReadableText(html) : '') ||
      a.relatorio_texto?.trim() ||
      '[Conteúdo indisponível]';
    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    for (const line of lines) {
      checkPage(14);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 10;
  }

  // Footer numerado
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `SIAC © ${new Date().getFullYear()} - Página ${i}/${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' },
    );
  }

  const date = new Date().toISOString().split('T')[0];
  doc.save(`consolidado-processo-${sanitizeFilename(group.processo)}-${date}.pdf`);
}

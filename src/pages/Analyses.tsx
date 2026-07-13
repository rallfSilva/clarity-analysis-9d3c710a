import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, Download, Trash2, Filter, Loader2 } from 'lucide-react';
import { AnalysisProgress } from '@/components/AnalysisProgress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface Analysis {
  id: string;
  processo: string;
  tipo_documento: string;
  status: string;
  conformidade_percentual: number | null;
  created_at: string;
  completed_at: string | null;
  relatorio_html: string | null;
  user_id: string;
}

export default function Analyses() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchAnalyses();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('analyses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyses',
          filter: isAdmin ? undefined : `user_id=eq.${user?.id}`,
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  useEffect(() => {
    const filtered = analyses.filter((analysis) =>
      analysis.processo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.tipo_documento.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAnalyses(filtered);
  }, [searchTerm, analyses]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as análises',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!analysisToDelete) return;

    try {
      const { error } = await supabase
        .from('analyses')
        .delete()
        .eq('id', analysisToDelete);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Análise excluída com sucesso',
      });

      fetchAnalyses();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a análise',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const handleDownloadReport = async (analysis: Analysis) => {
    setDownloadingId(analysis.id);

    try {
      toast({ title: 'Gerando PDF', description: 'Por favor aguarde...' });

      // Fetch analyst profile for traceability
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, email')
        .eq('id', analysis.user_id)
        .maybeSingle();

      const analystName = profile?.name || 'Analista não identificado';
      const analystEmail = profile?.email || '—';
      const analystShortId = analysis.user_id.slice(0, 8);

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = margin;

      const ensureSpace = (needed = 8) => {
        if (y + needed > pageHeight - margin - 10) {
          doc.addPage();
          y = margin;
        }
      };

      const drawSection = (title: string) => {
        ensureSpace(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(29, 78, 216);
        doc.text(title, margin, y);
        y += 2;
        doc.setDrawColor(29, 78, 216);
        doc.setLineWidth(0.3);
        doc.line(margin, y + 1, pageWidth - margin, y + 1);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      };

      const writeLine = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        doc.setFontSize(opts.size ?? 10);
        const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
        lines.forEach((line: string) => {
          ensureSpace(6);
          doc.text(line, margin, y);
          y += 5;
        });
      };

      // Institutional header
      doc.setFillColor(11, 31, 77);
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('SIAC-SELC', margin, 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Relatório de Análise de Conformidade', margin, 20);
      doc.text('Lei nº 14.133/2021', pageWidth - margin, 20, { align: 'right' });
      y = 38;

      // 1. Identificação
      drawSection('1. Identificação');
      writeLine(`Processo: ${analysis.processo || 'N/A'}`);
      writeLine(`Tipo de documento: ${analysis.tipo_documento}`);
      writeLine(
        `Data da análise: ${format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
      );
      writeLine(
        `Relatório gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
      );
      y += 2;
      writeLine('Analista responsável:', { bold: true });
      writeLine(`Nome: ${analystName}`);
      writeLine(`E-mail: ${analystEmail}`);
      writeLine(`ID: ${analystShortId}`);
      y += 4;

      // 2. Resumo Executivo
      drawSection('2. Resumo Executivo');
      const statusLabel: Record<string, string> = {
        success: 'Concluída',
        processing: 'Em processamento',
        pending: 'Pendente',
        error: 'Erro',
      };
      writeLine(`Status final: ${statusLabel[analysis.status] ?? analysis.status}`);
      if (analysis.conformidade_percentual !== null) {
        writeLine(`Conformidade geral: ${analysis.conformidade_percentual.toFixed(1)}%`, {
          bold: true,
          size: 12,
        });
      }
      y += 4;

      // 3. Análise Detalhada (extraída do HTML gerado pela IA)
      drawSection('3. Análise Detalhada');
      if (analysis.relatorio_html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = analysis.relatorio_html;
        const textContent = (tempDiv.textContent || tempDiv.innerText || '').trim();
        writeLine(textContent);
      } else {
        writeLine('Relatório detalhado não disponível.');
      }

      // Footer with pagination and timestamp
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Analista: ${analystName} (${analystShortId}) • Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
          margin,
          pageHeight - 10
        );
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, {
          align: 'right',
        });
      }

      const fileName = `Analise_${analysis.tipo_documento.replace(/\s+/g, '_')}_${analysis.processo?.replace(/[\/\\]/g, '_') || 'Sem_Processo'}_${format(new Date(analysis.created_at), 'ddMMyyyy')}.pdf`;
      doc.save(fileName);

      toast({ title: 'Sucesso', description: 'Relatório baixado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
      processing: { label: 'Processando', className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
      success: { label: 'Concluída', className: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
      error: { label: 'Erro', className: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Análises</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie suas análises de conformidade
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por processo ou tipo de documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conformidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnalyses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma análise encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredAnalyses.flatMap((analysis) => [
                <TableRow key={analysis.id}>
                  <TableCell className="font-medium">
                    {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{analysis.processo}</TableCell>
                  <TableCell>{analysis.tipo_documento}</TableCell>
                  <TableCell>{getStatusBadge(analysis.status)}</TableCell>
                  <TableCell>
                    {analysis.conformidade_percentual !== null ? (
                      <div className="flex items-center gap-2">
                        <Progress value={analysis.conformidade_percentual} className="w-20" />
                        <span className="text-sm font-medium">
                          {analysis.conformidade_percentual.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {analysis.status === 'success' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            setSelectedAnalysis(analysis);
                            setSelectedAnalyst(null);
                            setReportDialogOpen(true);
                            const { data: p } = await supabase
                              .from('profiles')
                              .select('name, email')
                              .eq('id', analysis.user_id)
                              .maybeSingle();
                            if (p) setSelectedAnalyst({ name: p.name, email: p.email });
                          }}
                          title="Ver relatório"
                          aria-label={`Ver relatório da análise ${analysis.processo}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {analysis.status === 'success' && analysis.relatorio_html && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadReport(analysis)}
                          disabled={downloadingId === analysis.id}
                          title="Baixar relatório em PDF"
                          aria-label={`Baixar relatório da análise ${analysis.processo}`}
                        >
                          {downloadingId === analysis.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <Download className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAnalysisToDelete(analysis.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Excluir análise"
                        aria-label={`Excluir análise ${analysis.processo}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>,
                (analysis.status === 'pending' || analysis.status === 'processing') ? (
                  <TableRow key={`${analysis.id}-progress`}>
                    <TableCell colSpan={6} className="bg-muted/30">
                      <AnalysisProgress
                        step={analysis.status === 'processing' ? 3 : 2}
                        label={
                          analysis.status === 'processing'
                            ? 'IA analisando o documento…'
                            : 'Aguardando início do processamento…'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : null,
              ])
            )}
          </TableBody>
        </Table>
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Relatório de Análise</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4 text-sm">
              <p className="font-semibold text-foreground mb-2">Analista responsável</p>
              <div className="grid gap-1 sm:grid-cols-2 text-muted-foreground">
                <p><span className="font-medium text-foreground">Nome:</span> {selectedAnalyst?.name ?? '—'}</p>
                <p><span className="font-medium text-foreground">E-mail:</span> {selectedAnalyst?.email ?? '—'}</p>
                <p><span className="font-medium text-foreground">ID:</span> {selectedAnalysis.user_id.slice(0, 8)}</p>
                <p><span className="font-medium text-foreground">Gerado em:</span> {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
            </div>
          )}
          {selectedAnalysis?.relatorio_html && (
            <div dangerouslySetInnerHTML={{ __html: selectedAnalysis.relatorio_html }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
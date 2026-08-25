import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Eye, RefreshCw, Trash2, Filter, Loader2, Play, User as UserIcon } from 'lucide-react';
import { ReportView } from '@/components/reports/ReportView';
import { getDocumentTypeById } from '@/lib/documentTypes';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Analysis {
  id: string;
  processo: string;
  tipo_documento: string;
  status: string;
  conformidade_percentual: number | null;
  created_at: string;
  completed_at: string | null;
  relatorio_html: string | null;
  resultado_json: any;
  user_id: string;
  arquivo_url?: string;
}

interface ProfileLite {
  id: string;
  name: string | null;
  email: string | null;
}

export default function AllAnalyses() {
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<{ name: string; email: string } | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analysisToDelete, setAnalysisToDelete] = useState<string | null>(null);

  const fetchAll = async () => {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível carregar as análises', variant: 'destructive' });
      return;
    }
    const rows = (data || []) as Analysis[];
    setAnalyses(rows);

    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);
      const map: Record<string, ProfileLite> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(map);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAll();
      setLoading(false);
    })();

    // Realtime é best-effort (o self-hosted pode estar fora do ar); o
    // polling abaixo garante que a lista avance de qualquer forma.
    const channel = supabase
      .channel('all-analyses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analyses' }, () => {
        fetchAll();
      })
      .subscribe();

    const interval = setInterval(() => fetchAll(), 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return analyses;
    return analyses.filter((a) => {
      const p = profiles[a.user_id];
      return (
        a.processo?.toLowerCase().includes(q) ||
        a.tipo_documento?.toLowerCase().includes(q) ||
        p?.name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q)
      );
    });
  }, [analyses, profiles, searchTerm]);

  const pendingCount = useMemo(
    () => analyses.filter((a) => a.status === 'pending' || a.status === 'error').length,
    [analyses]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    toast({ title: 'Atualizado', description: 'Lista de análises atualizada.' });
  };

  const invokeAnalyze = async (id: string) => {
    const { error } = await supabase.functions.invoke('analyze-document', { body: { analysis_id: id } });
    if (error) throw error;
  };

  const handleReprocess = async (analysis: Analysis) => {
    setReprocessingId(analysis.id);
    try {
      await supabase.from('analyses').update({ status: 'pending', completed_at: null }).eq('id', analysis.id);
      await invokeAnalyze(analysis.id);
      toast({ title: 'Reprocessando', description: `Análise ${analysis.processo} enviada para reprocessamento.` });
      await fetchAll();
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Falha ao reprocessar a análise', variant: 'destructive' });
    } finally {
      setReprocessingId(null);
    }
  };

  const handleProcessPending = async () => {
    const pend = analyses.filter((a) => a.status === 'pending' || a.status === 'error');
    if (!pend.length) {
      toast({ title: 'Nada a processar', description: 'Não há análises pendentes.' });
      return;
    }
    setProcessing(true);
    toast({ title: 'Processando', description: `Enviando ${pend.length} análise(s) pendente(s)…` });
    let ok = 0;
    for (const a of pend) {
      try {
        await supabase.from('analyses').update({ status: 'pending' }).eq('id', a.id);
        await invokeAnalyze(a.id);
        ok++;
      } catch (e) {
        console.error('reprocess error', e);
      }
    }
    setProcessing(false);
    await fetchAll();
    toast({ title: 'Concluído', description: `${ok}/${pend.length} análise(s) enviadas com sucesso.` });
  };

  const handleDelete = async () => {
    if (!analysisToDelete) return;
    try {
      const { error } = await supabase.from('analyses').delete().eq('id', analysisToDelete);
      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Análise excluída com sucesso' });
      await fetchAll();
    } catch (e: any) {
      toast({ title: 'Erro', description: 'Não foi possível excluir a análise', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setAnalysisToDelete(null);
    }
  };

  const openReport = async (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    const p = profiles[analysis.user_id];
    setSelectedAnalyst(p ? { name: p.name || 'Analista', email: p.email || '—' } : null);
    setReportDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
      processing: { label: 'Processando', className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
      success: { label: 'Concluído', className: 'bg-primary/10 text-primary hover:bg-primary/20' },
      error: { label: 'Erro', className: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
    };
    const v = variants[status] || variants.pending;
    return <Badge className={v.className}>{v.label}</Badge>;
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
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Todas as Análises</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todas as análises de conformidade do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleProcessPending}
            disabled={processing || pendingCount === 0}
          >
            {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Processar{pendingCount > 0 ? ` (${pendingCount})` : ''}
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por processo, tipo de documento, usuário ou e-mail…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Processo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Conformidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhuma análise encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((analysis) => {
                const p = profiles[analysis.user_id];
                return (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(new Date(analysis.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{p?.name || '—'}</span>
                          {p?.email && <span className="text-xs text-muted-foreground">{p.email}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{analysis.processo}</TableCell>
                    <TableCell>{getDocumentTypeById(analysis.tipo_documento)?.shortName ?? analysis.tipo_documento}</TableCell>
                    <TableCell>{getStatusBadge(analysis.status)}</TableCell>
                    <TableCell>
                      {analysis.conformidade_percentual !== null
                        ? `${analysis.conformidade_percentual.toFixed(0)}%`
                        : <span className="text-sm text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openReport(analysis)}
                          disabled={analysis.status !== 'success'}
                          title="Ver relatório"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReprocess(analysis)}
                          disabled={reprocessingId === analysis.id}
                          title="Reprocessar"
                        >
                          {reprocessingId === analysis.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setAnalysisToDelete(analysis.id); setDeleteDialogOpen(true); }}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent data-print-area="analysis-details" className="max-w-6xl max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="sr-only">
            <DialogTitle>Relatório de Análise</DialogTitle>
          </DialogHeader>
          {selectedAnalysis && (
            <ReportView analysis={selectedAnalysis} analyst={selectedAnalyst} />
          )}
        </DialogContent>
      </Dialog>

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

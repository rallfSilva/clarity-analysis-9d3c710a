import { useEffect, useRef, useState } from 'react';
import { Upload, Download, Trash2, FileText, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Attachment {
  id: string;
  filename: string;
  storage_path: string;
  size_bytes: number;
  mime_type: string | null;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  promptId: string | null;
  promptLabel: string;
  onCountChange?: (promptId: string, count: number) => void;
}

const MAX_BYTES = 20 * 1024 * 1024;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PromptAttachmentsDialog({
  open,
  onOpenChange,
  promptId,
  promptLabel,
  onCountChange,
}: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && promptId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, promptId]);

  const load = async () => {
    if (!promptId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('prompt_attachments')
      .select('*')
      .eq('prompt_id', promptId)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setItems((data ?? []) as Attachment[]);
      onCountChange?.(promptId, (data ?? []).length);
    }
    setLoading(false);
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!promptId) return;
    const list = Array.from(files);
    if (!list.length) return;

    setUploading(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id ?? null;

    for (const file of list) {
      if (file.size > MAX_BYTES) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} excede 20 MB.`,
          variant: 'destructive',
        });
        continue;
      }
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${promptId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage
        .from('prompt-attachments')
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) {
        toast({ title: 'Erro no upload', description: upErr.message, variant: 'destructive' });
        continue;
      }
      const { error: insErr } = await supabase.from('prompt_attachments').insert({
        prompt_id: promptId,
        filename: file.name,
        storage_path: path,
        size_bytes: file.size,
        mime_type: file.type || null,
        uploaded_by: uid,
      });
      if (insErr) {
        toast({ title: 'Erro ao registrar', description: insErr.message, variant: 'destructive' });
        await supabase.storage.from('prompt-attachments').remove([path]);
      }
    }
    setUploading(false);
    await load();
  };

  const download = async (att: Attachment) => {
    const { data, error } = await supabase.storage
      .from('prompt-attachments')
      .createSignedUrl(att.storage_path, 60);
    if (error || !data) {
      toast({ title: 'Erro', description: error?.message ?? 'Não foi possível abrir o arquivo', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  const remove = async (att: Attachment) => {
    if (!confirm(`Remover "${att.filename}"?`)) return;
    const { error: dbErr } = await supabase.from('prompt_attachments').delete().eq('id', att.id);
    if (dbErr) {
      toast({ title: 'Erro', description: dbErr.message, variant: 'destructive' });
      return;
    }
    await supabase.storage.from('prompt-attachments').remove([att.storage_path]);
    toast({ title: 'Arquivo removido' });
    await load();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Arquivos de Referência</DialogTitle>
          <DialogDescription>
            Arquivos de referência para o prompt <span className="font-semibold text-foreground">{promptLabel}</span>. Estes arquivos serão consultados durante as análises.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Arquivos anexados ({items.length})</p>
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Carregando...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum arquivo anexado.</p>
              ) : (
                items.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
                  >
                    <div className="h-8 w-8 rounded flex items-center justify-center bg-red-50 text-red-600">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => download(att)}
                        className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline truncate"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{att.filename}</span>
                      </button>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(att.size_bytes)} • {format(new Date(att.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => download(att)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(att)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Adicionar arquivos</p>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border/60 bg-muted/20 hover:bg-muted/40'
              }`}
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-foreground">
                {uploading ? 'Enviando...' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, DOCX, XLSX, TXT ou imagens - máx. 20 MB por arquivo
              </p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

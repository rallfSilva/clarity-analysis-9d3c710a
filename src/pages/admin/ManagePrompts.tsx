import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, FileText, Pencil, Trash2, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Prompt {
  id: string;
  document_type: string;
  prompt_text: string;
  is_active: boolean;
  updated_at: string;
}

const DOC_TYPES = ['Análise de Risco', 'DFD', 'DFD do PCA', 'ETP', 'Nota Técnica', 'Termo de Referência'];

export default function ManagePrompts() {
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [form, setForm] = useState({ document_type: '', prompt_text: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Prompt | null>(null);

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('document_type');
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setPrompts(data as Prompt[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(
    () =>
      prompts.filter(
        (p) =>
          !search ||
          p.document_type.toLowerCase().includes(search.toLowerCase()) ||
          p.prompt_text.toLowerCase().includes(search.toLowerCase())
      ),
    [prompts, search]
  );

  const stats = useMemo(() => {
    const active = prompts.filter((p) => p.is_active).length;
    return { total: prompts.length, active, inactive: prompts.length - active };
  }, [prompts]);

  const openCreate = () => {
    setEditing(null);
    setForm({ document_type: '', prompt_text: '', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (p: Prompt) => {
    setEditing(p);
    setForm({ document_type: p.document_type, prompt_text: p.prompt_text, is_active: p.is_active });
    setDialogOpen(true);
  };

  const submit = async () => {
    if (!form.document_type || !form.prompt_text.trim()) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('prompts')
          .update({
            document_type: form.document_type,
            prompt_text: form.prompt_text,
            is_active: form.is_active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Prompt atualizado' });
      } else {
        const { error } = await supabase.from('prompts').insert({
          document_type: form.document_type,
          prompt_text: form.prompt_text,
          is_active: form.is_active,
        });
        if (error) throw error;
        toast({ title: 'Prompt criado' });
      }
      setDialogOpen(false);
      fetch();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Prompt) => {
    setPrompts((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_active: !p.is_active } : x)));
    const { error } = await supabase
      .from('prompts')
      .update({ is_active: !p.is_active })
      .eq('id', p.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      fetch();
    }
  };

  const remove = async () => {
    if (!toDelete) return;
    const { error } = await supabase.from('prompts').delete().eq('id', toDelete.id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Prompt removido' });
      setPrompts((prev) => prev.filter((x) => x.id !== toDelete.id));
    }
    setToDelete(null);
  };

  const kpis = [
    { label: 'Total de Prompts', value: stats.total, hint: 'Prompts cadastrados no sistema', color: 'text-foreground' },
    { label: 'Ativos', value: stats.active, hint: 'Sendo utilizados nas análises', color: 'text-emerald-600' },
    { label: 'Inativos', value: stats.inactive, hint: 'Não estão sendo utilizados', color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Prompts</h1>
          <p className="text-sm text-muted-foreground">
            Configure os prompts usados nas análises de documentos.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border/60">
            <CardContent className="p-5">
              <p className="text-xs font-medium text-muted-foreground">{k.label}</p>
              <p className={`text-3xl font-bold mt-2 ${k.color}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{k.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por tipo de documento ou texto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span>{filtered.length} prompt(s) encontrado(s)</span>
      </div>

      <Card className="border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de Documento</TableHead>
              <TableHead>Texto do Prompt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                  Nenhum prompt encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const words = p.prompt_text.split(/\s+/).length;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full font-medium">
                        {p.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm text-muted-foreground">{p.prompt_text}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                        <span className="text-sm text-muted-foreground">
                          {p.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(p.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <div className="relative">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                            {Math.min(words, 9) === 9 && words > 9 ? '9+' : words}
                          </span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setToDelete(p)}
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
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Prompt' : 'Novo Prompt'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize as informações do prompt.'
                : 'Crie um novo prompt para análise de documentos.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Select
                value={form.document_type}
                onValueChange={(v) => setForm({ ...form, document_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Texto do Prompt *</Label>
              <Textarea
                rows={7}
                placeholder="Digite o prompt que será usado para análise deste tipo de documento..."
                value={form.prompt_text}
                onChange={(e) => setForm({ ...form, prompt_text: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Este texto será usado como base para análise automatizada do documento.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Ativo</p>
                <p className="text-xs text-muted-foreground">
                  Quando desativado, este prompt não será usado nas análises.
                </p>
              </div>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving} className="bg-primary hover:bg-primary/90">
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o prompt de "{toDelete?.document_type}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

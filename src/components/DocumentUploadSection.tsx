import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SECRETARIAS } from '@/lib/secretarias';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnalyzedFilesList } from './AnalyzedFilesList';
import type { DocumentType } from '@/lib/documentContent';
import { FUNDAMENTACAO_JURIDICA } from '@/lib/documentContent';
import { Scale } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { AnalysisProgress, type AnalysisStep } from './AnalysisProgress';

interface DocumentUploadSectionProps {
  tipo: DocumentType;
  titulo: string;
  descricao: string;
  checklistItems: readonly string[];
}

export function DocumentUploadSection({
  tipo,
  titulo,
  descricao,
  checklistItems,
}: DocumentUploadSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processo, setProcesso] = useState('');
  const [secretaria, setSecretaria] = useState('');
  const [step, setStep] = useState<AnalysisStep>(0);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState(false);

  // Realtime tracking of the ongoing analysis
  useEffect(() => {
    if (!currentAnalysisId) return;
    const channel = supabase
      .channel(`analysis-${currentAnalysisId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'analyses', filter: `id=eq.${currentAnalysisId}` },
        (payload) => {
          const s = (payload.new as any).status;
          if (s === 'processing') setStep(3);
          if (s === 'success') setStep(4);
          if (s === 'error') setAnalysisError(true);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysisId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: 52428800, // 50MB
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !processo || !secretaria || !user) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setAnalysisError(false);
    setStep(0);
    setCurrentAnalysisId(null);

    try {
      // Step 1: upload file to storage
      setStep(0);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Step 2: create analysis record
      setStep(1);
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          processo,
          secretaria,
          tipo_documento: tipo,
          arquivo_url: urlData.publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setCurrentAnalysisId(analysis.id);

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'analysis_created',
        details: {
          analysis_id: analysis.id,
          processo,
          secretaria,
          tipo_documento: tipo,
        },
      });

      toast({
        title: 'Análise enviada!',
        description: 'Seu documento está sendo processado.',
      });

      navigate('/analyses');
    } catch (error: any) {
      console.error('Upload error:', error);
      setAnalysisError(true);
      toast({
        title: 'Erro no upload',
        description: error.message || 'Não foi possível enviar o arquivo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Informações sobre o documento */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {titulo}
          </CardTitle>
          <CardDescription className="text-base">{descricao}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Itens do Checklist:</p>
            <ul className="space-y-2">
              {checklistItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="my-6" />

          {/* Fundamentação Jurídica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                {FUNDAMENTACAO_JURIDICA.titulo}:
              </p>
              <ul className="space-y-2">
                {FUNDAMENTACAO_JURIDICA.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {FUNDAMENTACAO_JURIDICA.srp.titulo}:
              </p>
              <ul className="space-y-2">
                {FUNDAMENTACAO_JURIDICA.srp.items.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Upload */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Arquivo do Documento *</Label>
          <div
            {...getRootProps()}
            className={`mt-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : file
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <UploadIcon className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, DOCX ou XLSX (máx. 50MB)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="processo">Número do Processo *</Label>
          <Input
            id="processo"
            placeholder="Ex: SIAC-2025-0001"
            value={processo}
            onChange={(e) => setProcesso(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="secretaria">Secretaria Demandante *</Label>
          <Select value={secretaria} onValueChange={setSecretaria}>
            <SelectTrigger id="secretaria">
              <SelectValue placeholder="Selecione a secretaria" />
            </SelectTrigger>
            <SelectContent>
              {SECRETARIAS.map((s) => (
                <SelectItem key={s.sigla} value={s.sigla}>
                  {s.sigla} — {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={uploading || !file || !processo || !secretaria} size="lg">
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Enviar para Análise
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Indicador de progresso da análise em andamento */}
      {(uploading || currentAnalysisId) && (
        <AnalysisProgress
          step={step}
          error={analysisError}
          label={
            analysisError
              ? 'Erro no processamento'
              : step === 4
              ? 'Análise concluída — veja em "Minhas Análises"'
              : undefined
          }
        />
      )}



      {/* Lista de arquivos analisados */}
      <div className="pt-6 border-t border-border">
        <AnalyzedFilesList tipo={tipo} />
      </div>
    </div>
  );
}

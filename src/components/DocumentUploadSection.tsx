import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AnalyzedFilesList } from './AnalyzedFilesList';
import type { DocumentType } from '@/lib/documentContent';
import { FUNDAMENTACAO_JURIDICA } from '@/lib/documentContent';
import { Scale } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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

    if (!file || !processo || !user) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create analysis record
      const { data: analysis, error: insertError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          processo,
          tipo_documento: tipo,
          arquivo_url: urlData.publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Chamar webhook n8n
      const webhookUrl = 'http://localhost:5678/webhook/teste';
      try {
        const webhookPayload = {
          analysis_id: analysis.id,
          user_id: user.id,
          processo: processo,
          tipo_documento: tipo,
          arquivo_url: urlData.publicUrl,
          file_name: file.name,
          file_size: file.size,
          created_at: new Date().toISOString()
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });
        
        if (!webhookResponse.ok) {
          console.warn('Webhook n8n retornou erro:', webhookResponse.status);
        }
      } catch (webhookError) {
        console.warn('Erro ao chamar webhook n8n:', webhookError);
        // Não interrompe o fluxo principal
      }

      // Call edge function to process analysis
      const { error: functionError } = await supabase.functions.invoke('analyze-document', {
        body: { analysis_id: analysis.id },
      });

      if (functionError) {
        console.error('Error calling analyze function:', functionError);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'analysis_created',
        details: {
          analysis_id: analysis.id,
          processo,
          tipo_documento: tipo,
        },
      });

      toast({
        title: 'Análise iniciada!',
        description: 'Seu documento está sendo processado.',
      });

      // Reset form
      setFile(null);
      setProcesso('');
    } catch (error: any) {
      console.error('Upload error:', error);
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
            placeholder="Ex: SELC-2025-0001"
            value={processo}
            onChange={(e) => setProcesso(e.target.value)}
            required
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={uploading || !file || !processo} size="lg">
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

      {/* Lista de arquivos analisados */}
      <div className="pt-6 border-t border-border">
        <AnalyzedFilesList tipo={tipo} />
      </div>
    </div>
  );
}

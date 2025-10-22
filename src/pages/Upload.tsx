import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function Upload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processo, setProcesso] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');

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

    if (!file || !processo || !tipoDocumento || !user) {
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
          tipo_documento: tipoDocumento,
          arquivo_url: urlData.publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to process analysis
      const { error: functionError } = await supabase.functions.invoke('analyze-document', {
        body: { analysis_id: analysis.id },
      });

      if (functionError) {
        console.error('Error calling analyze function:', functionError);
        // Don't throw - let it process in background
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'analysis_created',
        details: {
          analysis_id: analysis.id,
          processo,
          tipo_documento: tipoDocumento,
        },
      });

      toast({
        title: 'Análise iniciada!',
        description: 'Seu documento está sendo processado.',
        action: (
          <Button size="sm" variant="outline" onClick={() => navigate('/analyses')}>
            Ver análises
          </Button>
        ),
      });

      navigate('/analyses');
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Nova Análise</h1>
        <p className="text-muted-foreground">
          Faça upload de um documento para análise de conformidade
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Upload Area */}
        <div>
          <Label>Arquivo do Documento *</Label>
          <div
            {...getRootProps()}
            className={`mt-2 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-primary bg-primary/5 scale-[1.02]'
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
                <Button type="button" variant="outline" size="sm" onClick={() => setFile(null)}>
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

        {/* Metadata Form */}
        <div className="grid gap-6 md:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Documento *</Label>
            <Select value={tipoDocumento} onValueChange={setTipoDocumento} required>
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETP">Estudo Técnico Preliminar (ETP)</SelectItem>
                <SelectItem value="Edital">Edital</SelectItem>
                <SelectItem value="Termo de Referência">Termo de Referência</SelectItem>
                <SelectItem value="Contrato">Contrato</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/dashboard')}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={uploading || !file || !processo || !tipoDocumento}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Iniciar Análise
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
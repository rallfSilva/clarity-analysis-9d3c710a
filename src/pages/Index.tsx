import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FileCheck, Shield, Zap, BarChart } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse">
              <FileCheck className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Análise de Conformidade
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistema inteligente de análise de documentos licitatórios com IA.
            Garanta conformidade total dos seus processos.
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate('/auth')}
              className="text-lg px-8 py-6 shadow-[var(--shadow-elegant)] hover:scale-105 transition-all"
            >
              Começar Agora
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 bg-card rounded-xl shadow-[var(--shadow-card)] border border-border/50 hover:scale-105 transition-all">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Análise Rápida</h3>
              <p className="text-muted-foreground">
                Processe documentos em segundos com tecnologia de IA avançada
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl shadow-[var(--shadow-card)] border border-border/50 hover:scale-105 transition-all">
              <div className="p-3 rounded-full bg-accent/10 w-fit mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-2">Conformidade LGPD</h3>
              <p className="text-muted-foreground">
                Todos os dados protegidos e em conformidade com a legislação
              </p>
            </div>

            <div className="p-6 bg-card rounded-xl shadow-[var(--shadow-card)] border border-border/50 hover:scale-105 transition-all">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <BarChart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Relatórios Detalhados</h3>
              <p className="text-muted-foreground">
                Visualize métricas e exporte relatórios completos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

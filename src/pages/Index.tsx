import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import siacLogo from '@/assets/siac-logo.png';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const docs = [
    { code: 'ETP', name: 'Estudo Técnico Preliminar' },
    { code: 'TR', name: 'Termo de Referência' },
    { code: 'DFD', name: 'Doc. de Formalização' },
    { code: 'NT', name: 'Nota Técnica' },
    { code: 'AR', name: 'Análise de Risco' },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Total Conformidade',
      desc: 'Verificação automática de itens obrigatórios da Lei 14.133/2021 e orientações dos tribunais de contas.',
    },
    {
      icon: Zap,
      title: 'Agilidade Processual',
      desc: 'Reduza drasticamente o tempo de análises preliminares, eliminando gargalos em tarefas repetitivas.',
    },
    {
      icon: Lock,
      title: 'Proteção de Dados',
      desc: 'Infraestrutura em conformidade com a LGPD, com sigilo e rastreabilidade total das análises.',
    },
  ];

  const steps = [
    {
      n: '1',
      title: 'Upload e Triagem',
      desc: 'O sistema identifica o tipo documental e aplica o checklist específico de conformidade.',
    },
    {
      n: '2',
      title: 'Processamento por IA',
      desc: 'Análise profunda do texto e cruzamento com a base normativa atualizada.',
    },
    {
      n: '3',
      title: 'Emissão do Parecer',
      desc: 'Relatório de apontamentos com sugestões de correção imediatas e prontas para assinatura.',
    },
  ];

  return (
    <div className="w-full bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-20">
          <div className="flex flex-col items-center">
            <img src={siacLogo} alt="SIAC" className="h-11 w-auto object-contain" />
            <span className="text-[11px] font-semibold text-muted-foreground leading-tight">
              Sistema integrado de análise de Conformidades
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Funcionalidades</a>
            <a href="#docs" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documentos</a>
            <a href="#fluxo" className="hidden md:inline text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Como funciona</a>
            <Button onClick={() => navigate('/auth')} className="shadow-elegant">
              Acessar Sistema
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground pt-24 pb-40">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.35) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -right-32 top-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-primary-foreground/90 text-xs font-bold uppercase tracking-wider mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Atualizado para a Lei 14.133/2021
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight">
              Segurança Jurídica em{' '}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Tempo Real
              </span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-sidebar-foreground/75">
              A plataforma inteligente para análise automatizada de conformidade legal na
              administração pública. Otimize processos, mitigue riscos e garanta integridade
              institucional em cada artefato de planejamento.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="text-base font-bold px-8 py-6 shadow-elegant hover:-translate-y-0.5 transition-all"
              >
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById('fluxo')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base font-bold px-8 py-6 bg-transparent border-white/25 text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
              >
                Conhecer a Metodologia
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-sidebar-foreground/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Conformidade LGPD
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Auditoria completa
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Análise assistida por IA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating documents card */}
      <div id="docs" className="-mt-24 relative z-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="bg-card rounded-2xl shadow-elegant border border-border p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Documentos Suportados
                </p>
                <h3 className="mt-1 text-xl font-bold text-foreground">
                  Cinco artefatos de planejamento analisados de forma nativa
                </h3>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground hidden md:block" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {docs.map((d) => (
                <div
                  key={d.code}
                  className="group rounded-xl border border-border bg-background p-5 text-center transition-all hover:border-primary hover:shadow-card hover:-translate-y-0.5"
                >
                  <div className="text-2xl font-black tracking-tight text-primary group-hover:scale-105 transition-transform">
                    {d.code}
                  </div>
                  <div className="mt-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {d.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Excelência técnica
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Uma nova geração de análise de conformidade
            </h2>
            <p className="mt-4 text-muted-foreground">
              O SIAC utiliza modelos avançados para validar cada etapa do fluxo administrativo
              seguindo rigorosamente a Nova Lei de Licitações.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-8 bg-card rounded-2xl border border-border hover:border-primary/40 hover:shadow-elegant transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                  <f.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow */}
      <section id="fluxo" className="bg-secondary/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
              Fluxo inteligente
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
              Do upload ao parecer, em três etapas
            </h2>
          </div>

          <div className="relative grid gap-12 lg:grid-cols-3">
            <div className="hidden lg:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/40 via-primary/20 to-primary/40" />
            {steps.map((s) => (
              <div key={s.n} className="relative bg-card rounded-2xl border border-border p-8 shadow-card">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-black shadow-elegant">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-sidebar px-8 py-16 md:py-20 text-center shadow-elegant">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-primary/40 blur-3xl" />

            <div className="relative z-10">
              <Sparkles className="h-8 w-8 text-primary-foreground/80 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary-foreground">
                Pronto para transformar sua gestão pública?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-primary-foreground/80">
                Junte-se aos órgãos que elevaram o padrão de suas análises de conformidade com o SIAC.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                variant="secondary"
                className="mt-10 px-10 py-6 text-base font-bold shadow-elegant hover:scale-105 transition-transform"
              >
                Acessar o Sistema
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src={siacLogo} alt="SIAC" className="h-8 w-auto object-contain" />
            <span className="text-xs font-bold tracking-widest text-muted-foreground">
              Sistema integrado de análise de Conformidades
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Sistema integrado de análise de Conformidades<br />
            SIAC © 2026 — Em conformidade com a LGPD e Lei 14.133/2021
          </p>
          <div className="flex gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary">Funcionalidades</a>
            <a href="#fluxo" className="hover:text-primary">Fluxo</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

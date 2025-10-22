import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileCheck, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "Senha obrigatória" })
});

const registerSchema = z.object({
  name: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100),
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  password: z.string()
    .min(10, { message: "Senha deve ter no mínimo 10 caracteres" })
    .regex(/[A-Z]/, { message: "Senha deve conter ao menos uma letra maiúscula" })
    .regex(/[0-9]/, { message: "Senha deve conter ao menos um número" }),
  confirmPassword: z.string(),
  consentLgpd: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos e a LGPD"
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"]
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    consentLgpd: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = loginSchema.parse(loginForm);
      const { error } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = registerSchema.parse(registerForm);
      const { error } = await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.name,
        validatedData.consentLgpd
      );

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('Este email já está cadastrado');
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      toast.success('Cadastro realizado! Você já pode fazer login.');
      setIsLogin(true);
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        consentLgpd: false
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-accent/20">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-[var(--shadow-elegant)] border border-border/50">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent">
            <FileCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Análise de Conformidade
          </h1>
          <p className="text-muted-foreground text-center">
            Sistema de análise de documentos licitatórios
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-primary hover:underline font-medium"
              >
                Cadastre-se
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="seu@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password">Senha</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="Min. 10 chars, 1 maiúscula, 1 número"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite a senha novamente"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                disabled={loading}
                className="transition-all focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent"
                checked={registerForm.consentLgpd}
                onCheckedChange={(checked) =>
                  setRegisterForm({ ...registerForm, consentLgpd: checked as boolean })
                }
                disabled={loading}
              />
              <label
                htmlFor="consent"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                Aceito os termos de uso e concordo com a política de privacidade e LGPD
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-primary hover:underline font-medium"
              >
                Faça login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
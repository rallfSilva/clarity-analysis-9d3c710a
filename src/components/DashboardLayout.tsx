import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Plus, Loader2, ChevronDown, LogOut, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const name =
    (user.user_metadata?.name as string) || user.email?.split('@')[0] || 'Gestor';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card flex items-center px-4 md:px-6 gap-3">
            <SidebarTrigger />
            <div className="ml-auto flex items-center gap-2 md:gap-4">
              <Button
                onClick={() => navigate('/upload/etp')}
                className="rounded-xl shadow-sm hidden sm:inline-flex"
              >
                <Plus className="h-4 w-4 mr-1.5" /> Nova Análise
              </Button>
              <button className="relative h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full bg-danger text-[10px] font-bold text-danger-foreground flex items-center justify-center">
                  3
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <p className="text-sm font-semibold leading-none text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAdmin ? 'Administrador' : 'Usuário'}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <SettingsIcon className="h-4 w-4 mr-2" /> Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <UserIcon className="h-4 w-4 mr-2" /> Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

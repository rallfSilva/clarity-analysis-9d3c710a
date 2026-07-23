import { Home, Upload, FileText, BarChart3, Settings, HelpCircle, LogOut, Shield, Users, FileSearch, ChevronDown, MessageSquare } from 'lucide-react';
import siacLogo from '@/assets/siac-logo.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const userItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Minhas Análises', url: '/analyses', icon: FileText },
  { title: 'Relatórios', url: '/reports', icon: BarChart3 },
];

const documentTypes = [
  { title: 'DFD', url: '/upload/dfd', icon: FileText },
  { title: 'DFD do PCA', url: '/upload/dfd-pca', icon: FileText },
  { title: 'ETP', url: '/upload/etp', icon: FileText },
  { title: 'Nota Técnica', url: '/upload/nota-tecnica', icon: FileText },
  { title: 'Análise de Risco', url: '/upload/analise-risco', icon: FileText },
  { title: 'Termo de Referência', url: '/upload/termo-referencia', icon: FileText },
];

const adminItems = [
  { title: 'Dashboard Admin', url: '/admin/dashboard', icon: Shield },
  { title: 'Gerenciar Usuários', url: '/admin/users', icon: Users },
  { title: 'Auditoria & Logs', url: '/admin/audit', icon: FileSearch },
];

const bottomItems = [
  { title: 'Configurações', url: '/settings', icon: Settings },
  { title: 'Ajuda', url: '/help', icon: HelpCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  
  const isUploadRoute = location.pathname.startsWith('/upload');
  const [isExpanded, setIsExpanded] = useState(isUploadRoute);

  useEffect(() => {
    setIsExpanded(isUploadRoute);
  }, [isUploadRoute]);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-sidebar-accent/50';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar">
        <div className="px-4 py-4 flex items-center justify-center">
          <img
            src={siacLogo}
            alt="SIAC"
            className={state === 'collapsed' ? 'h-12 w-12 object-contain' : 'h-32 w-full object-contain'}
          />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-white/50 uppercase">Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" end className={getNavCls}>
                    <Home className="h-5 w-5" />
                    {state !== 'collapsed' && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <Upload className="h-5 w-5" />
                      {state !== 'collapsed' && (
                        <>
                          <span className="flex-1 text-left">Nova Análise</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {state !== 'collapsed' && (
                    <CollapsibleContent className="space-y-1 pt-1">
                      {documentTypes.map((item) => (
                        <SidebarMenuButton key={item.title} asChild>
                          <NavLink to={item.url} end className={`pl-8 ${getNavCls({ isActive: location.pathname === item.url })}`}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      ))}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </SidebarMenuItem>

              {userItems.slice(1).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <Separator className="my-2" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.15em] text-white/50 uppercase">Administração</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} end className={getNavCls}>
                          <item.icon className="h-5 w-5" />
                          {state !== 'collapsed' && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls}>
                      <item.icon className="h-5 w-5" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => signOut()}>
                  <LogOut className="h-5 w-5" />
                  {state !== 'collapsed' && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
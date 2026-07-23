import { useState, useEffect, useMemo } from 'react';
import { Search, Users, UserCheck, ShieldCheck, Building2, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface UserProfile {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  role?: string;
  cpf?: string | null;
  secretaria?: string | null;
  matricula?: string | null;
}

export default function ManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles } = await supabase.from('profiles').select('*');

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.id)
            .maybeSingle();
          return {
            ...profile,
            role: roleData?.role || 'usuario',
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.cpf?.toLowerCase().includes(term) ||
        u.matricula?.toLowerCase().includes(term);
      const matchesType = typeFilter === 'all' || u.role === typeFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, searchTerm, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const secretarias = new Set(
      users.map((u) => u.secretaria).filter((s): s is string => !!s)
    ).size;
    return {
      total,
      active,
      activePct: total ? Math.round((active / total) * 100) : 0,
      admins,
      secretarias,
    };
  }, [users]);

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);
      if (error) throw error;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
      toast({
        title: 'Status atualizado',
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status do usuário',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
      if (error) throw error;
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      toast({ title: 'Usuário removido', description: userToDelete.name });
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover o usuário',
        variant: 'destructive',
      });
    } finally {
      setUserToDelete(null);
    }
  };

  const kpis = [
    {
      label: 'Total de Usuários',
      value: stats.total,
      hint: 'Usuários cadastrados',
      Icon: Users,
    },
    {
      label: 'Usuários Ativos',
      value: stats.active,
      hint: `${stats.activePct}% do total`,
      Icon: UserCheck,
    },
    {
      label: 'Administradores',
      value: stats.admins,
      hint: 'Com acesso total',
      Icon: ShieldCheck,
    },
    {
      label: 'Secretarias',
      value: stats.secretarias,
      hint: 'Órgãos representados',
      Icon: Building2,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gerenciar Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Visualize, edite e gerencie os usuários do sistema.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, hint, Icon }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Todas as situações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{filteredUsers.length} usuário(s) encontrado(s)</span>
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Secretaria</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="font-semibold text-foreground">{user.name || 'Sem nome'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.cpf || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.secretaria || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{user.matricula || '-'}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1 rounded-full">
                        <ShieldCheck className="h-3 w-3" /> Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 rounded-full">
                        <Users className="h-3 w-3" /> Usuário
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => toggleUserStatus(user.id, user.is_active)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente {userToDelete?.name}. Não é possível desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

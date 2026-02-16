import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Users, X } from 'lucide-react';
import { usersApi, companiesApi, departmentsApi } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { getRoleLabel, getRoleBadgeVariant } from '@/lib/formatters';
import type { User, UserRole, Department } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'system_admin', label: 'System Admin' },
  { value: 'leader', label: 'Líder' },
];

export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('leader');
  const [formPhone, setFormPhone] = useState('');
  const [formCompanyIds, setFormCompanyIds] = useState<string[]>([]);
  const [formDepartmentIds, setFormDepartmentIds] = useState<string[]>([]);
  const [departmentsByCompany, setDepartmentsByCompany] = useState<Record<string, Department[]>>({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.getAll,
  });

  // Buscar departments quando empresas são selecionadas (apenas para finance_admin)
  useEffect(() => {
    const fetchDepartments = async () => {
      const newDepartmentsByCompany: Record<string, Department[]> = {};
      const companiesToFetch = formCompanyIds.filter(id => !departmentsByCompany[id]);
      
      // Buscar departments apenas para empresas novas
      for (const companyId of companiesToFetch) {
        try {
          const depts = await departmentsApi.getAll(companyId);
          newDepartmentsByCompany[companyId] = depts.filter(d => d.is_active);
        } catch (error) {
          console.error(`Erro ao buscar setores da empresa ${companyId}:`, error);
          newDepartmentsByCompany[companyId] = [];
        }
      }
      
      // Manter departments já carregados e adicionar novos
      const updatedDepartmentsByCompany = { ...departmentsByCompany, ...newDepartmentsByCompany };
      
      // Remover departments de empresas que não estão mais selecionadas
      const finalDepartmentsByCompany: Record<string, Department[]> = {};
      for (const companyId of formCompanyIds) {
        if (updatedDepartmentsByCompany[companyId]) {
          finalDepartmentsByCompany[companyId] = updatedDepartmentsByCompany[companyId];
        }
      }
      
      setDepartmentsByCompany(finalDepartmentsByCompany);
      
      // Remover departments de empresas que foram desmarcadas
      const validDepartmentIds = formDepartmentIds.filter(deptId => {
        return Object.values(finalDepartmentsByCompany).some(depts => 
          depts.some(d => d.id === deptId)
        );
      });
      if (validDepartmentIds.length !== formDepartmentIds.length) {
        setFormDepartmentIds(validDepartmentIds);
      }
    };

    // Apenas finance_admin precisa selecionar departamentos
    if (formCompanyIds.length > 0 && formRole === 'finance_admin') {
      fetchDepartments();
    } else {
      setDepartmentsByCompany({});
      setFormDepartmentIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formCompanyIds, formRole]);

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations'], exact: false });
      closeForm();
      toast({ title: 'Usuário criado com sucesso!' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations'], exact: false });
      closeForm();
      toast({ title: 'Usuário atualizado com sucesso!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations'], exact: false });
      setDeletingUser(null);
      toast({ title: 'Usuário removido com sucesso!' });
    },
  });

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('leader');
    setFormPhone('');
    setFormCompanyIds([]);
    setFormDepartmentIds([]);
    setDepartmentsByCompany({});
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('leader');
    setFormPhone('');
    setFormCompanyIds([]);
    setFormDepartmentIds([]);
    setDepartmentsByCompany({});
    setIsFormOpen(true);
  };

  const handleEdit = async (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormPhone(user.phone || '');
    const companyIds = user.companies?.map((c) => c.id) ?? [];
    setFormCompanyIds(companyIds);
    // Apenas finance_admin precisa de departments
    if (user.role === 'finance_admin') {
      setFormDepartmentIds(user.departments?.map((d) => d.id) ?? []);
      // Buscar departments das empresas do usuário
      if (companyIds.length > 0) {
        const deptsByCompany: Record<string, Department[]> = {};
        for (const companyId of companyIds) {
          try {
            const depts = await departmentsApi.getAll(companyId);
            deptsByCompany[companyId] = depts.filter(d => d.is_active);
          } catch (error) {
            console.error(`Erro ao buscar setores da empresa ${companyId}:`, error);
            deptsByCompany[companyId] = [];
          }
        }
        setDepartmentsByCompany(deptsByCompany);
      }
    } else {
      setFormDepartmentIds([]);
      setDepartmentsByCompany({});
    }
    
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formEmail.trim()) return;
    if (!editingUser && !formPassword.trim()) return;

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          name: formName,
          email: formEmail,
          role: formRole,
          phone: formPhone || undefined,
          company_ids: (formRole === 'leader' || formRole === 'finance_admin') ? formCompanyIds : undefined,
          department_ids: formRole === 'finance_admin' ? formDepartmentIds : undefined,
        },
      });
    } else {
      createMutation.mutate({
        name: formName,
        email: formEmail,
        password: formPassword,
        role: formRole,
        phone: formPhone || undefined,
        company_ids: (formRole === 'leader' || formRole === 'finance_admin') ? formCompanyIds : [],
        department_ids: formRole === 'finance_admin' ? formDepartmentIds : [],
      });
    }
  };

  const handleToggleStatus = (user: User) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canSubmit = formName.trim() && formEmail.trim() && (editingUser || formPassword.trim());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button onClick={handleCreate} className="nitro-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Nenhum usuário cadastrado</h3>
              <p className="text-muted-foreground mt-1">
                Comece criando seu primeiro usuário
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Perfil</TableHead>
                  <TableHead className="font-semibold">Empresas</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.companies?.length ? (
                          user.companies.map((c) => (
                            <Badge key={c.id} variant="outline" className="text-xs">
                              {c.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleStatus(user)}
                        />
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && closeForm()}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[min(70vh,400px)] space-y-4 py-4 pr-1">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="email@empresa.com"
              />
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role">Perfil *</Label>
              <Select
                value={formRole ?? 'leader'}
                onValueChange={(v) => {
                  const newRole = v as UserRole;
                  setFormRole(newRole);
                  if (newRole !== 'leader' && newRole !== 'finance_admin') {
                    setFormCompanyIds([]);
                    setFormDepartmentIds([]);
                    setDepartmentsByCompany({});
                  } else if (newRole === 'leader') {
                    // Limpar departments quando mudar para leader
                    setFormDepartmentIds([]);
                    setDepartmentsByCompany({});
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Empresas (escopo de atuação)</Label>
              {(formRole === 'leader' || formRole === 'finance_admin') ? (
                <div className="space-y-3">
                  <MultiSelect
                    placeholder="Selecione as empresas"
                    options={companies?.filter(c => c.is_active).map((c) => ({ value: c.id, label: c.name })) ?? []}
                    value={formCompanyIds}
                    onChange={setFormCompanyIds}
                  />
                  
                  {/* Lista de setores por empresa selecionada (apenas para finance_admin) */}
                  {formRole === 'finance_admin' && formCompanyIds.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t">
                      <Label className="text-sm font-medium">Setores por empresa:</Label>
                      {formCompanyIds.map((companyId) => {
                        const company = companies?.find(c => c.id === companyId);
                        const companyDepartments = departmentsByCompany[companyId] || [];
                        const selectedDeptIds = formDepartmentIds.filter(id => 
                          companyDepartments.some(d => d.id === id)
                        );
                        
                        return (
                          <div key={companyId} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold">{company?.name || 'Empresa'}</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  const newCompanyIds = formCompanyIds.filter(id => id !== companyId);
                                  setFormCompanyIds(newCompanyIds);
                                  // Remover departments dessa empresa
                                  const deptsToKeep = formDepartmentIds.filter(id =>
                                    !companyDepartments.some(d => d.id === id)
                                  );
                                  setFormDepartmentIds(deptsToKeep);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            {companyDepartments.length > 0 ? (
                              <div className="space-y-2 pl-2">
                                {companyDepartments.map((dept) => (
                                  <div key={dept.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`dept-${dept.id}`}
                                      checked={formDepartmentIds.includes(dept.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setFormDepartmentIds([...formDepartmentIds, dept.id]);
                                        } else {
                                          setFormDepartmentIds(formDepartmentIds.filter(id => id !== dept.id));
                                        }
                                      }}
                                    />
                                    <Label
                                      htmlFor={`dept-${dept.id}`}
                                      className="text-sm font-normal cursor-pointer"
                                    >
                                      {dept.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground pl-2">
                                Carregando setores...
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {formRole === 'leader' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      O líder terá acesso a todos os setores das empresas selecionadas.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Empresas se aplicam apenas aos perfis Líder e Finance Admin.
                  </p>
                  <div className="pointer-events-none opacity-60">
                    <MultiSelect
                      placeholder="Selecione as empresas"
                      options={companies?.filter(c => c.is_active).map((c) => ({ value: c.id, label: c.name })) ?? []}
                      value={[]}
                      onChange={() => {}}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="nitro-btn-primary"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{deletingUser?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

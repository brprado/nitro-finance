import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, FolderTree } from 'lucide-react';
import { departmentsApi, companiesApi } from '@/services/api';
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
import type { Department } from '@/types';

export default function DepartmentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterCompanyId, setFilterCompanyId] = useState<string | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [formName, setFormName] = useState('');
  const [formCompanyId, setFormCompanyId] = useState<string>('');

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', filterCompanyId],
    queryFn: () => departmentsApi.getAll(filterCompanyId),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsFormOpen(false);
      setFormName('');
      setFormCompanyId('');
      toast({ title: 'Setor criado com sucesso!' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) =>
      departmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setIsFormOpen(false);
      setEditingDepartment(null);
      setFormName('');
      setFormCompanyId('');
      toast({ title: 'Setor atualizado com sucesso!' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeletingDepartment(null);
      toast({ title: 'Setor removido com sucesso!' });
    },
  });

  const handleCreate = () => {
    setEditingDepartment(null);
    setFormName('');
    setFormCompanyId('');
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormName(department.name);
    setFormCompanyId(department.company_id);
    setIsFormOpen(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formCompanyId.trim()) return;

    if (editingDepartment) {
      updateMutation.mutate({
        id: editingDepartment.id,
        data: { name: formName, company_id: formCompanyId },
      });
    } else {
      createMutation.mutate({ name: formName, company_id: formCompanyId });
    }
  };

  const handleToggleStatus = (department: Department) => {
    updateMutation.mutate({
      id: department.id,
      data: { is_active: !department.is_active },
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Setores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os setores das empresas
          </p>
        </div>
        <Button onClick={handleCreate} className="nitro-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Setor
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <Select
            value={filterCompanyId ?? 'all'}
            onValueChange={(v) => setFilterCompanyId(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Filtrar por empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {companies?.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : departments?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderTree className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Nenhum setor cadastrado</h3>
              <p className="text-muted-foreground mt-1">
                Comece criando seu primeiro setor
              </p>
              <Button onClick={handleCreate} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Novo Setor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nome</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments?.map((department) => (
                  <TableRow key={department.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>{department.company?.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={department.is_active}
                          onCheckedChange={() => handleToggleStatus(department)}
                        />
                        <Badge variant={department.is_active ? 'default' : 'secondary'}>
                          {department.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(department)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingDepartment(department)}
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? 'Editar Setor' : 'Novo Setor'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Setor</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Tecnologia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select
                value={formCompanyId || ''}
                onValueChange={(v) => setFormCompanyId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies?.filter(c => c.is_active).map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formName.trim() || !formCompanyId.trim() || isSubmitting}
              className="nitro-btn-primary"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingDepartment ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDepartment} onOpenChange={() => setDeletingDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o setor "{deletingDepartment?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartment && deleteMutation.mutate(deletingDepartment.id)}
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

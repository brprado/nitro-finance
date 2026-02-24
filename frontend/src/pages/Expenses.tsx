import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Filter, MoreHorizontal, Eye, Pencil, XCircle, Loader2 } from 'lucide-react';
import { expensesApi, companiesApi, usersApi, categoriesApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getStatusLabel, getStatusBadgeVariant, getPeriodicityLabel, formatDate, formatDateTime, formatMonth } from '@/lib/formatters';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import type { Expense, ExpenseFilters, ExpenseStatus, ExpenseType } from '@/types';

const statusOptions: { value: ExpenseStatus; label: string }[] = [
  { value: 'active', label: 'Ativo' },
  { value: 'cancelled', label: 'Cancelado' },
];

const expenseTypeOptions: { value: ExpenseType; label: string }[] = [
  { value: 'recurring', label: 'Recorrente' },
  { value: 'one_time', label: 'Único' },
];

const PAGE_SIZE = 10;

function getPageNumbers(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 1) return [];
  const show = new Set<number>([1, total]);
  for (let d = -2; d <= 2; d++) {
    const p = current + d;
    if (p >= 1 && p <= total) show.add(p);
  }
  const sorted = Array.from(show).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push('ellipsis');
    result.push(sorted[i]);
  }
  return result;
}

export default function ExpensesPage() {
  const { isAdmin, isLeader, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [cancelExpense, setCancelExpense] = useState<Expense | null>(null);

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.getAll(filters),
  });

  const sortedExpenses = useMemo(() => {
    if (!expenses?.length) return expenses ?? [];
    return [...expenses].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [expenses]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil((sortedExpenses?.length ?? 0) / PAGE_SIZE);

  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedExpenses?.slice(start, start + PAGE_SIZE) ?? [];
  }, [sortedExpenses, currentPage]);

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: companiesApi.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
  });

  const { data: expenseDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['expense', viewingExpense?.id],
    queryFn: () => expensesApi.getById(viewingExpense!.id),
    enabled: !!viewingExpense?.id,
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, charged_this_month }: { id: string; charged_this_month: boolean }) =>
      expensesApi.cancel(id, { charged_this_month }),
    onSuccess: () => {
      setCancelExpense(null);
      queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations-history'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations-pending'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['validations-predicted'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false });
      toast({
        title: 'Despesa cancelada',
        description: 'A despesa foi cancelada com sucesso.',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Erro ao cancelar',
        description: 'Não foi possível cancelar a despesa.',
      });
    },
  });

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters =
    (filters.company_ids?.length ?? 0) > 0 ||
    (filters.owner_ids?.length ?? 0) > 0 ||
    (filters.category_ids?.length ?? 0) > 0 ||
    (filters.status?.length ?? 0) > 0 ||
    (filters.expense_type?.length ?? 0) > 0 ||
    (filters.service_name?.trim?.()?.length ?? 0) > 0;

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingExpense(null);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
    // Invalida todas as queries relacionadas para atualizar automaticamente
    queryClient.invalidateQueries({ queryKey: ['expenses'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['validations'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['validations-history'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['validations-pending'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['validations-predicted'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['dashboard'], exact: false });
    toast({
      title: editingExpense ? 'Despesa atualizada!' : 'Despesa criada!',
      description: 'A operação foi realizada com sucesso.',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as despesas e assinaturas da empresa
          </p>
        </div>
        <Button onClick={handleCreate} className="nitro-btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                placeholder="Buscar por nome..."
                value={filters.service_name ?? ''}
                onChange={(e) =>
                  setFilters({ ...filters, service_name: e.target.value || undefined })
                }
                className="h-9 w-[220px]"
              />
            </div>
            <MultiSelect
              label="Empresa"
              placeholder="Todas as empresas"
              options={
                (user?.role === 'leader' && user.companies
                  ? companies?.filter((c) => user.companies?.some((uc) => uc.id === c.id))
                  : companies
                )?.map((c) => ({ value: c.id, label: c.name })) ?? []
              }
              value={filters.company_ids ?? []}
              onChange={(company_ids) => setFilters({ ...filters, company_ids })}
            />
            <MultiSelect
              label="Responsável"
              placeholder="Todos os responsáveis"
              options={
                (user?.role === 'leader' && user
                  ? [user]
                  : users
                )?.map((u) => ({ value: u.id, label: u.name || u.email })) ?? []
              }
              value={filters.owner_ids ?? []}
              onChange={(owner_ids) => setFilters({ ...filters, owner_ids })}
            />
            <MultiSelect
              label="Categoria"
              placeholder="Todas as categorias"
              options={categories?.map((c) => ({ value: c.id, label: c.name })) ?? []}
              value={filters.category_ids ?? []}
              onChange={(category_ids) => setFilters({ ...filters, category_ids })}
            />
            <MultiSelect
              label="Status"
              placeholder="Todos os status"
              options={statusOptions}
              value={filters.status ?? []}
              onChange={(status) => setFilters({ ...filters, status })}
            />
            <MultiSelect
              label="Tipo"
              placeholder="Todos os tipos"
              options={expenseTypeOptions}
              value={filters.expense_type ?? []}
              onChange={(expense_type) => setFilters({ ...filters, expense_type })}
            />
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="shrink-0"
            >
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedExpenses?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-lg">Nenhuma despesa encontrada</h3>
              <p className="text-muted-foreground mt-1">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros'
                  : 'Comece criando sua primeira despesa'}
              </p>
              {isAdmin && !hasActiveFilters && (
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Despesa
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Serviço</TableHead>
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">Setor</TableHead>
                  <TableHead className="font-semibold">Responsável</TableHead>
                  <TableHead className="font-semibold text-right">Valor</TableHead>
                  <TableHead className="font-semibold">Tipo</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.map((expense) => (
                  <TableRow 
                    key={expense.id} 
                    className={`hover:bg-muted/50 transition-colors ${
                      expense.status === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <TableCell>
                      <span className="font-mono text-sm font-medium tabular-nums">{expense.code}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{expense.service_name}</p>
                        {expense.category?.name && (
                          <p className="text-sm text-muted-foreground">{expense.category.name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{expense.company?.name || 'N/A'}</span>
                          </TooltipTrigger>
                          {expense.company?.name && (
                            <TooltipContent>
                              <p>Empresa: {expense.company.name}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">{expense.department?.name || 'N/A'}</span>
                          </TooltipTrigger>
                          {expense.department?.name && (
                            <TooltipContent>
                              <p>Setor: {expense.department.name}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="space-y-1 cursor-help">
                              <p className="font-medium">{expense.owner?.name || expense.owner?.email || 'N/A'}</p>
                              {expense.owner?.name && expense.owner?.email && (
                                <p className="text-xs text-muted-foreground">{expense.owner.email}</p>
                              )}
                            </div>
                          </TooltipTrigger>
                          {expense.owner && (
                            <TooltipContent>
                              <div className="space-y-1">
                                {expense.owner.name && <p>Nome: {expense.owner.name}</p>}
                                {expense.owner.email && <p>Email: {expense.owner.email}</p>}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(expense.value, expense.currency)}
                      {expense.periodicity && (
                        <span className="text-xs text-muted-foreground block">
                          /{getPeriodicityLabel(expense.periodicity).toLowerCase()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {expense.expense_type === 'recurring' ? 'Recorrente' : 'Único'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusBadgeVariant(expense.status)}
                        className={expense.status === 'cancelled' ? 'opacity-75' : ''}
                      >
                        {getStatusLabel(expense.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingExpense(expense)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {isLeader && (
                            <DropdownMenuItem onClick={() => handleEdit(expense)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                          )}
                          {isAdmin && expense.status === 'active' && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setCancelExpense(expense)}
                              disabled={cancelMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Exibindo {Math.min((currentPage - 1) * PAGE_SIZE + 1, sortedExpenses?.length ?? 0)}–
            {Math.min(currentPage * PAGE_SIZE, sortedExpenses?.length ?? 0)} de{' '}
            {sortedExpenses?.length ?? 0} registros
          </p>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {getPageNumbers(totalPages, currentPage).map((item, i) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(item);
                      }}
                      isActive={currentPage === item}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                  }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>
              {editingExpense ? 'Editar Despesa' : 'Nova Despesa'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 pr-5">
            <ExpenseForm
              expense={editingExpense}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancelar despesa: pergunta "Já foi processada?" */}
      <Dialog open={!!cancelExpense} onOpenChange={(open) => !open && setCancelExpense(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar despesa</DialogTitle>
            <DialogDescription>
              Essa despesa já foi processada? O valor deste mês será contabilizado no dashboard apenas se você responder Sim.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                if (cancelExpense) {
                  cancelMutation.mutate({ id: cancelExpense.id, charged_this_month: false });
                }
              }}
              disabled={cancelMutation.isPending}
            >
              Não
            </Button>
            <Button
              onClick={() => {
                if (cancelExpense) {
                  cancelMutation.mutate({ id: cancelExpense.id, charged_this_month: true });
                }
              }}
              disabled={cancelMutation.isPending}
            >
              Sim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewingExpense} onOpenChange={() => {
        setViewingExpense(null);
        setShowPassword(false);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Despesa</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </div>
          ) : (expenseDetails || viewingExpense) ? (
            <div className="space-y-6">
              {(() => {
                const expense = expenseDetails || viewingExpense;
                return (
                  <>
                    {/* Informações Básicas */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Informações Básicas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Código</p>
                          <p className="font-mono font-medium">{expense.code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Serviço</p>
                          <p className="font-medium">{expense.service_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                          <Badge variant="outline">
                            {expense.expense_type === 'recurring' ? 'Recorrente' : 'Único'}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Categoria</p>
                          <p className="font-medium">{expense.category?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <Badge variant={getStatusBadgeVariant(expense.status)}>
                            {getStatusLabel(expense.status)}
                          </Badge>
                        </div>
                        {expense.description && (
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                            <p className="text-sm">{expense.description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Organização */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Organização</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Empresa</p>
                          <p className="font-medium">{expense.company?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Setor</p>
                          <p className="font-medium">{expense.department?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Responsável</p>
                          <div>
                            <p className="font-medium">{expense.owner?.name || expense.owner?.email || 'N/A'}</p>
                            {expense.owner?.name && expense.owner?.email && (
                              <p className="text-xs text-muted-foreground">{expense.owner.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Valores e Financeiro */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Valores e Financeiro</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Valor Original</p>
                          <p className="font-medium text-lg">{formatCurrency(expense.value, expense.currency)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Valor em BRL</p>
                          <p className="font-medium text-lg">{formatCurrency(expense.value_brl, 'BRL')}</p>
                        </div>
                        {expense.exchange_rate && (
                          <>
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Taxa de Câmbio</p>
                              <p className="font-medium">{typeof expense.exchange_rate === 'number' ? expense.exchange_rate.toFixed(4) : expense.exchange_rate}</p>
                            </div>
                            {expense.exchange_rate_date && (
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Data da Cotação</p>
                                <p className="font-medium">{formatDateTime(expense.exchange_rate_date)}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Recorrência e Pagamento */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Recorrência e Pagamento</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {expense.periodicity && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Periodicidade</p>
                            <p className="font-medium">{getPeriodicityLabel(expense.periodicity)}</p>
                          </div>
                        )}
                        {expense.renewal_date && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Data de Renovação</p>
                            <p className="font-medium">{formatDate(expense.renewal_date)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Método de Pagamento</p>
                          <p className="font-medium">
                            {expense.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                             expense.payment_method === 'debit_card' ? 'Cartão de Débito' :
                             expense.payment_method === 'boleto' ? 'Boleto' :
                             expense.payment_method === 'pix' ? 'PIX' :
                             expense.payment_method === 'transfer' ? 'Transferência' :
                             expense.payment_method}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Últimos 4 dígitos do cartão</p>
                          <p className="font-medium font-mono">
                            {expense.payment_identifier ? `**** ${expense.payment_identifier}` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes Adicionais */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Detalhes Adicionais</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {expense.contracted_plan && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Plano Contratado</p>
                            <p className="font-medium">{expense.contracted_plan}</p>
                          </div>
                        )}
                        {expense.user_count !== undefined && expense.user_count !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Número de Usuários</p>
                            <p className="font-medium">{expense.user_count}</p>
                          </div>
                        )}
                        {expense.evidence_link && (
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground mb-1">Link de Evidência</p>
                            <a 
                              href={expense.evidence_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-medium text-primary hover:underline break-all"
                            >
                              {expense.evidence_link}
                            </a>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Login</p>
                          <p className="font-medium">{expense.login || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Senha</p>
                          {expense.password ? (
                            <div className="flex items-center gap-2">
                              <p className="font-medium font-mono">
                                {showPassword ? expense.password : '••••••••'}
                              </p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="h-7 px-2 text-xs"
                              >
                                {showPassword ? 'Ocultar' : 'Mostrar'}
                              </Button>
                            </div>
                          ) : (
                            <p className="font-medium">N/A</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notas */}
                    {expense.notes && (
                      <div>
                        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Notas</h3>
                        <div className="bg-muted/50 rounded-md p-4">
                          <p className="text-sm whitespace-pre-wrap">{expense.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Histórico */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Histórico</h3>
                      <div className="space-y-3">
                        <p className="text-sm">
                          Criada em {formatDateTime(expense.created_at)}
                          {expense.created_by ? ` por ${expense.created_by.name}` : ''}.
                        </p>
                        {expense.validations && expense.validations.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {[...expense.validations]
                              .sort((a, b) => (a.validation_month || '').localeCompare(b.validation_month || ''))
                              .map((v, i) => {
                                const monthLabel = v.validation_month ? formatMonth(v.validation_month) : '';
                                const statusLabel = v.status === 'approved' ? 'Aprovada' : v.status === 'rejected' ? 'Rejeitada' : 'Pendente';
                                const byWho = v.validator?.name || 'N/A';
                                const when = v.validated_at ? formatDateTime(v.validated_at) : '';
                                return (
                                  <li key={i}>
                                    Mês {monthLabel}: {statusLabel} por {byWho}{when ? ` em ${when}` : ''}.
                                  </li>
                                );
                              })}
                          </ul>
                        )}
                        {expense.status === 'cancelled' && expense.cancelled_at && (
                          <p className="text-sm">
                            Cancelada em {formatDateTime(expense.cancelled_at)}
                            {expense.cancelled_by ? ` por ${expense.cancelled_by.name}` : ''}.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadados */}
                    <div>
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Metadados</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                          <p className="font-medium text-sm">{formatDateTime(expense.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Última Atualização</p>
                          <p className="font-medium text-sm">{formatDateTime(expense.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

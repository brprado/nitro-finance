import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  XCircle,
} from 'lucide-react';
import type { AlertType, Currency } from '@/types';

export function formatCurrency(value: number, currency: Currency = 'BRL'): string {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatMonth(monthString: string): string {
  const parts = monthString.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1] ?? '1', 10) - 1;
  const date = new Date(year, month);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativo',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    active: 'default',
    cancelled: 'destructive',
  };
  return variants[status] || 'secondary';
}

export function getAlertTypeIcon(type: AlertType): React.ElementType {
  const icons: Record<AlertType, React.ElementType> = {
    validation_pending: CheckCircle2,
    validation_overdue: AlertTriangle,
    renewal_upcoming: Calendar,
    renewal_due: Bell,
    expense_cancellation: XCircle,
  };
  return icons[type] || Bell;
}

export function getAlertTypeLabel(type: AlertType): string {
  const labels: Record<AlertType, string> = {
    validation_pending: 'Validação Pendente',
    validation_overdue: 'Validação Atrasada',
    renewal_upcoming: 'Renovação Próxima',
    renewal_due: 'Renovação no Prazo',
    expense_cancellation: 'Cancelamento',
  };
  return labels[type] || type;
}

export function getPeriodicityLabel(periodicity: string): string {
  const labels: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    semi_annual: 'Semestral',
    annual: 'Anual',
  };
  return labels[periodicity] || periodicity;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    finance_admin: 'Finance Admin',
    system_admin: 'System Admin',
    leader: 'Líder',
  };
  return labels[role] || role;
}

export function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' {
  if (role === 'finance_admin' || role === 'system_admin') return 'default';
  if (role === 'leader') return 'outline';
  return 'secondary';
}

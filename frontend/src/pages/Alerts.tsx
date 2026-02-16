import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Loader2, Inbox, ExternalLink, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDateTime, getAlertTypeIcon, getAlertTypeLabel } from '@/lib/formatters';
import type { AlertStatus } from '@/types';

export default function AlertsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', statusFilter],
    queryFn: () =>
      alertsApi.getMyAlerts(
        statusFilter === 'all' ? undefined : { status: statusFilter }
      ),
  });

  const markAsReadMutation = useMutation({
    mutationFn: alertsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast({ title: 'Alerta marcado como lido' });
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleGoToValidations = (alertId: string) => {
    markAsReadMutation.mutate(alertId, {
      onSuccess: () => {
        navigate('/validations');
      },
    });
  };

  const handleGoToExpenses = () => {
    navigate('/expenses');
  };

  const isRenewalAlert = (alertType: string) =>
    alertType === 'renewal_upcoming' || alertType === 'renewal_due';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe renovações e validações pendentes
          </p>
        </div>

        <Select
          value={statusFilter ?? 'all'}
          onValueChange={(v) => setStatusFilter(v as AlertStatus | 'all')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendentes</SelectItem>
            <SelectItem value="read">Lidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : alerts?.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-xl">Nenhum alerta encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {statusFilter === 'pending'
                ? 'Você não tem alertas pendentes.'
                : statusFilter === 'read'
                ? 'Você não tem alertas lidos.'
                : 'Você não tem alertas.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts?.map((alert) => {
            const AlertIcon = getAlertTypeIcon(alert.alert_type);
            const isPending = alert.status === 'pending';

            return (
              <Card
                key={alert.id}
                className={`transition-all ${
                  isPending ? 'border-warning/50 bg-warning-light/30' : ''
                }`}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div
                    className={`p-3 rounded-xl ${
                      isPending ? 'bg-warning/10' : 'bg-muted'
                    }`}
                  >
                    <AlertIcon
                      className={`h-5 w-5 ${
                        isPending ? 'text-warning' : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {alert.message}
                        </p>
                      </div>
                      <Badge
                        variant={isPending ? 'default' : 'secondary'}
                        className={isPending ? 'bg-warning text-warning-foreground' : ''}
                      >
                        {isPending ? 'Pendente' : 'Lido'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getAlertTypeLabel(alert.alert_type)}</span>
                        <span>•</span>
                        <span>{formatDateTime(alert.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && isRenewalAlert(alert.alert_type) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleGoToExpenses}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Ver despesa
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleGoToValidations(alert.id)}
                              disabled={
                                markAsReadMutation.isPending &&
                                markAsReadMutation.variables === alert.id
                              }
                            >
                              {markAsReadMutation.isPending &&
                              markAsReadMutation.variables === alert.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Validar
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {isPending && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(alert.id)}
                            disabled={
                              markAsReadMutation.isPending &&
                              markAsReadMutation.variables === alert.id
                            }
                          >
                            {markAsReadMutation.isPending &&
                            markAsReadMutation.variables === alert.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Marcar como lido
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

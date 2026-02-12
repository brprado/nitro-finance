import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { StatusDistributionItem, Currency } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface ExpenseAreaChartProps {
  data: StatusDistributionItem[];
  title?: string;
  currency?: Currency;
  exchangeRate?: number;
}

const chartConfig = {
  total_value: {
    label: 'Valor Total',
    color: 'hsl(var(--chart-1))',
  },
  count: {
    label: 'Quantidade',
    color: 'hsl(var(--chart-2))',
  },
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  in_review: 'Em Revisão',
  active: 'Ativa',
  cancellation_requested: 'Cancelamento Solicitado',
  cancelled: 'Cancelada',
  suspended: 'Suspensa',
  migrated: 'Migrada',
};

export function ExpenseAreaChart({ data, title, currency = 'BRL', exchangeRate = 5.50 }: ExpenseAreaChartProps) {
  const convertValue = (value: number): number => {
    if (currency === 'USD') {
      return value / exchangeRate;
    }
    return value;
  };

  const chartData = data.map((item) => ({
    status: statusLabels[item.status] || item.status,
    total_value: convertValue(item.total_value),
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <ChartContainer config={chartConfig} className="h-[300px]">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis tickFormatter={(value) => formatCurrency(value, currency)} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === 'total_value') {
                    return formatCurrency(Number(value), currency);
                  }
                  return value;
                }}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="total_value"
            stroke="hsl(var(--chart-1))"
            fill="hsl(var(--chart-1))"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

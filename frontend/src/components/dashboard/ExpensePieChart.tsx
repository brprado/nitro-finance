import { PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CategoryExpenseItem, Currency } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface ExpensePieChartProps {
  data: CategoryExpenseItem[];
  title?: string;
  currency?: Currency;
  exchangeRate?: number;
}

const CHART_PRIMARY = '#1DBA9B';

/** Cores contrastantes entre si para cada fatia do gráfico de pizza */
const COLORS = [
  CHART_PRIMARY,  /* teal */
  '#F59E0B',      /* amber */
  '#2563EB',      /* blue */
  '#DC2626',      /* red */
  '#7C3AED',      /* violet */
  '#0EA5E9',      /* sky */
  '#EC4899',      /* pink */
  '#10B981',      /* emerald */
];

const chartConfig = {
  total_value: {
    label: 'Valor',
    color: CHART_PRIMARY,
  },
};

export function ExpensePieChart({ data, title, currency = 'BRL', exchangeRate = 5.50 }: ExpensePieChartProps) {
  const convertValue = (value: number): number => {
    if (currency === 'USD') {
      return value / exchangeRate;
    }
    return value;
  };

  const chartData = data.map((item) => ({
    name: item.category_name,
    value: convertValue(Number(item.total_value)),
    percentage: Number(item.percentage) || 0,
  }));

  if (!chartData.length) {
    return (
      <div className="space-y-2">
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado para exibir
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <ChartContainer config={chartConfig} className="h-[300px]">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage, percent }: { name: string; percentage?: number; percent?: number }) =>
              `${name}: ${(percentage ?? percent ?? 0).toFixed(1)}%`
            }
            outerRadius={80}
            fill={CHART_PRIMARY}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
            }
          />
          <Legend />
        </PieChart>
      </ChartContainer>
    </div>
  );
}

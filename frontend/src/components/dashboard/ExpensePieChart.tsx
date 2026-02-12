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

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const chartConfig = {
  total_value: {
    label: 'Valor',
    color: 'hsl(var(--chart-1))',
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
    value: convertValue(item.total_value),
    percentage: item.percentage,
  }));

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
            label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
            outerRadius={80}
            fill="hsl(var(--chart-1))"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

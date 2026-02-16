import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/formatters';
import { Currency } from '@/types';

interface BarChartData {
  name: string;
  value: number;
  count?: number;
}

interface ExpenseBarChartProps {
  data: BarChartData[];
  title?: string;
  dataKey?: string;
  nameKey?: string;
  currency?: Currency;
  exchangeRate?: number;
}

const CHART_PRIMARY = '#1DBA9B';

const chartConfig = {
  value: {
    label: 'Valor',
    color: CHART_PRIMARY,
  },
};

export function ExpenseBarChart({ data, title, dataKey = 'value', nameKey = 'name', currency = 'BRL', exchangeRate = 5.50 }: ExpenseBarChartProps) {
  const convertValue = (value: number): number => {
    if (currency === 'USD') {
      return value / exchangeRate;
    }
    return value;
  };

  const chartData = data.map((item) => ({
    ...item,
    value: convertValue(item.value),
  }));

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <ChartContainer config={chartConfig} className="h-[300px]">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(value) => formatCurrency(value, currency)} />
          <YAxis
            type="category"
            dataKey={nameKey}
            width={120}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(Number(value), currency)}
              />
            }
          />
          <Bar dataKey={dataKey} fill={CHART_PRIMARY} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

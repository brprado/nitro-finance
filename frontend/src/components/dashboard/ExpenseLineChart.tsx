import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TimelineDataPoint, Currency } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface ExpenseLineChartProps {
  data: TimelineDataPoint[];
  title?: string;
  currency?: Currency;
  exchangeRate?: number;
}

const CHART_PRIMARY = '#1DBA9B';

const chartConfig = {
  total_value: {
    label: 'Valor Total',
    color: CHART_PRIMARY,
  },
};

export function ExpenseLineChart({ data, title, currency = 'BRL', exchangeRate = 5.50 }: ExpenseLineChartProps) {
  const convertValue = (value: number): number => {
    if (currency === 'USD') {
      return value / exchangeRate;
    }
    return value;
  };

  const chartData = data.map((item) => ({
    ...item,
    total_value: convertValue(item.total_value),
  }));

  return (
    <div className="space-y-2">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      <ChartContainer config={chartConfig} className="h-[300px]">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickFormatter={(value) => {
              const [year, month] = value.split('-');
              return `${month}/${year.slice(2)}`;
            }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value, currency)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(Number(value), currency)}
                labelFormatter={(label) => {
                  const [year, month] = label.split('-');
                  const monthNames = [
                    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                  ];
                  return `${monthNames[parseInt(month) - 1]}/${year}`;
                }}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="total_value"
            stroke={CHART_PRIMARY}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}

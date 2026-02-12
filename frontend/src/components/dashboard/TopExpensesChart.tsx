import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TopExpenseItem, Currency } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface TopExpensesChartProps {
  data: TopExpenseItem[];
  title?: string;
  currency?: Currency;
  exchangeRate?: number;
}

const chartConfig = {
  value_brl: {
    label: 'Valor (BRL)',
    color: 'hsl(var(--chart-1))',
  },
};

export function TopExpensesChart({ data, title, currency = 'BRL', exchangeRate = 5.50 }: TopExpensesChartProps) {
  const convertValue = (value: number): number => {
    if (currency === 'USD') {
      return value / exchangeRate;
    }
    return value;
  };

  const chartData = data.map((item) => ({
    name: item.service_name.length > 20 ? `${item.service_name.substring(0, 20)}...` : item.service_name,
    fullName: item.service_name,
    value_brl: convertValue(item.value_brl),
    category: item.category_name,
    company: item.company_name,
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
            dataKey="name"
            width={150}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name, props) => {
                  if (name === 'value_brl') {
                    return formatCurrency(Number(value), currency);
                  }
                  return value;
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="space-y-1">
                        <p className="font-semibold">{data.fullName}</p>
                        <p className="text-xs text-muted-foreground">{data.category}</p>
                        <p className="text-xs text-muted-foreground">{data.company}</p>
                      </div>
                    );
                  }
                  return label;
                }}
              />
            }
          />
          <Bar dataKey="value_brl" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

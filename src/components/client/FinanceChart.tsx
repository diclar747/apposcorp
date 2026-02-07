import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '@/lib/utils';

interface ChartData {
  name: string;
  value?: number;
  income?: number;
  expense?: number;
}

interface TransactionLike {
  amount: number;
  createdAt: string | Date;
}

interface FinanceChartProps {
  data?: ChartData[];
  transactions?: TransactionLike[];
  type?: 'area' | 'pie';
  title?: string;
  showPeriodSelector?: boolean;
  className?: string;
}

type Period = 'day' | 'week' | 'month' | 'year';

const periods: { value: Period; label: string }[] = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
];

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function buildChartData(txs: TransactionLike[], period: Period): ChartData[] {
  const now = new Date();

  switch (period) {
    case 'day': {
      const blocks = ['00h', '04h', '08h', '12h', '16h', '20h'];
      const data = blocks.map(name => ({ name, income: 0, expense: 0 }));
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      txs.forEach(t => {
        const txDate = new Date(t.createdAt);
        if (txDate >= dayAgo) {
          const blockIndex = Math.floor(txDate.getHours() / 4);
          if (t.amount > 0) data[blockIndex].income += t.amount;
          else data[blockIndex].expense += Math.abs(t.amount);
        }
      });
      return data;
    }
    case 'week': {
      const days: { date: Date; name: string; income: number; expense: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        days.push({
          date: d,
          name: d.toLocaleDateString('es-PY', { weekday: 'short' }).replace('.', ''),
          income: 0,
          expense: 0,
        });
      }
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      txs.forEach(t => {
        const txDate = new Date(t.createdAt);
        if (txDate >= weekAgo) {
          const dayIndex = days.findIndex(d => d.date.toDateString() === txDate.toDateString());
          if (dayIndex >= 0) {
            if (t.amount > 0) days[dayIndex].income += t.amount;
            else days[dayIndex].expense += Math.abs(t.amount);
          }
        }
      });
      return days.map(({ name, income, expense }) => ({ name, income, expense }));
    }
    case 'month': {
      const months: { year: number; month: number; name: string; income: number; expense: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          year: d.getFullYear(),
          month: d.getMonth(),
          name: d.toLocaleDateString('es-PY', { month: 'short' }).replace('.', ''),
          income: 0,
          expense: 0,
        });
      }
      txs.forEach(t => {
        const txDate = new Date(t.createdAt);
        const idx = months.findIndex(m => m.year === txDate.getFullYear() && m.month === txDate.getMonth());
        if (idx >= 0) {
          if (t.amount > 0) months[idx].income += t.amount;
          else months[idx].expense += Math.abs(t.amount);
        }
      });
      return months.map(({ name, income, expense }) => ({ name, income, expense }));
    }
    case 'year': {
      const years: { yearNum: number; name: string; income: number; expense: number }[] = [];
      for (let i = 3; i >= 0; i--) {
        years.push({
          yearNum: now.getFullYear() - i,
          name: String(now.getFullYear() - i),
          income: 0,
          expense: 0,
        });
      }
      txs.forEach(t => {
        const txDate = new Date(t.createdAt);
        const idx = years.findIndex(y => y.yearNum === txDate.getFullYear());
        if (idx >= 0) {
          if (t.amount > 0) years[idx].income += t.amount;
          else years[idx].expense += Math.abs(t.amount);
        }
      });
      return years.map(({ name, income, expense }) => ({ name, income, expense }));
    }
  }
}

export function FinanceChart({
  data,
  transactions,
  type = 'area',
  title,
  showPeriodSelector = true,
  className
}: FinanceChartProps) {
  const [period, setPeriod] = useState<Period>('month');

  const chartData = useMemo(() => {
    if (transactions && type === 'area') {
      return buildChartData(transactions, period);
    }
    return data || [];
  }, [transactions, data, period, type]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-lg border border-border">
          <p className="text-sm font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ₲ {entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `₲${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₲${(value / 1_000).toFixed(0)}k`;
    return `₲${value}`;
  };

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorIncome)"
                name="Ingresos"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorExpense)"
                name="Egresos"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('chart-container', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {title && <h3 className="font-semibold">{title}</h3>}

        {showPeriodSelector && (
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  period === p.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart */}
      <motion.div
        key={period}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {renderChart()}
      </motion.div>

      {/* Legend for Area Chart */}
      {type === 'area' && (
        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Ingresos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Egresos</span>
          </div>
        </div>
      )}

      {/* Legend for Pie Chart */}
      {type === 'pie' && (
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: pieColors[index % pieColors.length] }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Category chart with center text
export function CategoryChart({
  data,
  className
}: {
  data: ChartData[];
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  return (
    <div className={cn('chart-container flex flex-col items-center', className)}>
      <h3 className="font-semibold mb-4 self-start">Categorías</h3>

      <div className="relative">
        <ResponsiveContainer width={200} height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round((data[0]?.value || 0) / total * 100)}%</span>
          <span className="text-xs text-muted-foreground">Transacción</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: pieColors[index % pieColors.length] }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

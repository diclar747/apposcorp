import { useState } from 'react';
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

interface FinanceChartProps {
  data: ChartData[];
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

export function FinanceChart({ 
  data, 
  type = 'area',
  title,
  showPeriodSelector = true,
  className 
}: FinanceChartProps) {
  const [period, setPeriod] = useState<Period>('month');

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

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                tickFormatter={(value) => `₲${value/1000}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#3b82f6" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
                name="Saldo"
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {renderChart()}
      </motion.div>
      
      {/* Legend for Pie Chart */}
      {type === 'pie' && (
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

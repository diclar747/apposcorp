import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Home, CreditCard, PieChart as PieChartIcon, Target, Wallet
} from "lucide-react";
import { financesApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const ssCards = [
  { title: "Seiri", subtitle: "Clasificación", color: "bg-rose-500", icon: Target },
  { title: "Seiton", subtitle: "Orden", color: "bg-blue-500", icon: PieChartIcon },
  { title: "Seiso", subtitle: "Limpieza", color: "bg-emerald-500", icon: TrendingDown },
  { title: "Seiketsu", subtitle: "Estandarización", color: "bg-amber-500", icon: Wallet },
  { title: "Shitsuke", subtitle: "Disciplina", color: "bg-indigo-500", icon: Target },
];

export default function IngenioDashboard() {
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    assets: 0,
    liabilities: 0,
    netWorth: 0,
    netWorthGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await financesApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">Cargando tablero...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Finanzas Master</h1>
        <p className="text-slate-500 mt-1">Control absoluto sobre tu flujo de caja y patrimonio neto.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Net Worth Card */}
        <Card className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white border-none shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-indigo-200 font-medium tracking-wide">Patrimonio Neto Global</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black tracking-tight">{formatCurrency(summary.netWorth)}</span>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm ${summary.netWorthGrowth >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {summary.netWorthGrowth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {summary.netWorthGrowth.toFixed(1)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-1 opacity-80">
                  <Home className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium uppercase tracking-wider">Activos Totales</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(summary.assets)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1 opacity-80">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-medium uppercase tracking-wider">Pasivos Totales</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(summary.liabilities)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income / Expense Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
            <CardContent className="p-6 pl-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Ingresos del Mes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(summary.income)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-500" />
            <CardContent className="p-6 pl-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Egresos del Mes</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(summary.expenses)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Graph */}
        <Card className="lg:col-span-2 border-none shadow-md bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Flujo de Caja Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "Ingresos", valor: summary.income },
                  { name: "Gastos", valor: summary.expenses }
                ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#64748B", fontWeight: 600}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: "#94A3B8"}} tickFormatter={(val) => `₲${val / 1000}k`} />
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)}
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={80}>
                    {
                      [summary.income, summary.expenses].map((val, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "#F43F5E"} />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 5S */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white px-1">Fórmula 5S</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {ssCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 group hover:border-${card.color.split('-')[1]}-500 transition-colors`}>
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center text-white shadow-md transform group-hover:rotate-6 transition-transform`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{card.title}</h3>
                    <p className="text-xs text-slate-500">{card.subtitle}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

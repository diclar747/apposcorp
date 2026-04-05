import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { financesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Target, TrendingUp, TrendingDown, PieChart as PieChartIcon } from "lucide-react";

export default function IngenioBudget() {
  const [budget, setBudget] = useState({ incomeGoal: 0, expenseLimit: 0 });
  const [actuals, setActuals] = useState({ income: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ incomeGoal: '', expenseLimit: '' });

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const date = new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const data = await financesApi.getBudget(month, year);
      setBudget(data.budget);
      setActuals(data.actuals);
      setEditForm({
        incomeGoal: data.budget.incomeGoal.toString(),
        expenseLimit: data.budget.expenseLimit.toString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    try {
      const date = new Date();
      await financesApi.createBudget({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        incomeGoal: Number(editForm.incomeGoal),
        expenseLimit: Number(editForm.expenseLimit)
      });
      toast.success('Metas de presupuesto actualizadas');
      setIsEditing(false);
      fetchBudget();
    } catch (error) {
      toast.error('Error al guardar presupuesto');
    }
  };

  const incomeProgress = budget.incomeGoal > 0 ? (actuals.income / budget.incomeGoal) * 100 : 0;
  const expenseProgress = budget.expenseLimit > 0 ? (actuals.expenses / budget.expenseLimit) * 100 : 0;

  if (loading) return <div className="space-y-4">Cargando módulos de presupuesto...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Presupuesto y Metas</h1>
          <p className="text-slate-500 mt-1">Configura tus límites y revisa la viabilidad de tus metas</p>
        </div>
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <Target className="w-4 h-4 mr-2" /> Editar Metas Mensuales
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Configurar Mes Actual</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Meta de Ingresos Planificados</Label>
                <Input
                  type="number"
                  value={editForm.incomeGoal}
                  onChange={e => setEditForm({ ...editForm, incomeGoal: e.target.value })}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 h-12 text-lg font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-300">Límite de Gastos Permitidos</Label>
                <Input
                  type="number"
                  value={editForm.expenseLimit}
                  onChange={e => setEditForm({ ...editForm, expenseLimit: e.target.value })}
                  className="rounded-xl border-slate-200 focus:border-indigo-500 h-12 text-lg font-medium"
                />
              </div>
              <Button onClick={handleSaveBudget} className="w-full bg-indigo-600 h-12 rounded-xl text-base mt-2">Guardar Planificación</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metas Financieras */}
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" /> Rendimiento de Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Ingresos Obtenidos</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(actuals.income)} <span className="text-slate-400 font-normal">/ {formatCurrency(budget.incomeGoal)}</span>
                </span>
              </div>
              <Progress value={Math.min(incomeProgress, 100)} className="h-4 bg-slate-100 dark:bg-slate-800" />
              <p className="text-sm font-medium text-emerald-600 text-right">{incomeProgress.toFixed(1)}% de la meta lograda</p>
            </div>

            <div className="space-y-3 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Gastos Utilizados</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(actuals.expenses)} <span className="text-slate-400 font-normal">/ {formatCurrency(budget.expenseLimit)}</span>
                </span>
              </div>
              <Progress value={Math.min(expenseProgress, 100)} className="h-4 bg-slate-100 dark:bg-slate-800" />
              <p className={`text-sm font-medium text-right ${expenseProgress > 100 ? 'text-red-500' : 'text-sky-600'}`}>
                {expenseProgress.toFixed(1)}% del límite consumido
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Diagnóstico */}
        <Card className="border-none shadow-md bg-white dark:bg-slate-900 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-indigo-500" /> Diagnóstico de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Disponible para gastar', value: Math.max(0, budget.expenseLimit - actuals.expenses) },
                      { name: 'Dinero Gastado', value: actuals.expenses }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="#38BDF8" />
                    <Cell fill="#F43F5E" />
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-sm font-medium text-slate-500">Saldo Restante</span>
                <span className={`text-2xl font-black ${budget.expenseLimit - actuals.expenses < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                  {formatCurrency(Math.max(0, budget.expenseLimit - actuals.expenses))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

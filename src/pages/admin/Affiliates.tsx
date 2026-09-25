import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, Loader2, Download, CheckCircle2, XCircle, RefreshCw, Save, Ban, Play } from 'lucide-react';
import { toast } from 'sonner';
import { affiliatesApi } from '@/lib/api';
import { COMMISSION_STATUS_CLASSES, COMMISSION_STATUS_LABELS, resetAffiliateProgramCache } from '@/lib/affiliate';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const Loading = () => <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', year: '2-digit' });

const AFFILIATE_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Activo', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  suspended: { label: 'Suspendido', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function AdminAffiliates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6" />Afiliados</h1>
        <p className="text-muted-foreground">
          Comisión de afiliado: la paga la tienda a quien recomienda sus productos. Es distinta de la comisión de plataforma.
        </p>
      </div>
      <Tabs defaultValue="commissions">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="commissions">Comisiones</TabsTrigger>
          <TabsTrigger value="affiliates">Afiliados</TabsTrigger>
          <TabsTrigger value="payouts">Pagos</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
          <TabsTrigger value="stores">Tiendas y productos</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
        </TabsList>
        <TabsContent value="commissions" className="mt-4"><CommissionsTab /></TabsContent>
        <TabsContent value="affiliates" className="mt-4"><AffiliatesTab /></TabsContent>
        <TabsContent value="payouts" className="mt-4"><PayoutsTab /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsTab /></TabsContent>
        <TabsContent value="stores" className="mt-4"><StoresTab /></TabsContent>
        <TabsContent value="config" className="mt-4"><ConfigTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CommissionsTab() {
  const [status, setStatus] = useState<string>('pending');
  const [rows, setRows] = useState<any[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setRows(null);
    setSelected(new Set());
    try {
      setRows(await affiliatesApi.adminGetCommissions(status === 'all' ? undefined : status));
    } catch (e: any) {
      toast.error(e.message);
      setRows([]);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const actionable = (c: any) => ['pending', 'approved', 'paid'].includes(c.status);
  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const summarize = (results: { ok: boolean; reason?: string }[], verb: string) => {
    const ok = results.filter((r) => r.ok).length;
    const failed = results.filter((r) => !r.ok);
    if (ok) toast.success(`${ok} comisión(es) ${verb}`);
    if (failed.length) toast.warning(`${failed.length} no se pudieron procesar: ${[...new Set(failed.map((f) => f.reason))].join(', ')}`);
  };

  const approve = async () => {
    setBusy(true);
    try {
      const { results } = await affiliatesApi.adminApproveCommissions([...selected]);
      summarize(results, 'pagadas');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    const reason = window.prompt('Motivo de la cancelación (lo verá la tienda):', 'Cancelada por el administrador');
    if (reason === null) return;
    setBusy(true);
    try {
      const { results } = await affiliatesApi.adminCancelCommissions([...selected], reason);
      summarize(results, 'canceladas');
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const releaseNow = async () => {
    setBusy(true);
    try {
      const r = await affiliatesApi.adminReleaseNow();
      toast.success(`Liberación ejecutada: ${r.paid} pagadas de ${r.due} vencidas`);
      await load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const selectable = (rows || []).filter(actionable);
  const allSelected = selectable.length > 0 && selectable.every((c) => selected.has(c.id));

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0">
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(COMMISSION_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" onClick={load} aria-label="Recargar"><RefreshCw className="w-4 h-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={releaseNow} disabled={busy}><Play className="w-4 h-4 mr-1.5" />Liberar vencidas</Button>
          <Button size="sm" onClick={approve} disabled={busy || selected.size === 0}><CheckCircle2 className="w-4 h-4 mr-1.5" />Aprobar y pagar ({selected.size})</Button>
          <Button size="sm" variant="destructive" onClick={cancel} disabled={busy || selected.size === 0}><XCircle className="w-4 h-4 mr-1.5" />Cancelar ({selected.size})</Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {!rows ? <Loading /> : rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">No hay comisiones en este estado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(v) => setSelected(v ? new Set(selectable.map((c) => c.id)) : new Set())}
                    aria-label="Seleccionar todas"
                  />
                </TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Afiliado</TableHead>
                <TableHead>Tienda / producto</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {actionable(c) && <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} aria-label="Seleccionar" />}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{fmtDate(c.createdAt)}</TableCell>
                  <TableCell>
                    {c.affiliate.user.firstName} {c.affiliate.user.lastName}
                    <div className="font-mono text-[11px] text-muted-foreground">{c.affiliate.code}</div>
                  </TableCell>
                  <TableCell>
                    <div className="line-clamp-1">{c.productName}</div>
                    <div className="text-[11px] text-muted-foreground">{c.storeName} · enlace de {c.source === 'store' ? 'tienda' : 'producto'}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="font-mono text-xs">{c.order.orderNumber}</div>
                    <div className="text-[11px] text-muted-foreground">{c.order.status} · {c.order.paymentMethod === 'wallet' ? 'billetera' : 'contra entrega'}</div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatCurrency(c.amount)}
                    <div className="text-[11px] text-muted-foreground">{c.rate}% de {formatCurrency(c.baseAmount)}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', COMMISSION_STATUS_CLASSES[c.status])}>
                      {COMMISSION_STATUS_LABELS[c.status]}
                    </span>
                    {c.status === 'pending' && c.availableAt && <div className="text-[11px] text-muted-foreground mt-1">libera {fmtDate(c.availableAt)}</div>}
                    {c.note && <div className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">{c.note}</div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AffiliatesTab() {
  const [rows, setRows] = useState<any[] | null>(null);

  const load = useCallback(() => {
    affiliatesApi.adminGetAffiliates().then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: 'active' | 'suspended') => {
    try {
      await affiliatesApi.adminSetAffiliateStatus(id, status);
      toast.success(status === 'active' ? 'Afiliado activado' : 'Afiliado suspendido');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 overflow-x-auto">
        {!rows ? <Loading /> : rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Todavía no hay afiliados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="text-right">Clics</TableHead>
                <TableHead className="text-right">Generado</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.user.firstName} {a.user.lastName}
                    <div className="text-[11px] text-muted-foreground">{a.user.email} · desde {fmtDate(a.createdAt)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{a.code}</TableCell>
                  <TableCell className="text-right tabular-nums">{a.clicks}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(a.earnings.generated)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(a.earnings.paid.amount)}</TableCell>
                  <TableCell>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', AFFILIATE_STATUS[a.status]?.cls)}>{AFFILIATE_STATUS[a.status]?.label}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {a.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => setStatus(a.id, 'suspended')}><Ban className="w-3.5 h-3.5 mr-1" />Suspender</Button>
                    ) : (
                      <Button size="sm" onClick={() => setStatus(a.id, 'active')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Activar</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function PayoutsTab() {
  const [rows, setRows] = useState<any[] | null>(null);

  useEffect(() => {
    affiliatesApi.adminGetPayouts().then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  }, []);

  const exportCsv = async () => {
    try {
      const blob = await affiliatesApi.adminExportPayouts();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagos-afiliados-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const totals = useMemo(() => (rows || []).reduce(
    (acc, r) => ({ generated: acc.generated + r.generated, pending: acc.pending + r.pending, paid: acc.paid + r.paid }),
    { generated: 0, pending: 0, paid: 0 },
  ), [rows]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Pagos por afiliado</CardTitle>
          <CardDescription>Lo pagado ya está en su billetera; los retiros se aprueban en Retiros, como siempre.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1.5" />Exportar CSV</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {!rows ? <Loading /> : rows.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Sin datos todavía.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead className="text-right">Generado</TableHead>
                <TableHead className="text-right">Por cobrar</TableHead>
                <TableHead className="text-right">Pagado</TableHead>
                <TableHead className="text-right">Anulado</TableHead>
                <TableHead className="text-right">Saldo billetera</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.affiliateId}>
                  <TableCell>{r.name}<div className="font-mono text-[11px] text-muted-foreground">{r.code}</div></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.generated)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.pending)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.paid)}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(r.cancelled)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.walletBalance)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totals.generated)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totals.pending)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatCurrency(totals.paid)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function RankTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">Sin ventas en el período.</p> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.id ?? i}>
                  <TableCell className="max-w-[200px]"><span className="line-clamp-1">{i + 1}. {r.name}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.sales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(r.commission)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ReportsTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    affiliatesApi.adminGetReports(days).then(setData).catch((e) => toast.error(e.message));
  }, [days]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {[7, 30, 90, 365].map((d) => (
          <Button key={d} size="sm" variant={days === d ? 'secondary' : 'ghost'} onClick={() => { if (d !== days) { setData(null); setDays(d); } }}>{d === 365 ? '1 año' : `${d} días`}</Button>
        ))}
      </div>
      {!data ? <Loading /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['Ventas por afiliados', formatCurrency(data.totals.sales)],
              ['Comisiones generadas', formatCurrency(data.totals.commissions)],
              ['Productos vendidos', String(data.totals.items)],
              ['Clics', data.totals.clicks.toLocaleString('es-PY')],
            ].map(([label, value]) => (
              <Card key={label}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-black tabular-nums mt-1">{value}</p>
              </CardContent></Card>
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-4">
            <RankTable title="Mejores afiliados" rows={data.topAffiliates} />
            <RankTable title="Mejores tiendas" rows={data.topStores} />
            <RankTable title="Mejores productos" rows={data.topProducts} />
          </div>
        </>
      )}
    </div>
  );
}

function StoresTab() {
  const [rows, setRows] = useState<any[] | null>(null);

  const load = useCallback(() => {
    affiliatesApi.adminGetStores().then(setRows).catch((e) => { toast.error(e.message); setRows([]); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const blockStore = async (id: string, blocked: boolean) => {
    try { await affiliatesApi.adminBlockStore(id, blocked); load(); } catch (e: any) { toast.error(e.message); }
  };
  const blockProduct = async (id: string, blocked: boolean) => {
    try { await affiliatesApi.adminBlockProduct(id, blocked); load(); } catch (e: any) { toast.error(e.message); }
  };

  if (!rows) return <Loading />;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Apagar afiliados en una tienda o producto oculta los botones y deja de generar comisiones nuevas. Las ya generadas siguen su curso.</p>
      {rows.map((s) => (
        <Card key={s.id}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{s.storeName} <span className="font-mono text-xs text-muted-foreground">/tienda/{s.storeSlug}</span></p>
                <p className="text-xs text-muted-foreground">
                  {s.affiliateEnabled ? `Afiliados activos · general ${s.affiliateDefaultRate ?? '—'}% · ${s.affiliateAllProducts ? 'todos los productos' : 'productos elegidos'}` : 'La tienda no activó afiliados'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Label htmlFor={`block-${s.id}`}>Permitir</Label>
                <Switch id={`block-${s.id}`} checked={!s.affiliateBlocked} onCheckedChange={(v) => blockStore(s.id, !v)} />
              </div>
            </div>
            {s.products.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border">
                {s.products.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="line-clamp-1">{p.name}{p.status !== 'active' && <span className="text-muted-foreground"> (inactivo)</span>}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">{p.effectiveRate ? `${p.effectiveRate}%` : 'no participa'}</span>
                      <Switch checked={!p.affiliateBlocked} onCheckedChange={(v) => blockProduct(p.id, !v)} aria-label={`Permitir afiliados en ${p.name}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ConfigTab() {
  const [cfg, setCfg] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    affiliatesApi.adminGetConfig().then((d) => setCfg(d.config)).catch((e) => toast.error(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { config } = await affiliatesApi.adminUpdateConfig(cfg);
      setCfg(config);
      resetAffiliateProgramCache();
      toast.success('Configuración guardada');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!cfg) return <Loading />;

  const toggle = (field: string, label: string, hint: string) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <Label htmlFor={field}>{label}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={field} checked={!!cfg[field]} onCheckedChange={(v) => setCfg({ ...cfg, [field]: v })} />
    </div>
  );
  const number = (field: string, label: string, hint: string, suffix: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={field}>{label}</Label>
      <div className="relative">
        <Input id={field} type="number" min={0} value={cfg[field]} onChange={(e) => setCfg({ ...cfg, [field]: e.target.value })} className="pr-12" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className={cn('rounded-lg border p-4', cfg.enabled ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20')}>
          {toggle('enabled', 'Programa de afiliados activo', 'Apagado, todo funciona como antes: no hay botones, clics ni comisiones nuevas.')}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {number('minRate', '% mínimo', 'El menor % que puede fijar una tienda.', '%')}
          {number('maxRate', '% máximo', 'El mayor % que puede fijar una tienda.', '%')}
          {number('cookieDays', 'Ventana de atribución', 'Días que dura un clic (gana el último).', 'días')}
          {number('holdDays', 'Plazo de garantía', 'Días después de la entrega antes de liberar la comisión. 0 = al entregar.', 'días')}
        </div>
        <div className="divide-y divide-border">
          {toggle('autoApprove', 'Aprobar afiliados al instante', 'Si está apagado, cada nuevo afiliado queda pendiente hasta que lo actives.')}
          {toggle('autoRelease', 'Pagar comisiones automáticamente', 'Al vencer el plazo se acreditan solas. Si está apagado, quedan aprobadas hasta que las pagues.')}
          {toggle('codEnabled', 'El pago contra entrega genera comisión', 'Se descuenta de la billetera de la tienda al marcar "Entregado".')}
          {toggle('showRatePublic', 'Mostrar el % a todos', 'Si está apagado, solo lo ven los usuarios con sesión iniciada.')}
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Guardar configuración
        </Button>
      </CardContent>
    </Card>
  );
}

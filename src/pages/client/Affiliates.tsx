import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Search, Copy, MessageCircle, Loader2, Store, Package, TrendingUp, Wallet, ExternalLink } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { affiliatesApi } from '@/lib/api';
import { getAffiliateProgram, getVisitorId, COMMISSION_STATUS_LABELS, COMMISSION_STATUS_CLASSES, type AffiliateProgram } from '@/lib/affiliate';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromoteButton } from '@/components/affiliate/PromoteButton';

const shortDate = (d: string) => new Date(d).toLocaleDateString('es-PY', { day: 'numeric', month: 'short' });

function StatTile({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-black text-foreground mt-1 tabular-nums">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function ClientAffiliates() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<any>(null);
  const [program, setProgram] = useState<AffiliateProgram | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meData, prog] = await Promise.all([affiliatesApi.getMe(), getAffiliateProgram()]);
      setMe(meData);
      setProgram(prog);
    } catch (e: any) {
      toast.error(e.message || 'No se pudo cargar tu panel de afiliado');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = async () => {
    setJoining(true);
    try {
      await affiliatesApi.join(getVisitorId());
      toast.success('¡Ya sos parte del programa de afiliados!');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo completar el registro');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!program?.enabled && !me?.profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold">Programa de afiliados</h1>
        <p className="text-muted-foreground mt-2">El programa todavía no está disponible. Volvé pronto.</p>
      </div>
    );
  }

  if (!me?.profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-7 h-7 text-violet-600 dark:text-violet-300" />
          </div>
          <h1 className="text-2xl font-black">Ganá recomendando</h1>
          <p className="text-muted-foreground mt-2">
            Compartí productos y tiendas de OSCORP. Por cada venta que se haga desde tu enlace, te llevás una comisión en tu billetera.
          </p>
        </div>
        <Card>
          <CardContent className="p-5 space-y-3 text-sm text-muted-foreground">
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Cada tienda fija su % (entre {program?.minRate}% y {program?.maxRate}%).</li>
              <li>La venta es tuya si compran dentro de los {program?.cookieDays} días desde tu enlace (último clic).</li>
              <li>La comisión aparece como Pendiente y se libera {program?.holdDays ? `${program.holdDays} días después de la entrega` : 'al entregarse el pedido'}.</li>
              <li>No hay comisión por compras propias; si el pedido se cancela, se anula.</li>
            </ul>
            <label className="flex items-start gap-2 pt-2 text-foreground cursor-pointer">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
              <span>Acepto los términos del programa de afiliados de OSCORP.</span>
            </label>
            <Button className="w-full" disabled={!accepted || joining} onClick={join}>
              {joining && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unirme al programa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, earnings, walletBalance } = me;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">Afiliados</h1>
          <p className="text-sm text-muted-foreground">
            Tu código: <span className="font-mono font-bold text-foreground">{profile.code}</span>
          </p>
        </div>
        {profile.status !== 'active' && (
          <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
            profile.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
            {profile.status === 'pending' ? 'Pendiente de aprobación' : 'Suspendido'}
          </span>
        )}
      </div>

      <Tabs defaultValue="explorar">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="explorar">Explorar</TabsTrigger>
          <TabsTrigger value="promociones">Promociones</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="ganancias">Ganancias</TabsTrigger>
        </TabsList>
        <TabsContent value="explorar" className="mt-4"><ExploreTab /></TabsContent>
        <TabsContent value="promociones" className="mt-4"><LinksTab /></TabsContent>
        <TabsContent value="estadisticas" className="mt-4"><StatsTab /></TabsContent>
        <TabsContent value="ganancias" className="mt-4"><EarningsTab earnings={earnings} walletBalance={walletBalance} /></TabsContent>
      </Tabs>
    </div>
  );
}

function ExploreTab() {
  const [data, setData] = useState<{ products: any[]; stores: any[] } | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'products' | 'stores'>('products');

  useEffect(() => {
    const t = setTimeout(() => {
      affiliatesApi.explore(search).then(setData).catch(() => setData({ products: [], stores: [] }));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos" className="pl-9" />
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          <Button size="sm" variant={view === 'products' ? 'secondary' : 'ghost'} onClick={() => setView('products')}>Productos</Button>
          <Button size="sm" variant={view === 'stores' ? 'secondary' : 'ghost'} onClick={() => setView('stores')}>Tiendas</Button>
        </div>
      </div>

      {!data ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : view === 'products' ? (
        data.products.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Todavía no hay productos que paguen comisión.</p>
        ) : (
          <div className="space-y-2">
            {data.products.map((p) => (
              <Card key={p.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden shrink-0">
                    {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/producto/${p.slug || p.id}`} className="font-semibold text-sm line-clamp-1 hover:underline">{p.name}</Link>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.storeName} · {formatCurrency(p.price)}</p>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-300 mt-0.5">
                      {p.rate}% · ganás {formatCurrency(p.commission)} por venta
                    </p>
                  </div>
                  <PromoteButton kind="product" productId={p.id} title={p.name} rate={p.rate} size="sm" className="shrink-0 [&>svg]:mr-0" />
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : data.stores.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">Todavía no hay tiendas con afiliados.</p>
      ) : (
        <div className="space-y-2">
          {data.stores.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0">
                  {s.logo ? <img src={s.logo} alt="" className="w-full h-full object-cover" /> : <Store className="w-5 h-5 m-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/tienda/${s.slug}`} className="font-semibold text-sm line-clamp-1 hover:underline">{s.name}</Link>
                  <p className="text-xs text-muted-foreground">{s.productCount} productos · hasta {s.maxRate}%</p>
                </div>
                <PromoteButton kind="store" storeSlug={s.slug} title={s.name} size="sm" className="shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function LinksTab() {
  const [links, setLinks] = useState<any[] | null>(null);

  useEffect(() => {
    affiliatesApi.getLinks().then(setLinks).catch(() => setLinks([]));
  }, []);

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      toast.success('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  if (!links) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (links.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Todavía no generaste enlaces. Buscá un producto en Explorar y tocá "Promocionar".</p>;
  }

  return (
    <div className="space-y-2">
      {links.map((l) => (
        <Card key={l.id} className={cn(!l.active && 'opacity-60')}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0">
                {l.image ? <img src={l.image} alt="" className="w-full h-full object-cover" /> : l.type === 'store' ? <Store className="w-5 h-5 m-3 text-muted-foreground" /> : <Package className="w-5 h-5 m-3 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{l.name}</p>
                <p className="text-xs text-muted-foreground">
                  {l.type === 'store' ? 'Enlace de tienda' : `${l.storeName}${l.rate ? ` · ${l.rate}%` : ''}`}
                  {!l.active && ' · ya no participa'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 text-center text-xs">
              <div><p className="font-black text-base tabular-nums">{l.clicks}</p><p className="text-muted-foreground">Clics</p></div>
              <div><p className="font-black text-base tabular-nums">{l.sales}</p><p className="text-muted-foreground">Ventas</p></div>
              <div><p className="font-black text-base tabular-nums">{formatCurrency(l.earned)}</p><p className="text-muted-foreground">Ganado</p></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => copy(l.path)}><Copy className="w-3.5 h-3.5 mr-1.5" />Copiar</Button>
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${l.name} ${window.location.origin}${l.path}`)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="ghost" asChild aria-label="Abrir">
                <Link to={l.path}><ExternalLink className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsTab() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    affiliatesApi.getStats(days).then(setStats).catch(() => setStats({ clicks: 0, visitors: 0, sales: 0, earned: 0, conversion: 0, series: [] }));
  }, [days]);

  const chartData = useMemo(() => (stats?.series || []).map((d: any) => ({ ...d, label: shortDate(d.date) })), [stats]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {[7, 30, 90].map((d) => (
          <Button key={d} size="sm" variant={days === d ? 'secondary' : 'ghost'} onClick={() => { if (d !== days) { setStats(null); setDays(d); } }}>{d} días</Button>
        ))}
      </div>
      {!stats ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatTile label="Clics" value={stats.clicks.toLocaleString('es-PY')} />
            <StatTile label="Visitantes" value={stats.visitors.toLocaleString('es-PY')} />
            <StatTile label="Ventas" value={stats.sales.toLocaleString('es-PY')} />
            <StatTile label="Conversión" value={`${stats.conversion}%`} hint="ventas / visitantes" />
          </div>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm font-semibold mb-3">Clics por día</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.6} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                      contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12, color: 'hsl(var(--popover-foreground))' }}
                      formatter={(value: any, _name: any, item: any) => [`${value} clics · ${item.payload.sales} ventas`, '']}
                      separator=""
                    />
                    <Bar dataKey="clicks" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function EarningsTab({ earnings, walletBalance }: { earnings: any; walletBalance: number }) {
  const [commissions, setCommissions] = useState<any[] | null>(null);

  useEffect(() => {
    affiliatesApi.getCommissions().then(setCommissions).catch(() => setCommissions([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatTile label="Generado" value={formatCurrency(earnings.generated)} className="col-span-2 sm:col-span-1" />
        <StatTile label="Pendiente" value={formatCurrency(earnings.pending.amount)} hint="se libera tras la entrega" />
        <StatTile label="Aprobado" value={formatCurrency(earnings.approved.amount)} />
        <StatTile label="Pagado" value={formatCurrency(earnings.paid.amount)} hint="ya en tu billetera" />
        <StatTile label="Cancelado" value={formatCurrency(earnings.cancelled.amount + earnings.reversed.amount)} />
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Saldo disponible en tu billetera</p>
              <p className="font-black tabular-nums">{formatCurrency(walletBalance)}</p>
            </div>
          </div>
          <Button asChild><Link to="/app/wallet/retirar">Retirar</Link></Button>
        </CardContent>
      </Card>

      <div>
        <p className="text-sm font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Comisiones</p>
        {!commissions ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : commissions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Todavía no tenés comisiones.</p>
        ) : (
          <div className="space-y-2">
            {commissions.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{c.productName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {c.storeName} · {shortDate(c.createdAt)} · {c.rate}% de {formatCurrency(c.baseAmount)}
                    </p>
                    {c.status === 'pending' && c.availableAt && (
                      <p className="text-[11px] text-muted-foreground">Se libera el {shortDate(c.availableAt)}</p>
                    )}
                    {c.status === 'pending' && !c.availableAt && (
                      <p className="text-[11px] text-muted-foreground">Esperando la entrega del pedido</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black tabular-nums">{formatCurrency(c.amount)}</p>
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', COMMISSION_STATUS_CLASSES[c.status])}>
                      {COMMISSION_STATUS_LABELS[c.status] || c.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

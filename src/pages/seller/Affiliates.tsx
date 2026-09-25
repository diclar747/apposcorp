import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Megaphone, Loader2, AlertTriangle, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { affiliatesApi, productsApi } from '@/lib/api';
import { COMMISSION_STATUS_CLASSES, COMMISSION_STATUS_LABELS, marginAfterCommissions } from '@/lib/affiliate';
import { formatCurrency, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function SellerAffiliates() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ affiliateEnabled: false, affiliateDefaultRate: '', affiliateAllProducts: false });

  const load = useCallback(async () => {
    try {
      const d = await affiliatesApi.getSellerSettings();
      setData(d);
      setForm({
        affiliateEnabled: d.store.affiliateEnabled,
        affiliateDefaultRate: d.store.affiliateDefaultRate?.toString() ?? '',
        affiliateAllProducts: d.store.affiliateAllProducts,
      });
    } catch (e: any) {
      toast.error(e.message || 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await affiliatesApi.updateSellerSettings({
        affiliateEnabled: form.affiliateEnabled,
        affiliateDefaultRate: form.affiliateDefaultRate === '' ? null : Number(form.affiliateDefaultRate),
        affiliateAllProducts: form.affiliateAllProducts,
      });
      toast.success('Programa de afiliados actualizado');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const updateProduct = async (id: string, patch: { affiliateEnabled?: boolean | null; affiliateRate?: number | null }) => {
    try {
      await productsApi.update(id, patch);
      await load();
    } catch (e: any) {
      toast.error(e.message || 'No se pudo actualizar el producto');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data) return null;

  const { program, store, products } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="w-6 h-6" />Programa de afiliados</h1>
        <p className="text-muted-foreground">
          Personas que recomiendan tus productos y cobran una <strong>comisión de afiliado</strong> por cada venta. Se descuenta de lo que cobrás,
          igual que la comisión de plataforma.
        </p>
      </div>

      {!program.enabled && (
        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          El programa de afiliados de OSCORP todavía no está activo. Podés dejarlo configurado y empezará a funcionar cuando se active.
        </div>
      )}
      {store.affiliateBlocked && (
        <div className="flex gap-3 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-900 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          OSCORP desactivó los afiliados para tu tienda. Contactá con soporte si creés que es un error.
        </div>
      )}
      {store.storeSlug.startsWith('store-') && (
        <div className="flex gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-muted-foreground" />
          <span>
            El enlace de tu tienda es <span className="font-mono">/tienda/{store.storeSlug}</span>. Elegí uno más fácil de recordar en{' '}
            <Link to="/vendedor/tienda" className="text-primary font-medium hover:underline">Mi tienda</Link> antes de que los afiliados lo compartan:
            si lo cambiás después, los enlaces viejos dejan de funcionar.
          </span>
        </div>
      )}

      <Tabs defaultValue="config">
        <TabsList>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="report">Ventas por afiliado</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mi tienda</CardTitle>
              <CardDescription>
                % permitido: de {program.minRate}% a {program.maxRate}%. La comisión se libera al afiliado
                {program.holdDays ? ` ${program.holdDays} días después de la entrega` : ' cuando se entrega el pedido'}.
                {program.codEnabled && ' En pagos contra entrega se descuenta de tu billetera al marcar el pedido como entregado.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="aff-enabled" className="text-base">Aceptar afiliados</Label>
                  <p className="text-sm text-muted-foreground">Muestra el botón "Promocionar" en tu tienda y tus productos.</p>
                </div>
                <Switch id="aff-enabled" checked={form.affiliateEnabled} onCheckedChange={(v) => setForm({ ...form, affiliateEnabled: v })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aff-rate">% general</Label>
                  <Input
                    id="aff-rate"
                    type="number"
                    min={program.minRate}
                    max={program.maxRate}
                    step="0.5"
                    placeholder={`Ej. ${Math.min(10, program.maxRate)}`}
                    value={form.affiliateDefaultRate}
                    onChange={(e) => setForm({ ...form, affiliateDefaultRate: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Se usa en los productos que no tienen un % propio.</p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                  <div>
                    <Label htmlFor="aff-all">Todos mis productos participan</Label>
                    <p className="text-xs text-muted-foreground">Salvo los que excluyas abajo.</p>
                  </div>
                  <Switch id="aff-all" checked={form.affiliateAllProducts} onCheckedChange={(v) => setForm({ ...form, affiliateAllProducts: v })} />
                </div>
              </div>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Guardar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>
                Elegí qué productos participan y, si querés, un % distinto al general. La comisión de plataforma de tu tienda es {store.platformCommissionRate}%.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground p-6">Todavía no cargaste productos.</p>
              ) : (
                <div className="divide-y divide-border">
                  {products.map((p: any) => (
                    <ProductRow key={p.id} product={p} program={program} platformRate={store.platformCommissionRate} onChange={updateProduct} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="mt-4">
          <SellerAffiliateReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProductRow({ product, program, platformRate, onChange }: {
  product: any;
  program: any;
  platformRate: number;
  onChange: (id: string, patch: { affiliateEnabled?: boolean | null; affiliateRate?: number | null }) => Promise<void>;
}) {
  const [rate, setRate] = useState(product.affiliateRate?.toString() ?? '');
  const participation = product.affiliateEnabled === null ? 'inherit' : product.affiliateEnabled ? 'yes' : 'no';
  const effective = product.effectiveRate as number | null;
  const margin = effective ? marginAfterCommissions(product.price, product.cost, effective, platformRate) : null;

  const commitRate = () => {
    const value = rate === '' ? null : Number(rate);
    if (value === product.affiliateRate) return;
    onChange(product.id, { affiliateRate: value });
  };

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-lg bg-muted overflow-hidden shrink-0">
          {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 m-3 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(product.price)}
            {effective ? ` · participa con ${effective}% (${formatCurrency(Math.floor((product.price * effective) / 100))} por venta)` : ' · no participa'}
            {product.affiliateBlocked && ' · desactivado por OSCORP'}
          </p>
          {margin !== null && margin < 0 && (
            <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
              <AlertTriangle className="w-3 h-3" /> Con este % y la comisión de plataforma vendés a pérdida ({formatCurrency(margin)} por unidad).
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Select value={participation} onValueChange={(v) => onChange(product.id, { affiliateEnabled: v === 'inherit' ? null : v === 'yes' })}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="inherit">Como la tienda</SelectItem>
            <SelectItem value="yes">Participa</SelectItem>
            <SelectItem value="no">No participa</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative w-[96px]">
          <Input
            type="number"
            min={program.minRate}
            max={program.maxRate}
            step="0.5"
            placeholder="% tienda"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            onBlur={commitRate}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="h-9 pr-6"
            aria-label="% propio del producto"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  );
}

function SellerAffiliateReport() {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    affiliatesApi.getSellerReport().then(setReport).catch(() => setReport({ affiliates: [], commissions: [] }));
  }, []);

  if (!report) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (report.commissions.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Todavía no hubo ventas por afiliados.</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Por afiliado</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead className="text-right">Pedidos</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.affiliates.map((a: any) => (
                <TableRow key={a.affiliateId}>
                  <TableCell>{a.name} <span className="font-mono text-xs text-muted-foreground">{a.code}</span></TableCell>
                  <TableCell className="text-right tabular-nums">{a.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(a.sales)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(a.commission)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Detalle</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Afiliado</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.commissions.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString('es-PY')}</TableCell>
                  <TableCell className="font-mono text-xs">{c.orderNumber}</TableCell>
                  <TableCell>{c.productName}</TableCell>
                  <TableCell>{c.affiliateName}</TableCell>
                  <TableCell className="text-right tabular-nums whitespace-nowrap">{formatCurrency(c.amount)} <span className="text-xs text-muted-foreground">({c.rate}%)</span></TableCell>
                  <TableCell>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full', COMMISSION_STATUS_CLASSES[c.status])}>
                      {COMMISSION_STATUS_LABELS[c.status] || c.status}
                    </span>
                    {c.note && <p className="text-[11px] text-muted-foreground mt-1">{c.note}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Info, Minus, Package, Plus, ShieldCheck,
  ShoppingBag, ShoppingCart, Store, Trash2, Truck,
} from 'lucide-react';
import { useCartStore } from '@/stores';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import './Cart.css';

const isDemo = (tags?: string[]) => tags?.includes('oscorp-demo') ?? false;
const imageFor = (name: string) => {
  const value = name.toLowerCase();
  const base = '/images/marketplace-modern/products/';
  if (/iphone|celular|tel[eé]fono/.test(value)) return `${base}smartphone.png`;
  if (/auricular|aud[ií]fono/.test(value)) return `${base}headphones.png`;
  if (/notebook|laptop/.test(value)) return `${base}laptop.png`;
  if (/bolso|cartera/.test(value)) return `${base}handbag.png`;
  return null;
};

export default function ClientCart() {
  const navigate = useNavigate();
  const { items, total, itemCount, updateQuantity, removeItem, clearCart } = useCartStore();
  const demoCount = items.filter((item) => isDemo(item.product.tags)).length;
  const realCount = items.length - demoCount;
  const canCheckout = items.length > 0 && demoCount === 0;
  const deliveryNeedsContact = items.some((item) => item.product.type === 'physical' && !['free', 'paid'].includes(item.product.deliveryMode || 'arrange'));
  const deliveryEstimate = items.reduce((sum, item) => sum + (item.product.deliveryMode === 'paid' ? Number(item.product.deliveryFee || 0) : 0), 0);

  const handleRemove = (id: string) => {
    removeItem(id);
    toast.success('Producto quitado del carrito');
  };

  return (
    <div className="cart-page">
      <header className="cart-topbar">
        <div className="cart-topbar-inner">
          <Link to="/marketplace" className="cart-back"><ArrowLeft size={18} /> <span>Seguir comprando</span></Link>
          <Link to="/" className="cart-brand"><span><ShoppingCart size={20} /></span>OSCORP</Link>
          <span className="cart-topbar-label">Carrito de compras</span>
        </div>
      </header>
      <main className="cart-container">
        <div className="cart-heading">
          <div><span className="cart-eyebrow">TU SELECCIÓN</span><h1>Mi carrito <span>({itemCount})</span></h1><p>Revisá los productos antes de continuar.</p></div>
          {items.length > 0 && <button type="button" className="cart-clear" onClick={clearCart}><Trash2 size={16} /> Vaciar carrito</button>}
        </div>
        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon"><ShoppingBag size={42} /></div>
            <h2>Tu carrito está vacío</h2>
            <p>Descubrí productos de nuestras tiendas y agregá tus favoritos.</p>
            <Link to="/marketplace">Explorar el marketplace <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <div className="cart-layout">
            <section className="cart-items" aria-label="Productos del carrito">
              {demoCount > 0 && (
                <div className="cart-demo-banner"><Info size={20} /><div><strong>Carrito de prueba</strong><p>{realCount > 0 ? 'Quitá los productos de muestra para continuar con la compra real.' : 'Podés probar cantidades y eliminar productos. No se hará un pedido ni un cobro.'}</p></div></div>
              )}
              {items.map(({ product, quantity }) => {
                const demo = isDemo(product.tags);
                const image = product.images?.[0] || imageFor(product.name);
                const catalogProduct = product as typeof product & { seller?: { storeName?: string }; storeName?: string };
                return (
                  <article className="cart-item" key={product.id}>
                    <Link to={`/producto/${product.slug || product.id}`} className="cart-item-image" aria-label={`Ver ${product.name}`}>
                      {image ? <img src={image} alt={product.name} /> : <Package size={35} />}
                    </Link>
                    <div className="cart-item-info">
                      <div className="cart-item-topline"><span>{demo ? 'PRODUCTO DE MUESTRA' : product.category}</span><button type="button" onClick={() => handleRemove(product.id)} aria-label={`Quitar ${product.name}`}><Trash2 size={18} /></button></div>
                      <Link to={`/producto/${product.slug || product.id}`} className="cart-item-name">{product.name}</Link>
                      <span className="cart-item-store"><Store size={14} /> {catalogProduct.seller?.storeName || catalogProduct.storeName || 'Tienda OSCORP'}</span>
                      {!demo && <span className="cart-item-shipping"><Truck size={14} /> {product.deliveryMode === 'paid' ? `Delivery ${formatCurrency(Number(product.deliveryFee || 0))}` : product.deliveryMode === 'free' ? 'Delivery gratis' : product.deliveryMode === 'pickup' ? 'Solo retiro en tienda' : 'Delivery a coordinar'}</span>}
                      <div className="cart-item-bottom">
                        <div className="cart-stepper" aria-label={`Cantidad de ${product.name}`}>
                          <button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} aria-label={`Reducir cantidad de ${product.name}`}><Minus size={15} /></button>
                          <span aria-live="polite">{quantity}</span>
                          <button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} disabled={quantity >= product.stock} aria-label={`Aumentar cantidad de ${product.name}`}><Plus size={15} /></button>
                        </div>
                        <div className="cart-item-price"><strong>{formatCurrency(product.price * quantity)}</strong><small>{demo ? 'Total ilustrativo' : quantity > 1 ? `${formatCurrency(product.price)} c/u` : 'Precio por unidad'}</small></div>
                      </div>
                    </div>
                  </article>
                );
              })}
              <Link to="/marketplace" className="cart-continue"><ArrowLeft size={16} /> Seguir comprando</Link>
            </section>
            <aside className="cart-summary">
              <div className="cart-summary-title"><ShoppingBag size={22} /><h2>Resumen del pedido</h2></div>
              <div className="cart-summary-row"><span>Productos ({itemCount})</span><strong>{formatCurrency(total)}</strong></div>
              <div className="cart-summary-row"><span>Envío</span><span>{demoCount ? 'No aplica a muestras' : deliveryNeedsContact ? 'Retiro o consultar vendedor' : deliveryEstimate ? `Desde ${formatCurrency(deliveryEstimate)}` : 'Gratis'}</span></div>
              <div className="cart-summary-total"><span>{demoCount ? 'Total ilustrativo' : 'Subtotal'}</span><strong>{formatCurrency(total)}</strong></div>
              {demoCount > 0 ? (
                <div className="cart-checkout-blocked"><Info size={18} /><p>Los productos de muestra no se pueden comprar. {realCount > 0 && 'Quitalos para continuar con los productos reales.'}</p></div>
              ) : (
                <button type="button" className="cart-checkout" disabled={!canCheckout} onClick={() => navigate('/app/checkout')}>Continuar con la compra <ArrowRight size={18} /></button>
              )}
              <div className="cart-summary-trust"><ShieldCheck size={18} /><span>{demoCount ? 'Prueba sin pagos ni pedidos' : 'Pago seguro con OSCORP'}</span></div>
            </aside>
          </div>
        )}
        <div className="cart-benefits"><span><ShieldCheck size={20} /> Tiendas verificadas</span><span><Truck size={20} /> Opciones de entrega</span><span><ShoppingBag size={20} /> Comprá en un solo lugar</span></div>
      </main>
    </div>
  );
}

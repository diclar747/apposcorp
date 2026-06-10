import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Printer,
  ChevronRight,
  HelpCircle,
  Store,
  ShoppingCart,
  Package,
  DollarSign,
  X,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Section {
  id: string;
  title: string;
  keywords: string[];
  description: string;
  content: React.ReactNode;
}

export default function SellerManual() {
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const sections: Section[] = [
    {
      id: 'configurar-tienda',
      title: 'Creación y Configuración de tu Tienda',
      keywords: ['tienda', 'crear tienda', 'comerciante', 'logo', 'banner', 'whatsapp', 'perfil'],
      description: 'Paso a paso para configurar tu perfil comercial, subir logo/banner y conectar WhatsApp.',
      content: (
        <div className="space-y-4">
          <p>
            Al ingresar al rol de Vendedor, debes configurar tu establecimiento comercial desde la sección **Mi Tienda** (`/vendedor/tienda`):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li><strong>Información Básica:</strong> Registra el Nombre de tu Tienda, descripción para el marketplace, dirección física del local, email de contacto y teléfono comercial.</li>
            <li><strong>Imágenes de Marca:</strong> Carga tu logotipo (formato cuadrado/circular) y un banner publicitario horizontal para la cabecera de la tienda.</li>
            <li><strong>WhatsApp Business:</strong> Registra tu número de WhatsApp oficial. El Marketplace de Oscorp habilitará botones automáticos en tus productos para que los clientes te escriban directamente.</li>
            <li><strong>Visibilidad:</strong> El interruptor "Online / Offline" te permite habilitar o pausar la publicación de toda tu tienda de forma instantánea.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'productos-crud',
      title: 'Gestión de Productos (Escribir, Editar y Eliminar)',
      keywords: ['productos', 'escribir', 'editar', 'eliminar', 'costo', 'ganancia', 'sku', 'inventario'],
      description: 'Guía para registrar nuevos productos/servicios y calcular precios finales utilizando márgenes de ganancia.',
      content: (
        <div className="space-y-4">
          <p>
            Mantén al día tu inventario en el catálogo global de tu tienda en **Productos** (`/vendedor/productos`):
          </p>
          <ul className="space-y-3 text-xs text-muted-foreground">
            <li>
              <strong>Crear (Escribir):</strong> Presiona **"Nuevo Producto"**. Introduce nombre, SKU único, categoría, cantidad de stock e imágenes (puedes arrastrar archivos o pegar URLs de imágenes).
            </li>
            <li>
              <strong>Calculadora de Precio / Margen:</strong>
              <div className="p-3 bg-slate-900 border border-white/5 rounded-xl font-mono text-[11px] text-green-400 my-1">
                PRECIO VENTA = COSTO COMPRA * (1 + PORCENTAJE GANANCIA / 100)
              </div>
              <p>
                Al rellenar el **Costo de Compra** (₲) y el **Margen de Ganancia** (%), la calculadora determinará automáticamente el **Precio de Venta** sugerido. Funciona de manera inversa si editas el precio final directamente.
              </p>
            </li>
            <li>
              <strong>Editar / Eliminar:</strong> Selecciona el botón de acciones de la fila del producto. Puedes ajustar stocks, variantes de tallas/colores o dar de baja el artículo permanentemente con confirmación.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'pos-comercial',
      title: 'Punto de Venta (POS) y Cobro con QR',
      keywords: ['pos', 'punto de venta', 'cobrar', 'efectivo', 'tarjeta', 'f2', 'contado', 'credito', 'qr'],
      description: 'Cómo usar la terminal POS física, registrar ventas de mostrador y recibir cobros Wallet QR.',
      content: (
        <div className="space-y-4">
          <p>
            La pantalla de **Punto de Venta** (`/vendedor/pos`) está optimizada para cobros rápidos cara a cara:
          </p>
          <div className="space-y-3 text-xs text-muted-foreground">
            <h4 className="font-bold text-green-500 text-xs">Paso 1: Armar el Ticket</h4>
            <p>
              Toca los productos en pantalla o escanea el código de barras (SKU) con lector láser en el campo de búsqueda rápida. Modifica las cantidades de ser necesario.
            </p>
            
            <h4 className="font-bold text-green-500 text-xs">Paso 2: Registrar Cliente (Opcional)</h4>
            <p>
              Haz clic en "Seleccionar Cliente" en la barra superior. Es indispensable si registras la venta bajo la modalidad de **Crédito** (cuenta corriente).
            </p>
            
            <h4 className="font-bold text-green-500 text-xs">Paso 3: Formas de Cobro (Tecla F2)</h4>
            <p>
              Presiona "Cobrar" o la tecla rápida **F2** y selecciona la vía de pago:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contado - Efectivo:</strong> Digita la suma recibida; el sistema calcula el vuelto a entregar.</li>
              <li><strong>Contado - Tarjeta:</strong> Simula el cobro mediante terminal bancaria externa.</li>
              <li><strong>Contado - Wallet QR:</strong> Genera un código QR en la pantalla del POS. El cliente escanea el código con su celular a través de su billetera Oscorp y aprueba el cobro con su PIN. El POS detecta el pago de forma atómica y emite el recibo.</li>
              <li><strong>Crédito:</strong> Registra la deuda del cliente en su estado contable comercial.</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const matchesTitle = sec.title.toLowerCase().includes(query);
      const matchesDesc = sec.description.toLowerCase().includes(query);
      const matchesKeywords = sec.keywords.some((kw) => kw.toLowerCase().includes(query));

      return matchesTitle || matchesDesc || matchesKeywords;
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 px-4 font-sans text-left pt-2">
      {/* Header (No-print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-500" /> Manual de Comercio y POS
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Aprende a configurar tu tienda, administrar tu catálogo y procesar cobros de contado y Wallet QR.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-green-500/20"
        >
          <Printer className="w-3.5 h-3.5" /> Exportar a PDF
        </Button>
      </div>

      {/* Search Bar (No-print) */}
      <div className="no-print relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar guías... (ej: POS, producto, precio, WhatsApp)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-8 py-5 text-sm rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-green-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Sections render (Web view) */}
      <div className="no-print space-y-6">
        {filteredSections.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
            <HelpCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">No se encontraron temas</h3>
            <p className="text-xs text-gray-500 mt-1">Prueba buscando "POS", "ganancia" o "tienda".</p>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl border-l-4 border-l-green-500 border-y border-r border-gray-200 dark:border-slate-800/50 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    Comercio
                  </span>
                  <span className="text-xs text-muted-foreground">ID: {sec.id}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {sec.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {sec.description}
                </p>
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800/50 text-slate-700 dark:text-gray-300 text-sm leading-relaxed">
                  {sec.content}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* ======================================================== */}
      {/* PRINT-ONLY COMPLETE DOCUMENT VIEW (Hidden in Web View) */}
      {/* ======================================================== */}
      <div className="print-layout hidden space-y-8 p-10 bg-white text-black leading-relaxed">
        {/* Cover Page */}
        <div className="print-page-break flex flex-col items-center justify-center min-h-[80vh] text-center pt-20">
          <img src="/oscorp-logo.png" alt="Oscorp Logo" className="h-24 w-auto mb-6" />
          <h1 className="text-3xl font-black text-slate-950 mb-1">MANUAL COMERCIAL Y PUNTO DE VENTA</h1>
          <h2 className="text-lg font-bold text-green-600 mb-6">OSCORP PLATFORM - VENDEDOR</h2>
          <div className="w-20 h-1 bg-green-600 mb-6 mx-auto"></div>
          <p className="text-sm text-slate-600 max-w-md mb-12 mx-auto">
            Guía de administración comercial: configuración de local de ventas, control de catálogo, cálculo de márgenes y cobros QR.
          </p>
          <div className="text-xs text-slate-500 mt-24">
            <div>Sitio de Referencia: https://oscorp.com.py/</div>
            <div>Fecha de Impresión: {new Date().toLocaleDateString('es-ES')}</div>
          </div>
        </div>

        {/* Sections */}
        <div className="print-page-break space-y-6">
          <h2 className="text-xl font-black border-b pb-1.5 text-slate-900">Operaciones del Comercio y POS</h2>
          {sections.map((sec) => (
            <div key={sec.id} className="mt-4 space-y-2">
              <h3 className="text-base font-bold text-green-700">{sec.title}</h3>
              <p className="text-xs italic text-gray-500">{sec.description}</p>
              <div className="text-sm text-slate-800">{sec.content}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Local print style overrides */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-layout {
            display: block !important;
          }
          .print-page-break {
            page-break-after: always;
            break-after: page;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Search,
  Printer,
  ChevronRight,
  HelpCircle,
  Smartphone,
  CreditCard,
  Lock,
  ArrowRight,
  TrendingUp,
  Settings,
  X,
  FileText,
  Clock,
  QrCode,
  Send,
  User,
  ShoppingBag,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Section {
  id: string;
  title: string;
  category: 'cuenta' | 'monedero' | 'servicios';
  keywords: string[];
  description: string;
  content: React.ReactNode;
}

export default function ClientManual() {
  const [activeCategory, setActiveCategory] = useState<'todo' | 'cuenta' | 'monedero' | 'servicios'>('todo');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const sections: Section[] = [
    {
      id: 'registro-usuario',
      title: 'Registro de Cuentas y Formato de Teléfono',
      category: 'cuenta',
      keywords: ['registro', 'telefono', 'crear cuenta', 'verificacion', 'token'],
      description: 'Guía paso a paso del formulario de registro y formato correcto de número de contacto.',
      content: (
        <div className="space-y-4">
          <p>
            El registro de usuarios se realiza en la pantalla pública de `/register`:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>
              <strong>Paso 1: Datos Personales.</strong> Ingresa tu Nombre, Apellido, Email y Contraseña. 
              <br />
              <strong className="text-amber-500">Formato del Teléfono:</strong> Debes ingresar el número completo incluyendo el código de área del país (ejemplo para Paraguay: <code>+595981XXXXXX</code> o <code>0981XXXXXX</code>). El sistema valida este formato para permitir transferencias por número de celular.
            </li>
            <li>
              <strong>Paso 2: Tipo de Cuenta.</strong> Selecciona si tu objetivo es comprar (Cliente), vender (Comerciante) o estudiar (Ingenio). Esto preconfigura tus accesos iniciales.
            </li>
            <li>
              <strong>Paso 3: Verificación.</strong> Recibirás un correo con un enlace y código de verificación. En el entorno local, se mostrará el token en pantalla. Introduce este token en la pantalla de verificación para activar la cuenta.
            </li>
          </ol>
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Intentar iniciar sesión sin haber verificado tu cuenta dará un error de "Cuenta no verificada".</span>
          </div>
        </div>
      )
    },
    {
      id: 'client-inicio',
      title: 'Pantalla de Inicio y Elementos de la Billetera',
      category: 'cuenta',
      keywords: ['cliente', 'inicio', 'tarjeta virtual', 'bienvenida', 'resumen hoy', 'accesos directos', 'menu inferior'],
      description: 'Guía de la pantalla de bienvenida del usuario, visualización de tarjeta y accesos directos.',
      content: (
        <div className="space-y-4 text-sm">
          <p>
            Al ingresar a la interfaz de usuario (`/app`), verás la pantalla de **Inicio** (Resumen de hoy):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>
              <strong>Tarjeta de Débito Virtual:</strong>
              <br />
              Una réplica digital de tu tarjeta **OSCORP PREMIUM** en azul marino con chip inteligente. Muestra tu número de tarjeta único (ej. `OSC144394`) con botón para copiar, tu nombre como titular y el vencimiento (`12/28`).
            </li>
            <li>
              <strong>Botón "VER QR":</strong>
              <br />
              Ubicado abajo de la tarjeta. Abre tu código QR personal para que otros clientes o POS escaneen y te paguen presencialmente.
            </li>
            <li>
              <strong>Cuadrícula de 8 Botones de Acción:</strong>
              <br />
              Accesos rápidos a: Enviar, Recibir, Préstamos, Recargar, E-Commerce, Cursos, Historial y Ajustes.
            </li>
            <li>
              <strong>Resúmenes Inferiores:</strong>
              <br />
              Monitorea de forma directa tus pedidos de E-commerce y créditos activos.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-billetera',
      title: 'Mi Billetera (Saldos y Estadísticas)',
      category: 'monedero',
      keywords: ['cliente', 'billetera', 'balance', 'ingresos', 'egresos', 'ocultar saldo'],
      description: 'Control de saldo, estadísticas del mes y visualización analítica de ingresos/gastos.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Mi Billetera** (`/app/wallet`), visualizas y gestionas tus fondos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Saldo Disponible:** Cuenta con un botón de ojo (Ocultar/Ver) para proteger tu privacidad de saldos.</li>
            <li>**Analíticas:** Widgets del total de **Ingresos del Mes** (barra verde) y **Egresos del Mes** (barra roja) para control financiero.</li>
            <li>**Movimientos:** Historial integrado de transacciones del monedero.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-tarjeta',
      title: 'Mi Tarjeta (Diseños y Descarga de QR)',
      category: 'cuenta',
      keywords: ['cliente', 'tarjeta', 'diseño tarjeta', 'descargar qr', 'copiar nro'],
      description: 'Personalización del diseño visual de la tarjeta virtual y descarga del código de cobro.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Mi Tarjeta** (`/app/tarjeta`), controlas tu plástico digital:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Estilizar Tarjeta:** Elige plantillas de colores para cambiar el fondo de tu tarjeta virtual.</li>
            <li>**Descargar QR:** Presiona **"Descargar QR"** para guardar tu código de cobro en imagen PNG de alta calidad y enviársela a tus clientes para cobrar a distancia.</li>
            <li>**Copiar Nro:** Copia al portapapeles el número de cuenta OSC de 9 dígitos.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-pago-qr',
      title: 'Pago QR (Escanear y Pagar en Comercios)',
      category: 'monedero',
      keywords: ['cliente', 'pago qr', 'escanear qr', 'camara', 'confirmar pago', 'pin'],
      description: 'Cómo usar la cámara del teléfono para pagar en locales físicos y tiendas POS.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Para realizar pagos con el lector QR de la billetera:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>Abre el escáner presionando **"Pago QR"** en Inicio o el botón central azul de la barra inferior.</li>
            <li>Enfoca el código QR de cobro del comercio (presentado en el POS o pantalla del vendedor).</li>
            <li>El sistema cargará la información y el monto. Confirma la transacción.</li>
            <li>Introduce tu **PIN transaccional de 4 dígitos** para liquidar el cobro y debitar el saldo de tu wallet.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'client-enviar',
      title: 'Enviar Dinero (Transferencias P2P a Contactos)',
      category: 'monedero',
      keywords: ['cliente', 'enviar', 'transferir', 'buscar contacto', 'pin transaccional'],
      description: 'Flujo completo para transferir dinero digital a amigos o familiares mediante email o teléfono.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Traspasa saldo digital de forma inmediata a otros usuarios de la plataforma:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>Presiona **"Enviar"** en la botonera de la pantalla de Inicio.</li>
            <li>Busca al destinatario digitando su nombre, email o número de celular verificado.</li>
            <li>Selecciona al contacto, define el monto en Guaraníes (₲) y escribe una nota opcional.</li>
            <li>Digita tu **PIN de 4 dígitos** para completar la transferencia atómica. El saldo se reflejará al instante en su cuenta.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'client-recibir',
      title: 'Recibir Dinero (Cobro Rápido Cara a Cara)',
      category: 'monedero',
      keywords: ['cliente', 'recibir', 'mostrar qr', 'cobrar qr'],
      description: 'Despliegue rápido de la ficha QR en pantalla para captar transferencias.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Para cobrar de forma presencial a otra persona:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>Haz clic en el acceso rápido **"Recibir"**.</li>
            <li>El brillo de la pantalla se configurará al máximo y presentará tu código QR único y número de tarjeta.</li>
            <li>El otro usuario solo debe abrir su lector QR de Oscorp, escanear tu pantalla y enviarte el dinero.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-recargar',
      title: 'Recargar Billetera (Fondos de Demostración)',
      category: 'monedero',
      keywords: ['cliente', 'recargar', 'depositar dinero', 'recarga virtual'],
      description: 'Simulador integrado para acreditar saldos de prueba de forma inmediata en tu wallet.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En la fase de pruebas o demostración, puedes añadir saldos de simulación:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>Toca el botón **"Recargar"** en Inicio.</li>
            <li>Selecciona el monto que deseas cargar (₲ 50.000, ₲ 100.000, ₲ 500.000 o ₲ 1.000.000).</li>
            <li>Presiona confirmar. Tu balance sumará esa cifra al instante bajo una transacción registrada como `deposit`.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-prestamos',
      title: 'Préstamos Personales (Simulación y Solicitud)',
      category: 'servicios',
      keywords: ['cliente', 'prestamos', 'creditos', 'solicitar credito', 'cedula', 'interes', 'pagar cuota'],
      description: 'Cómo simular un préstamo, cargar las fotos de tu cédula y pagar las cuotas mensuales.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Solicita créditos directamente a tu wallet desde el módulo de **Préstamos** (`/app/creditos`):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Simulación:** Ingresa la suma requerida y las cuotas de amortización (3 a 24 meses). La calculadora te indicará el interés y el costo exacto de la cuota mensual.</li>
            <li>**Subir Cédula:** Carga dos imágenes legibles: el frente y dorso de tu Cédula de Identidad Civil. Envía la solicitud para aprobación administrativa.</li>
            <li>**Pago de Cuotas:** Tras la aprobación y acreditación, ingresa mensualmente a la misma pantalla y presiona **"Pagar Cuota"** para debitarla de tu saldo disponible.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-ecommerce',
      title: 'E-Commerce (Compras en el Marketplace)',
      category: 'servicios',
      keywords: ['cliente', 'ecommerce', 'compras', 'tiendas', 'carrito', 'checkout', 'delivery', 'retiro'],
      description: 'Búsqueda de productos, carrito de compras, selección de envío y pago por wallet.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Compra productos online en las tiendas asociadas a la plataforma:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Explorar:** Ingresa a **Tiendas** (`/app/tiendas`) para ver comercios o a **Productos** para ver el catálogo unificado.</li>
            <li>**Carrito:** Agrega los productos elegidos al carrito. Revisa cantidades en `/app/carrito`.</li>
            <li>**Checkout:** Elige el modo de entrega (Delivery a domicilio o Retiro en Local) y el método de cobro (Pagar con Wallet Oscorp o Pago Contra Entrega).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-cursos',
      title: 'Cursos (Educación y Academia Financiera)',
      category: 'servicios',
      keywords: ['cliente', 'cursos', 'academia', 'inscribirse', 'lecciones', 'progreso'],
      description: 'Catálogo de cursos, registro a clases, visualización de lecciones en video y progreso del alumno.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Capacítate financieramente con los cursos de la academia (`/app/cursos`):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Inscribirse:** Selecciona el curso que te interese. Si es de pago y no tienes membresía activa de Ingenio Millonario, se descontará del saldo de tu billetera.</li>
            <li>**Clases y Videos:** Reproduce las lecciones grabadas en video y consulta los archivos de apoyo.</li>
            <li>**Progreso:** Marca las lecciones finalizadas. El sistema actualizará tu progreso y emitirá tu certificación al llegar al 100%.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-historial',
      title: 'Historial (Control y Auditoría de Movimientos)',
      category: 'monedero',
      keywords: ['cliente', 'historial', 'movimientos', 'ingresos', 'egresos', 'compras', 'ventas'],
      description: 'Listado y auditoría de transacciones personales con filtros rápidos por tipo.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Audita cada movimiento en la pantalla de **Historial** (`/app/wallet` o accesos rápidos):
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Filtros Rápidos:** Clasifica movimientos por: Todo, Ingresos (verde con signo `+`) o Egresos (rojo con signo `-`).</li>
            <li>**Detalles de Transacción:** Haz clic en una fila para desplegar su ID único, fecha/hora exacta y estado de acreditación.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-ajustes',
      title: 'Ajustes (Perfil y Datos para Retiros)',
      category: 'cuenta',
      keywords: ['cliente', 'ajustes', 'perfil', 'datos bancarios', 'banco', 'cuenta corriente', 'notificaciones'],
      description: 'Edición de información personal, carga de datos de transferencia y switch de notificaciones.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Ajustes** (`/app/perfil`), configura tu cuenta personal:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Editar Perfil:** Modifica tu nombre, dirección física, número celular y foto de perfil.</li>
            <li>**Datos Bancarios:** Registra el nombre de tu Banco, número de cuenta y tipo de cuenta. Estos datos son indispensables si deseas retirar tu saldo digital de Oscorp a tu cuenta bancaria tradicional.</li>
            <li>**Notificaciones Push:** Activa el interruptor para recibir alertas instantáneas de cobros y transferencias en tu dispositivo.</li>
          </ul>
        </div>
      )
    }
  ];

  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesCategory = searchQuery ? true : (activeCategory === 'todo' || sec.category === activeCategory);
      if (!matchesCategory) return false;

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const matchesTitle = sec.title.toLowerCase().includes(query);
      const matchesDesc = sec.description.toLowerCase().includes(query);
      const matchesKeywords = sec.keywords.some((kw) => kw.toLowerCase().includes(query));

      return matchesTitle || matchesDesc || matchesKeywords;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-10 px-4 font-sans text-left pt-4">
      {/* Header (No-print) */}
      <div className="no-print flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" /> Manual de Billetera
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Guía paso a paso sobre cómo usar tu billetera virtual, transferir y realizar pagos.
          </p>
        </div>
        <Button
          onClick={handlePrint}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
        >
          <Printer className="w-3.5 h-3.5" /> PDF
        </Button>
      </div>

      {/* Search Bar (No-print) */}
      <div className="no-print relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar... (ej: transferir, QR, recargar, préstamo)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 py-2 text-xs rounded-xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-3 text-gray-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Categories list (No-print) - hidden when searching */}
      {!searchQuery && (
        <div className="no-print flex p-1 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl gap-1 overflow-x-auto">
          {[
            { id: 'todo', label: '📖 Todo' },
            { id: 'cuenta', label: '👤 Cuenta' },
            { id: 'monedero', label: '💳 Monedero y QR' },
            { id: 'servicios', label: '💼 Servicios' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-lg text-[10px] font-semibold transition-all text-center whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Sections render (Web view) */}
      <div className="no-print space-y-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h3 className="font-bold text-xs text-gray-800 dark:text-gray-200">No se encontraron temas</h3>
            <p className="text-[10px] text-gray-500 mt-1">Prueba buscando palabras como "P2P", "QR" o "cédula".</p>
          </div>
        ) : (
          filteredSections.map((sec) => (
            <motion.div
              key={sec.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-xl border-l-4 border-l-blue-500 border-y border-r border-gray-200 dark:border-slate-800/50 shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {sec.category}
                  </span>
                  <span className="text-[9px] text-muted-foreground">ID: {sec.id}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  {sec.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mb-3">
                  {sec.description}
                </p>
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800/50 text-slate-700 dark:text-gray-300 text-xs leading-relaxed">
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
      <div className="print-layout hidden space-y-8 p-6 bg-white text-black leading-relaxed">
        {/* Cover Page */}
        <div className="print-page-break flex flex-col items-center justify-center min-h-[80vh] text-center pt-16">
          <img src="/oscorp-logo.png" alt="Oscorp Logo" className="h-20 w-auto mb-6" />
          <h1 className="text-2xl font-black text-slate-950 mb-1">MANUAL DE USO DE LA BILLETERA</h1>
          <h2 className="text-base font-bold text-blue-600 mb-6">OSCORP PLATFORM - CLIENTE</h2>
          <div className="w-16 h-1 bg-blue-600 mb-6 mx-auto"></div>
          <p className="text-xs text-slate-600 max-w-sm mb-12 mx-auto">
            Guía de operaciones para el usuario final: transferencias P2P, pagos con códigos QR y simulación de depósitos.
          </p>
          <div className="text-[10px] text-slate-500 mt-20">
            <div>Sitio de Referencia: https://oscorp.com.py/</div>
            <div>Fecha de Impresión: {new Date().toLocaleDateString('es-ES')}</div>
          </div>
        </div>

        {/* Sections */}
        <div className="print-page-break space-y-6">
          <h2 className="text-xl font-black border-b pb-1.5 text-slate-900">Guías del Usuario de la Wallet</h2>
          {sections.map((sec) => (
            <div key={sec.id} className="mt-4 space-y-1.5">
              <h3 className="text-sm font-bold text-blue-700">{sec.title}</h3>
              <p className="text-[10px] italic text-gray-500">{sec.description}</p>
              <div className="text-xs text-slate-800">{sec.content}</div>
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

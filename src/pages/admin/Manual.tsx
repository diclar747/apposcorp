import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  User,
  Store,
  Shield,
  Terminal,
  Printer,
  ChevronRight,
  CheckCircle,
  HelpCircle,
  Smartphone,
  CreditCard,
  Plus,
  Trash2,
  Lock,
  Database,
  ArrowRight,
  TrendingUp,
  Settings,
  X,
  FileText,
  Mail,
  Phone,
  Layers,
  MapPin,
  Percent,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Section {
  id: string;
  title: string;
  tab: 'general' | 'cliente' | 'vendedor' | 'admin' | 'tecnico';
  keywords: string[];
  description: string;
  content: React.ReactNode;
}

export default function AdminManual() {
  const [activeTab, setActiveTab] = useState<'general' | 'cliente' | 'vendedor' | 'admin' | 'tecnico'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePrint = () => {
    window.print();
  };

  const sections: Section[] = [
    // === GENERAL ===
    {
      id: 'vision-general',
      title: 'Visión General de Oscorp Platform',
      tab: 'general',
      keywords: ['general', 'oscorp', 'ecosistema', 'arquitectura', 'roles'],
      description: 'Introducción conceptual al ecosistema integrado fintech, e-commerce y e-learning.',
      content: (
        <div className="space-y-4">
          <p>
            <strong>Oscorp Platform</strong> es una solución integral diseñada para funcionar como un ecosistema digital colaborativo en Paraguay. Combina operaciones de comercio electrónico multilocal con servicios financieros avanzados (fintech) y un área académica premium.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <h4 className="font-bold text-sm text-blue-400 flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> Billetera Digital & QR</h4>
              <p className="text-xs text-muted-foreground mt-1">Soporte P2P inmediato, pagos escaneando el código QR de clientes y transacciones liquidadas de forma atómica en base de datos.</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
              <h4 className="font-bold text-sm text-purple-400 flex items-center gap-1.5"><Store className="w-4 h-4" /> Marketplace y POS</h4>
              <p className="text-xs text-muted-foreground mt-1">Directorio de tiendas verificadas online y terminal Punto de Venta (POS) física para cobros en mostrador con caja diaria.</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
              <h4 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Sistema de Créditos</h4>
              <p className="text-xs text-muted-foreground mt-1">Simulación y solicitud de financiamiento, adjuntando documentos RUC o cédula con desembolso directo a la wallet.</p>
            </div>
            <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/10">
              <h4 className="font-bold text-sm text-pink-400 flex items-center gap-1.5"><Layers className="w-4 h-4" /> Ingenio Millonario</h4>
              <p className="text-xs text-muted-foreground mt-1">Programa premium de suscripción con cursos, metas financieras, ruleta interactiva de 10 pasos y referidos.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'roles-usuario',
      title: 'Sistema Multi-Rol por Cuenta',
      tab: 'general',
      keywords: ['roles', 'usuarios', 'cliente', 'vendedor', 'admin', 'ingenio'],
      description: 'Explicación del esquema de roles que coexisten dentro de una misma cuenta.',
      content: (
        <div className="space-y-4">
          <p>
            El sistema admite **cuatro roles principales** de usuario que pueden ser asignados de forma combinada a un mismo email, compartiendo el monedero y los datos personales:
          </p>
          <ul className="space-y-2 text-sm">
            <li><strong className="text-blue-500">Cliente (client):</strong> Permite comprar en tiendas, escanear para pagar, solicitar préstamos y acceder a la wallet principal.</li>
            <li><strong className="text-purple-500">Vendedor (seller):</strong> Habilita la barra lateral del vendedor, creación de tienda, gestión de productos, inventario, pedidos y acceso al POS.</li>
            <li><strong className="text-pink-500">Estudiante Ingenio (ingenio):</strong> Otorga acceso a las herramientas del flujo de caja, ruleta educativa, descargas de materiales y la academia premium.</li>
            <li><strong className="text-indigo-500">Administrador (superadmin):</strong> Concede acceso total al panel global `/admin` para gestionar usuarios, créditos, reportes y configurar la plataforma.</li>
          </ul>
        </div>
      )
    },

    // === CLIENTE ===
    {
      id: 'registro-usuario',
      title: 'Paso a Paso: Registro de Cuentas y Teléfono Completo',
      tab: 'cliente',
      keywords: ['registro', 'telefono', 'crear cuenta', 'verificacion', 'token'],
      description: 'Guía paso a paso del formulario de registro y formato correcto de número de contacto.',
      content: (
        <div className="space-y-4">
          <p>
            El registro de usuarios se realiza de forma interactiva en la pantalla pública de `/register`:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>
              <strong>Paso 1: Datos Personales.</strong> Ingresa Nombre, Apellido, Email y Contraseña. 
              <br />
              <span className="text-amber-500 font-semibold">Carga del Número de Teléfono:</span> Debes ingresar el número completo incluyendo el código de área del país (ejemplo para Paraguay: <code>+595981XXXXXX</code> o <code>0981XXXXXX</code>). El sistema valida este campo para habilitar transferencias por número telefónico.
            </li>
            <li>
              <strong>Paso 2: Tipo de Cuenta.</strong> Selecciona tu objetivo (Comprar, Vender o Educación Financiera). Esto preconfigura los roles iniciales de la cuenta.
            </li>
            <li>
              <strong>Paso 3: Verificación.</strong> El servidor crea un token criptográfico único. El usuario recibirá un correo con un botón de verificación. Si está en modo demo, el sistema mostrará el token de demostración en pantalla. Introduce este token en la pantalla de verificación para activar la cuenta.
            </li>
          </ol>
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Si intentas iniciar sesión sin verificar tu correo, verás el mensaje de error 403: "Cuenta no verificada".</span>
          </div>
        </div>
      )
    },
    {
      id: 'wallet-transacciones',
      title: 'Billetera Digital: Cargar Dinero, Enviar P2P y Retirar',
      tab: 'cliente',
      keywords: ['wallet', 'billetera', 'cargar dinero', 'transferir', 'pin', 'retirar', 'depositar'],
      description: 'Manual de operaciones en monedero: transferencias P2P, PIN de seguridad y simulación de depósitos.',
      content: (
        <div className="space-y-4">
          <p>
            La billetera digital en `/app/wallet` es el monedero central del cliente. Dispone de tres flujos de transacciones:
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <strong>Cargar dinero (Depositar):</strong> En modo desarrollo, pulsa el botón "Cargar" o "Depositar" para agregar saldos de prueba instantáneos a tu balance en Guaraníes (₲).
            </li>
            <li>
              <strong>Transferir Dinero (P2P):</strong>
              <ol className="list-decimal pl-5 mt-1 space-y-1 text-xs text-muted-foreground">
                <li>Presiona **"Enviar"**. Escribe en la barra de búsqueda el correo o nombre del receptor (mínimo 3 caracteres).</li>
                <li>Selecciona el usuario, ingresa el monto a transferir y un mensaje opcional.</li>
                <li>Ingresa tu **PIN de Seguridad de 4 dígitos**. (Si es tu primera transacción, el sistema te forzará a definir uno que se cifrará con bcrypt).</li>
                <li>El emisor disminuye su balance y el receptor aumenta el suyo de manera inmediata, con una notificación en tiempo real.</li>
              </ol>
            </li>
            <li>
              <strong>Retirar Fondos:</strong> Solicita un retiro a tu cuenta bancaria (configurada en el perfil). El retiro reduce tu saldo disponible de inmediato y entra en cola de aprobación administrativa en `/admin/retiros`.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'pagar-qr',
      title: 'Pagos Escaneando Código QR',
      tab: 'cliente',
      keywords: ['qr', 'escanear', 'pagar', 'tarjeta virtual', 'camara'],
      description: 'Cómo usar el lector de cámara para abonar compras o transferir mediante la tarjeta digital.',
      content: (
        <div className="space-y-4">
          <p>
            El sistema de códigos QR simula un flujo de pago físico:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>En la wallet, presiona **"Mi Tarjeta"** para visualizar el código QR de tu cuenta que contiene tus datos cifrados en formato JSON. Puedes descargar el QR en PNG o copiar el número de tarjeta <code>OSCXXXXXX</code>.</li>
            <li>Para pagar a otro usuario o comercio, presiona **"Escanear QR"**. El sistema solicitará permisos de cámara.</li>
            <li>Enfoca el QR de cobro del comercio. El sistema emitirá un sonido de lectura, cargará el total del ticket POS, validará tu saldo de wallet y te pedirá confirmar el PIN para liquidar la venta.</li>
          </ol>
        </div>
      )
    },

    // === VENDEDOR ===
    {
      id: 'configurar-tienda',
      title: 'Creación y Configuración de Tiendas',
      tab: 'vendedor',
      keywords: ['tienda', 'crear tienda', 'comerciante', 'logo', 'banner', 'whatsapp'],
      description: 'Paso a paso para configurar tu perfil comercial y subir logo y banner.',
      content: (
        <div className="space-y-4">
          <p>
            Al asumir el rol de Vendedor, el sistema te redirigirá a la pantalla de configuración comercial en `/vendedor/tienda`:
          </p>
          <ul className="space-y-2 text-sm">
            <li><strong>Configuración Inicial:</strong> Registra el Nombre de tu Tienda, descripción comercial, dirección física, email y teléfono oficial de contacto.</li>
            <li><strong>Imágenes de Marca:</strong> Sube tu logo (formato circular de aspecto 1:1) y un banner publicitario (aspecto apaisado para la cabecera de la tienda).</li>
            <li><strong>WhatsApp Business:</strong> Registra tu número de Whatsapp comercial. El sistema habilitará botones automáticos en el Marketplace para que los compradores puedan chatear contigo directamente sobre tus productos.</li>
            <li><strong>Visibilidad en Línea:</strong> Usa el interruptor "Tienda Online / Offline" para ocultar o publicar todo tu catálogo en la plataforma de inmediato.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'pos-comercial',
      title: 'Punto de Venta (POS) Completo y Métodos de Cobro',
      tab: 'vendedor',
      keywords: ['pos', 'punto de venta', 'cobrar', 'efectivo', 'tarjeta', 'f2', 'contado', 'credito'],
      description: 'Guía de uso de la terminal POS interactiva, ventas al contado, a crédito y cobros mediante Wallet QR.',
      content: (
        <div className="space-y-4">
          <p>
            El Punto de Venta (`/vendedor/pos`) está optimizado para agilizar transacciones en local comercial:
          </p>
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-purple-400">Paso 1: Armar el Carrito de Compra</h4>
            <p className="text-xs text-muted-foreground">
              Toca los artículos de la cuadrícula o lee el SKU con un escáner de códigos de barras (enfocando el campo de búsqueda rápida). Ajusta cantidades con los botones `+` y `-`.
            </p>
            
            <h4 className="font-bold text-sm text-purple-400">Paso 2: Asignar Cliente (Opcional)</h4>
            <p className="text-xs text-muted-foreground">
              Haz clic en el botón de cliente en la barra superior. Selecciona un cliente registrado en tu CRM local. Esto es **obligatorio** si la venta se registrará bajo la modalidad de crédito comercial.
            </p>
            
            <h4 className="font-bold text-sm text-purple-400">Paso 3: Cobrar (Tecla F2)</h4>
            <p className="text-xs text-muted-foreground">
              Presiona "Cobrar" o la tecla rápida **F2** para seleccionar las condiciones de cobro:
            </p>
            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li><strong>Contado - Efectivo:</strong> Digita el monto recibido del cliente; la pantalla calcula el cambio/vuelto de inmediato.</li>
              <li><strong>Contado - Tarjeta:</strong> Simula el cobro a través de una terminal de tarjetas bancarias.</li>
              <li><strong>Contado - Wallet QR:</strong> Genera un código QR de cobro exclusivo del ticket. El cliente escanea el código con su app móvil Oscorp y confirma el pago con su PIN. El POS detecta el pago de forma automática y emite el ticket.</li>
              <li><strong>Crédito:</strong> Registra la venta a cuenta corriente. Requiere un cliente asignado y añade la deuda a su ficha de balance.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'productos-crud',
      title: 'Gestión de Productos (Escribir, Editar y Eliminar)',
      tab: 'vendedor',
      keywords: ['productos', 'escribir', 'editar', 'eliminar', 'costo', 'ganancia', 'sku', 'inventario'],
      description: 'Gestión de inventario de productos físicos/servicios y uso de la calculadora de costo/ganancias.',
      content: (
        <div className="space-y-4">
          <p>
            El módulo de catálogo en `/vendedor/productos` permite mantener al día el inventario:
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <strong>Escribir (Crear Producto):</strong> Presiona **"Nuevo Producto"**. Registra el nombre, SKU único, categoría, stock inicial y visibilidad (Solo Online, Solo POS, o Ambos). Sube hasta 5 imágenes arrastrándolas al modal o pegando URLs directas.
            </li>
            <li>
              <strong>Calculadora Financiera de Costo/Margen:</strong>
              <div className="p-3 bg-slate-900 border border-white/5 rounded-xl font-mono text-xs text-purple-300 my-1">
                PRECIO VENTA = COSTO COMPRA * (1 + PORCENTAJE GANANCIA / 100)
              </div>
              <p className="text-xs text-muted-foreground">
                Si ingresas el **Costo de Compra** (₲) y el **Porcentaje de Ganancia** (%), el sistema calculará el **Precio de Venta** final de forma automática. También calcula el porcentaje a la inversa si modificas el costo y el precio final.
              </p>
            </li>
            <li>
              <strong>Editar:</strong> Haz clic en el botón de 3 puntos (⋯) de la fila y selecciona **"Editar"**. Permite ajustar stock, precios y agregar variantes (talla, color) con precios específicos.
            </li>
            <li>
              <strong>Eliminar:</strong> Pulsa **"Eliminar"** desde la lista de acciones. Aparecerá un cuadro de confirmación del navegador para verificar la acción de forma segura antes de realizar la baja permanente.
            </li>
          </ul>
        </div>
      )
    },

    // === ADMINISTRADOR ===
    {
      id: 'admin-dashboard',
      title: 'Panel del Administrador y Aprobaciones',
      tab: 'admin',
      keywords: ['admin', 'dashboard', 'aprobacion', 'creditos', 'retiros', 'suscripciones', 'usuarios', 'planes'],
      description: 'Guía del panel global, KPIs, edición de usuarios, asignación de planes y validación de cobros manuales.',
      content: (
        <div className="space-y-4">
          <p>
            El Administrador controla todo el backend operativo de Oscorp Platform en `/admin`:
          </p>
          <ul className="space-y-3 text-sm">
            <li>
              <strong>Dashboard & KPIs:</strong> Monitorea ventas globales de hoy, comisiones recaudadas, saldo total de wallets circulando, registros de nuevos usuarios y un gráfico comparativo de ingresos.
            </li>
            <li>
              <strong>Gestión de Usuarios (CRUD):</strong> En `/admin/usuarios` puedes crear nuevos usuarios, editar roles (Checkboxes para Cliente, Vendedor, Admin, Ingenio), suspender temporalmente accesos o eliminar cuentas permanentemente.
            </li>
            <li>
              <strong>Aprobación de Créditos y Retiros:</strong>
              <p className="text-xs text-muted-foreground mt-1">
                Revisa los archivos de identidad adjuntos en `/admin/creditos`. Al presionar **"Aprobar"**, el dinero se inyecta automáticamente de la cuenta de Oscorp al monedero del cliente. Igualmente, autoriza las solicitudes de retiros bancarios de los comerciantes verificando sus cuentas de banco registradas.
              </p>
            </li>
            <li>
              <strong>Gestión de Planes de Vendedores:</strong>
              <p className="text-xs text-muted-foreground mt-1">
                Configura si los vendedores operan bajo un plan de pago mensual/anual o bajo el modelo **"Por Comisión"**, fijando el porcentaje (ej: 5%) que el sistema retendrá automáticamente de cada venta online que realicen.
              </p>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'campanas-push',
      title: 'Campañas y Notificaciones Push en Tiempo Real',
      tab: 'admin',
      keywords: ['campañas', 'campanas', 'push', 'notificaciones', 'marketing', 'alertas', 'broadcast'],
      description: 'Envío de comunicados push y masivos en base al rol de usuario utilizando Web Push API.',
      content: (
        <div className="space-y-4">
          <p>
            Las notificaciones push permiten al administrador fidelizar y notificar cambios en la red desde `/admin/campanas`:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm">
            <li>Presiona **"Crear Campaña"** en el panel de campañas.</li>
            <li>Ingresa un título llamativo, el cuerpo del mensaje y el enlace de redirección.</li>
            <li>Selecciona el rol de destino: Todos, Clientes, Vendedores o Estudiantes de Ingenio Millonario.</li>
            <li>Presiona **"Enviar Ahora"**. El backend de Express procesará el envío en batch conectándose al Service Worker del navegador mediante las claves VAPID configuradas, entregando el aviso emergente de forma inmediata en las pantallas.</li>
          </ol>
        </div>
      )
    },

    // === TECNICO ===
    {
      id: 'tecnico-setup',
      title: 'Manual Técnico: Instalación, Carga y Dependencias',
      tab: 'tecnico',
      keywords: ['instalacion', 'compilar', 'software', 'npx', 'npm', 'despliegue', 'db', 'prisma', 'postgres'],
      description: 'Comandos técnicos para instalar dependencias, configurar variables de entorno y levantar el entorno de desarrollo.',
      content: (
        <div className="space-y-4">
          <p>
            Para levantar el ecosistema completo en un nuevo servidor o máquina de desarrollo local, siga estos comandos en terminal:
          </p>
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-emerald-400">1. Descargar Dependencias</h4>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npm install
            </pre>

            <h4 className="font-bold text-xs text-emerald-400">2. Variables de Entorno</h4>
            <p className="text-xs text-muted-foreground">
              Renombra el archivo <code>.env.local</code> o crea uno llamado <code>.env</code> en la raíz del proyecto. Configura:
            </p>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[10px] text-slate-400 overflow-x-auto">
{`DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="tu_clave_secreta_jwt"
SMTP_USER="tu_correo_gmail@gmail.com"
SMTP_PASS="tu_contrasena_aplicacion_gmail"
VAPID_PUBLIC_KEY="clave_publica_push"
VAPID_PRIVATE_KEY="clave_privada_push"`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'tecnico-database',
      title: 'Inicialización de Base de Datos y Datos Semilla (Seeds)',
      tab: 'tecnico',
      keywords: ['prisma', 'migrate', 'seed', 'db', 'base de datos', 'postgre', 'generar'],
      description: 'Cómo aplicar migraciones de base de datos PostgreSQL, generar bindings de Prisma y cargar datos iniciales.',
      content: (
        <div className="space-y-4">
          <p>
            El proyecto utiliza **Prisma ORM** para mapear los esquemas a la base de datos relacional PostgreSQL.
          </p>
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-emerald-400">1. Generación de Modelos de Cliente</h4>
            <p className="text-xs text-muted-foreground">Genera los bindings compilados en typescript para usar en el backend:</p>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npx prisma generate
            </pre>

            <h4 className="font-bold text-xs text-emerald-400">2. Sincronizar Esquema de Base de Datos</h4>
            <p className="text-xs text-muted-foreground">Aplica los esquemas de Prisma a tu base de datos relacional PostgreSQL:</p>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npx prisma db push
            </pre>

            <h4 className="font-bold text-xs text-emerald-400">3. Poblar Base de Datos (Seed)</h4>
            <p className="text-xs text-muted-foreground">Carga las cuentas administradoras de prueba, planes, categorías financieras y cursos base iniciales:</p>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npm run db:seed
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'tecnico-compilacion',
      title: 'Compilar y Ejecutar en Producción',
      tab: 'tecnico',
      keywords: ['compilar', 'build', 'vite', 'npm run build', 'ejecutar', 'produccion'],
      description: 'Pasos para generar los empaquetados optimizados para despliegue.',
      content: (
        <div className="space-y-4">
          <p>
            Para generar y correr los binarios optimizados reduciendo tiempos de respuesta de la plataforma en producción:
          </p>
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-emerald-400">1. Compilación del Frontend (React bundle con Vite)</h4>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npm run build
            </pre>

            <h4 className="font-bold text-xs text-emerald-400">2. Compilación del Backend (Servidor Express TypeScript a JS)</h4>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npm run server:build
            </pre>

            <h4 className="font-bold text-xs text-emerald-400">3. Levantar Servidor en Producción</h4>
            <pre className="p-3 bg-slate-950 border border-white/5 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto">
              npm run server:start
            </pre>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Para desarrollo local concurrente de cliente y servidor, ejecute: <code>npm run dev:full</code>.</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  // Filtering sections based on active tab and search query
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesTab = searchQuery ? true : sec.tab === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const matchesTitle = sec.title.toLowerCase().includes(query);
      const matchesDesc = sec.description.toLowerCase().includes(query);
      const matchesKeywords = sec.keywords.some((kw) => kw.toLowerCase().includes(query));

      return matchesTitle || matchesDesc || matchesKeywords;
    });
  }, [activeTab, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 font-sans text-left">
      
      {/* Header and top options (No-print) */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-500" /> Manual y Documentación del Sistema
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Guía de uso y procedimientos para clientes, comercios, administración y soporte técnico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" /> Exportar Manual a PDF
          </Button>
        </div>
      </div>

      {/* Search Bar (No-print) */}
      <div className="no-print relative">
        <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar un tema en el manual (ej: POS, registro, crédito, compilar, PIN)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11 pr-10 py-6 text-sm rounded-2xl border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-blue-500"
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

      {/* Tabs list (No-print) - hidden when searching */}
      {!searchQuery && (
        <div className="no-print flex p-1 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 'general', label: '🖥️ Visión General' },
            { id: 'cliente', label: '👤 Cliente / Usuario' },
            { id: 'vendedor', label: '🏬 Vendedor y POS' },
            { id: 'admin', label: '🛡️ Administración' },
            { id: 'tecnico', label: '⚙️ Manual Técnico' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[130px] py-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-800/10 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search results banner (No-print) */}
      {searchQuery && (
        <div className="no-print p-3 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl text-xs font-medium text-left">
          Mostrando resultados de búsqueda para "{searchQuery}" ({filteredSections.length} encontrados)
        </div>
      )}

      {/* Main Sections render (Web view) */}
      <div className="no-print space-y-6">
        {filteredSections.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl">
            <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">No se encontraron temas</h3>
            <p className="text-xs text-gray-500 mt-1">Prueba con palabras clave más sencillas como "POS", "crédito", "PIN" o "compilar".</p>
          </div>
        ) : (
          filteredSections.map((sec) => {
            const themeColor =
              sec.tab === 'cliente' ? 'border-l-blue-500' :
              sec.tab === 'vendedor' ? 'border-l-purple-500' :
              sec.tab === 'admin' ? 'border-l-indigo-500' :
              sec.tab === 'tecnico' ? 'border-l-emerald-500' :
              'border-l-slate-400';

            return (
              <motion.div
                key={sec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-900 rounded-2xl border-l-4 ${themeColor} border-y border-r border-gray-200 dark:border-slate-800/50 shadow-sm overflow-hidden`}
              >
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {sec.tab}
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
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* PRINT-ONLY COMPLETE DOCUMENT VIEW (Hidden in Web View) */}
      {/* ======================================================== */}
      <div className="print-layout hidden space-y-12 p-12 bg-white text-black leading-relaxed">
        {/* Cover Page */}
        <div className="print-page-break flex flex-col items-center justify-center min-h-[90vh] text-center pt-24">
          <img src="/images/oscorp-round.png" alt="Oscorp Logo" className="w-40 h-40 mb-8" />
          <h1 className="text-4xl font-black text-slate-950 mb-2">MANUAL INTEGRAL DE LA PLATAFORMA</h1>
          <h2 className="text-xl font-bold text-blue-600 mb-8">OSCORP PLATFORM</h2>
          <div className="w-24 h-1 bg-blue-600 mb-12"></div>
          <p className="text-base text-slate-600 max-w-xl mb-12">
            Guía Técnica, Comercial y Operativa Completa para Administradores, Comercios y Clientes.
          </p>
          <div className="text-xs text-slate-500 mt-24">
            <div>Sitio Oficial de Referencia: https://oscorp.com.py/</div>
            <div>Versión del Ecosistema: 1.0.0</div>
            <div>Fecha de Impresión: {new Date().toLocaleDateString('es-ES')}</div>
          </div>
        </div>

        {/* Section 1: Intro / General */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">1. Visión General y Roles del Sistema</h2>
          <p>
            **Oscorp Platform** es una suite paraguaya integrada de e-commerce y fintech de alto nivel.
          </p>
          <h3 className="text-lg font-bold text-blue-700 mt-4">1.1 Canales de Roles</h3>
          <p>
            Los roles operan dentro de una misma cuenta en base al vector <code>UserRole[]</code> del modelo de Prisma, permitiendo a los usuarios cambiar de interfaz instantáneamente sin perder su wallet:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Cliente (client):</strong> Monedero virtual, marketplace, transferencias P2P y solicitud de créditos.</li>
            <li><strong>Vendedor (seller):</strong> Configuración de tiendas públicas, base de CRM de clientes locales, inventario y POS.</li>
            <li><strong>Estudiante (ingenio):</strong> Academia premium de educación financiera y herramientas de gestión del flujo de caja.</li>
            <li><strong>Administrador (superadmin):</strong> Control financiero y de usuarios a nivel global del sistema.</li>
          </ul>
        </div>

        {/* Section 2: Cliente */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">2. Manual de Operaciones de Cliente</h2>
          
          <h3 className="text-lg font-bold text-blue-700 mt-4">2.1 Flujo de Registro y Teléfono Celular</h3>
          <p>
            El registro se inicia en <code>/register</code>. En el paso 1 se capturan Nombre, Apellido, Email y el <strong>número de teléfono celular completo</strong> (incluyendo el código de área, ej: <code>+595981XXXXXX</code>). En el paso 2 se asocia el rol. Al crearse, la cuenta queda inactiva hasta ingresar el token de verificación recibido por correo.
          </p>

          <h3 className="text-lg font-bold text-blue-700 mt-6">2.2 Monedero, Enviar P2P y QR</h3>
          <p>
            Desde la wallet el cliente visualiza su tarjeta <code>OSCXXXXXX</code> y saldo disponible. Para transferir, presiona **"Enviar"**, busca al destinatario por nombre o correo, digita el monto y confirma con su **PIN de seguridad de 4 dígitos** (cifrado con bcryptjs de fondo). Para pagar en tiendas, selecciona **"Escanear QR"**, activa la cámara del celular, lee el QR del POS del vendedor y autoriza la transacción.
          </p>

          <h3 className="text-lg font-bold text-blue-700 mt-6">2.3 Créditos Personales</h3>
          <p>
            El cliente puede solicitar préstamos indicando monto y cuotas (3 a 24 meses) y adjuntando imágenes de su **Cédula Frente y Dorso**. Al ser aprobados por el administrador, se inyecta el capital en la wallet y las cuotas se debitan mensualmente de forma automática al pulsar "Pagar cuota".
          </p>
        </div>

        {/* Section 3: Vendedor */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">3. Manual Comercial (Vendedor y POS)</h2>
          
          <h3 className="text-lg font-bold text-purple-700">3.1 Configuración de Tienda y CRUD de Productos</h3>
          <p>
            El comerciante ingresa a <code>/vendedor/tienda</code> para registrar su logo circular, banner horizontal y enlace oficial de WhatsApp Business. En <code>/vendedor/productos</code> gestiona su inventario. El sistema provee una calculadora financiera donde al ingresar el <strong>costo de compra</strong> del producto y el <strong>margen de ganancia (%)</strong> deseado, el software calcula de inmediato el precio público final. Las imágenes pueden ser cargadas localmente o mediante enlace URL.
          </p>

          <h3 className="text-lg font-bold text-purple-700 mt-6">3.2 Punto de Venta (POS) e Integración de Cobro QR</h3>
          <p>
            La terminal POS interactiva permite añadir productos con clics o escáneres de SKU láser. Soporta ventas al **Contado** o **Crédito** (cargando la cuenta corriente del cliente seleccionado). Los cobros al contado aceptan efectivo, tarjetas bancarias tradicionales o **Wallet QR** (genera un QR de pago interactivo que es escaneado por el cliente desde su monedero Oscorp, confirmando la venta de forma atómica sin contacto).
          </p>
        </div>

        {/* Section 4: Admin */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">4. Manual del Administrador Global</h2>
          <p>
            El superadministrador accede al panel en `/admin`:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Gestión de Usuarios:</strong> Edita datos, concede o revoca accesos manuales a "Ingenio Millonario" y activa/desactiva cuentas.</li>
            <li><strong>Planes Comerciales:</strong> Asigna tarifas fijas o comisiones de ventas (ej: 5%) a los vendedores de la red.</li>
            <li><strong>Validación de Cobros y Préstamos:</strong> Revisa y aprueba solicitudes de créditos de clientes y retiros de dinero solicitados por vendedores.</li>
            <li><strong>Campañas Web Push:</strong> Crea campañas de marketing segmentadas por roles para disparar alertas inmediatas a navegadores móviles y de escritorio.</li>
          </ul>
        </div>

        {/* Section 5: Técnico */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">5. Manual Técnico: Compilación y Carga</h2>
          <p>
            Guía de comandos básicos para instalación y despliegue del sistema:
          </p>
          <div className="bg-slate-100 p-4 rounded-xl font-mono text-xs border border-slate-300 space-y-2">
            <div># 1. Instalar dependencias</div>
            <div className="text-gray-500">npm install</div>
            <div># 2. Generar binds del ORM Prisma</div>
            <div className="text-gray-500">npx prisma generate</div>
            <div># 3. Empujar esquemas a PostgreSQL</div>
            <div className="text-gray-500">npx prisma db push</div>
            <div># 4. Poblar datos iniciales (Seed)</div>
            <div className="text-gray-500">npm run db:seed</div>
            <div># 5. Compilar cliente y servidor para producción</div>
            <div className="text-gray-500">npm run build && npm run server:build</div>
            <div># 6. Levantar servidor Express de producción</div>
            <div className="text-gray-500">npm run server:start</div>
          </div>
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

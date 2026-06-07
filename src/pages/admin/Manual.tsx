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
  AlertCircle,
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  DollarSign,
  Send,
  Bell,
  Wrench,
  Clock,
  Sparkles
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
          <ul className="space-y-2 text-sm text-gray-300">
            <li><strong className="text-blue-500">Cliente (client):</strong> Permite comprar en tiendas, escanear para pagar, solicitar préstamos y acceder a la wallet principal.</li>
            <li><strong className="text-purple-500">Vendedor (seller):</strong> Habilita la barra lateral del vendedor, creación de tienda, gestión de productos, inventario, pedidos y acceso al POS.</li>
            <li><strong className="text-pink-500">Estudiante Ingenio (ingenio):</strong> Otorga acceso a las herramientas del flujo de caja, ruleta educativa, descargas de materiales y la academia premium.</li>
            <li><strong className="text-indigo-500">Administrador (superadmin):</strong> Concede acceso total al panel global `/admin` para gestionar usuarios, créditos, reportes y configurar la plataforma.</li>
          </ul>
        </div>
      )
    },

    // === CLIENTE (13 SUB-MÓDULOS DETALLADOS) ===
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
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>
              <strong>Paso 1: Datos Personales.</strong> Ingresa Nombre, Apellido, Email y Contraseña. 
              <br />
              <strong className="text-amber-500">Carga del Número de Teléfono:</strong> Debes ingresar el número completo incluyendo el código de área del país (ejemplo para Paraguay: <code>+595981XXXXXX</code> o <code>0981XXXXXX</code>). El sistema valida este formato para habilitar transferencias automáticas por número telefónico.
            </li>
            <li>
              <strong>Paso 2: Tipo de Cuenta.</strong> Selecciona tu objetivo (Comprar, Vender o Educación Financiera). Esto preconfigura los roles iniciales de la cuenta.
            </li>
            <li>
              <strong>Paso 3: Verificación.</strong> El servidor crea un token criptográfico único. Recibirás un correo con un botón de verificación. Si estás en modo demo, el sistema mostrará el token de demostración en pantalla. Introduce este token en la pantalla de verificación para activar tu cuenta.
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
      id: 'client-inicio',
      title: '1. Inicio (Pantalla Principal del Cliente)',
      tab: 'cliente',
      keywords: ['cliente', 'inicio', 'tarjeta virtual', 'bienvenida', 'resumen hoy', 'accesos directos', 'menu inferior'],
      description: 'Guía de la pantalla de bienvenida del usuario, visualización de tarjeta y accesos directos.',
      content: (
        <div className="space-y-4 text-sm">
          <p>
            Al ingresar a la interfaz del cliente (`/app`), verás la pantalla de **Inicio** (Resumen de hoy), diseñada con un estilo premium y las siguientes secciones clave:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>
              <strong>Saludo Personalizado & Tarjeta de Débito Virtual:</strong>
              <br />
              Muestra el saludo principal (Ej: "¡Hola, Claudio!") y tu tarjeta digital **OSCORP PREMIUM** de color azul marino con chip integrado, antena contactless y un código QR de cobro impreso.
              <br />
              - **Número de Tarjeta (Ej: `OSC144394`):** Cuenta con un botón de copia rápida al portapapeles.
              <br />
              - **Nombre y Vencimiento:** Indica el nombre del titular y la fecha de vencimiento (`12/28`).
            </li>
            <li>
              <strong>Botón "VER QR":</strong>
              <br />
              Ubicado debajo de la tarjeta virtual. Al presionarlo, despliega un modal centrado con tu código QR de monedero para recibir cobros presenciales al instante.
            </li>
            <li>
              <strong>Cuadrícula de 8 Accesos Directos (Funciones de la Billetera):</strong>
              <br />
              Un panel interactivo para navegar rápidamente a cada módulo:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong className="text-blue-400">Enviar:</strong> Transferencias P2P directas ingresando destinatario y monto.</li>
                <li><strong className="text-emerald-400">Recibir:</strong> Muestra tu ficha de cobro maximizada con brillo de pantalla aumentado.</li>
                <li><strong className="text-purple-400">Préstamos:</strong> Solicitudes de financiamiento cargando foto de cédula (frente/dorso).</li>
                <li><strong className="text-amber-400">Recargar:</strong> Agrega saldos de prueba de forma instantánea a tu billetera.</li>
                <li><strong className="text-pink-400">E-Commerce:</strong> Directorio de tiendas comerciales online.</li>
                <li><strong className="text-yellow-400">Cursos:</strong> Academia y lecciones en video de educación financiera.</li>
                <li><strong className="text-cyan-400">Historial:</strong> Lista inmutable y filtros de todas tus transacciones.</li>
                <li><strong className="text-gray-400">Ajustes:</strong> Edición de perfil, notificaciones y carga de datos bancarios.</li>
              </ul>
            </li>
            <li>
              <strong>Tarjetas de Estado Inferiores:</strong>
              <br />
              - **TUS PEDIDOS:** Monitorea el estado logístico de tus compras en el Marketplace (ej: "Sin pedidos aún").
              <br />
              - **CRÉDITOS:** Informa el estado de tus cuotas y préstamos activos de manera directa (ej: "Sin créditos activos").
            </li>
            <li>
              <strong>Barra de Navegación Inferior Flotante (Menú):</strong>
              <br />
              Navegación persistente en móvil y escritorio con 5 accesos rápidos:
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>**INICIO (Casa):** Te lleva a este panel de resumen general.</li>
                <li>**BILLETERA (Monedero):** Abre la visualización detallada del saldo e ingresos/egresos del mes.</li>
                <li>**Botón Central QR (Azul):** Abre inmediatamente la cámara para Pago QR (Escanear y Pagar).</li>
                <li>**TIENDA (Bolsa):** Explora los catálogos y tiendas premium de la plataforma.</li>
                <li>**PERFIL (Usuario):** Abre tus configuraciones personales, avatar y datos de cobro bancario.</li>
              </ul>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-billetera',
      title: '2. Mi Billetera (Visualización de Balances y Flujos)',
      tab: 'cliente',
      keywords: ['cliente', 'billetera', 'balance', 'ingresos', 'egresos', 'ocultar saldo'],
      description: 'Control de saldo, estadísticas del mes y visualización analítica de ingresos/gastos.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Mi Billetera** (`/app/wallet`) consolida tus recursos económicos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Saldo Disponible:** Indicador grande de tu saldo actual en Guaraníes (₲). Cuenta con un botón de ojo (Ocultar/Ver) para proteger tu privacidad en espacios públicos.</li>
            <li>**Estadísticas Rápidas:** Dos widgets analíticos que muestran el total de **Ingresos del Mes** (barra verde) y **Egresos del Mes** (barra roja).</li>
            <li>**Historial Integrado:** Lista compacta de los últimos movimientos de la wallet con opción de filtrado rápido.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-tarjeta',
      title: '3. Mi Tarjeta (Diseños y Descarga de QR)',
      tab: 'cliente',
      keywords: ['cliente', 'tarjeta', 'diseño tarjeta', 'descargar qr', 'copiar nro'],
      description: 'Personalización del diseño visual de la tarjeta virtual y descarga del código de cobro.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Mi Tarjeta** (`/app/tarjeta`), gestionas las credenciales de tu plástico digital:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Personalizar Estilo:** Cambia el diseño visual de la tarjeta seleccionando entre las plantillas de colores disponibles (Azul Premium, Púrpura Gradiente, Oscuro Minimalista o HSL personalizado).</li>
            <li>**Descargar QR:** Presiona el botón **"Descargar QR"** para guardar tu código QR de monedero en un archivo PNG de alta resolución. Puedes compartir esta imagen por mensajería para que otros te paguen de forma remota.</li>
            <li>**Copiar Número de Tarjeta:** Haz clic en "Copiar Nro." para registrar la credencial en el portapapeles y enviarla en texto.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-pago-qr',
      title: '4. Pago QR (Escanear y Pagar en Comercios)',
      tab: 'cliente',
      keywords: ['cliente', 'pago qr', 'escanear qr', 'camara', 'confirmar pago', 'pin'],
      description: 'Cómo usar la cámara del teléfono para pagar en locales físicos y tiendas POS.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Pago QR** (`/app/escanear`) habilita el cobro sin contacto:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>Presiona **"Pago QR"** en la barra lateral o el botón flotante central de la barra inferior.</li>
            <li>Autoriza los permisos de cámara y enfoca el código QR presentado por el vendedor o el POS.</li>
            <li>El sistema leerá los datos del comercio. Si el QR tiene un monto pre-cargado, este se mostrará en pantalla. De lo contrario, digita el total a abonar.</li>
            <li>Presiona "Confirmar Pago" e ingresa tu **PIN de 4 dígitos** para debitar el saldo de tu wallet de forma inmediata.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'client-enviar',
      title: '5. Enviar (Transferencias P2P a Contactos)',
      tab: 'cliente',
      keywords: ['cliente', 'enviar', 'transferir', 'buscar contacto', 'pin transaccional'],
      description: 'Flujo completo para transferir dinero digital a amigos o familiares mediante email o teléfono.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El acceso de **Enviar** (ubicado en los botones rápidos de Inicio) realiza transferencias P2P inmediatas:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Buscar Destinatario:** Digita el nombre, correo electrónico o número de teléfono del contacto.</li>
            <li>**Monto y Mensaje:** Selecciona al usuario en la lista de coincidencias, ingresa el monto a transferir (₲) y escribe una nota opcional (Ej: "Pago de almuerzo").</li>
            <li>**Confirmación y PIN:** Verifica los datos de transferencia y autoriza ingresando tu PIN de 4 dígitos. El destinatario recibirá el importe y una alerta push en su dispositivo.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'client-recibir',
      title: '6. Recibir (Visualizar Ficha de Cobro)',
      tab: 'cliente',
      keywords: ['cliente', 'recibir', 'mostrar qr', 'cobrar qr'],
      description: 'Despliegue rápido de la ficha QR en pantalla para captar transferencias.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El botón rápido **Recibir** está diseñado para cobros presenciales:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>Al presionarlo, la pantalla aumenta su brillo y muestra de forma maximizada tu código QR y número de tarjeta.</li>
            <li>Permite que otra persona abra su escáner y apunte a tu pantalla para realizar el traspaso de fondos cara a cara sin ingresar datos manuales.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-prestamos',
      title: '7. Préstamos (Créditos Personales en Cuotas)',
      tab: 'cliente',
      keywords: ['cliente', 'prestamos', 'creditos', 'solicitar credito', 'cedula', 'interes', 'pagar cuota'],
      description: 'Cómo simular un préstamo, cargar las fotos de tu cédula y pagar las cuotas mensuales.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Préstamos** (`/app/creditos`) te permite gestionar tu financiación:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Simulación:** Ingresa el monto total a solicitar y selecciona la cantidad de cuotas (3 a 24). El sistema calcula en tiempo real la tasa de interés y el monto exacto de la cuota mensual a abonar.</li>
            <li>**Cargar Documentación:** Toma o sube dos fotos obligatorias: **Foto frontal de tu Cédula de Identidad** y **Foto del dorso de tu Cédula**. Envía la solicitud.</li>
            <li>**Pago de Cuotas:** Si el administrador aprueba tu crédito, los fondos se acreditarán en tu wallet. Cada mes, ingresa al historial de préstamos activos y presiona **"Pagar Cuota"** para realizar el débito automático de tu saldo disponible.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-recargar',
      title: '8. Recargar (Depósito de Saldo Simulador)',
      tab: 'cliente',
      keywords: ['cliente', 'recargar', 'depositar dinero', 'recarga virtual'],
      description: 'Simulador integrado para acreditar saldos de prueba de forma inmediata en tu wallet.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            La acción de **Recargar** te permite añadir saldos ficticios para testear el Marketplace y Cursos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>Presiona **"Recargar"** en la botonera rápida de Inicio.</li>
            <li>Selecciona el importe predefinido a cargar (₲ 50.000, ₲ 100.000, ₲ 500.000 o ₲ 1.000.000).</li>
            <li>Confirma la operación. Tu balance se actualizará al instante con una transacción registrada de tipo `deposit`.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-ecommerce',
      title: '9. E-Commerce (Directorio de Tiendas, Carrito y Compra)',
      tab: 'cliente',
      keywords: ['cliente', 'ecommerce', 'compras', 'tiendas', 'carrito', 'checkout', 'delivery', 'retiro'],
      description: 'Búsqueda de productos, carrito de compras, selección de envío y pago por wallet.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **E-Commerce** (`/app/tiendas` y `/app/carrito`) es el motor de compras online:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Explorar:** Navega por los catálogos organizados por categoría (Tecnología, Moda, Hogar, etc.) de las tiendas verificadas.</li>
            <li>**Carrito:** Agrega los artículos, ingresa al icono de carrito y ajusta las cantidades que deseas comprar.</li>
            <li>**Checkout:**
              <ul className="list-disc pl-5 mt-1">
                <li>Selecciona tipo de entrega: **Delivery** (envío a domicilio) o **Retiro en Tienda** (retiras en el local físico del vendedor).</li>
                <li>Selecciona método de pago: **Pagar con Wallet** (descuenta automáticamente de tu balance OSC) o **Pago Contra Entrega** (abonas al recibir).</li>
              </ul>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-cursos',
      title: '10. Cursos (Plataforma E-Learning de Capacitación)',
      tab: 'cliente',
      keywords: ['cliente', 'cursos', 'academia', 'inscribirse', 'lecciones', 'progreso'],
      description: 'Catálogo de cursos, registro a clases, visualización de lecciones en video y progreso del alumno.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El submódulo de **Cursos** (`/app/cursos`) te conecta con la capacitación financiera:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Inscripción:** Explora el catálogo de capacitaciones gratuitas o de pago. Si es de pago y no posees membresía Ingenio activa, se debitará el costo del curso de tu wallet.</li>
            <li>**Visualización:** Entra al curso para ver el temario dividido en módulos y lecciones. Reproduce los videos y consulta los materiales de apoyo.</li>
            <li>**Marcar Completado:** Al finalizar una clase, márcala como completada. El sistema recalculará tu barra de progreso (`0-100%`) y emitirá tu certificado al completar todas las lecciones.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-historial',
      title: '11. Historial (Estado y Auditoría de Movimientos)',
      tab: 'cliente',
      keywords: ['cliente', 'historial', 'movimientos', 'ingresos', 'egresos', 'compras', 'ventas'],
      description: 'Listado y auditoría de transacciones personales con filtros rápidos por tipo.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Historial** recopila y organiza todas las transacciones financieras de tu cuenta:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Buscador y Filtros:** Clasifica los movimientos en: Todo, Ingresos (depósitos, transferencias recibidas, créditos cobrados) o Gastos (compras, cuotas pagadas, transferencias enviadas).</li>
            <li>**Código de Colores:** Los ingresos se marcan con un signo positivo (`+`) y color verde; los egresos con un signo negativo (`-`) y color rojo.</li>
            <li>**Ficha de Detalle:** Haz clic sobre cualquier transacción para desplegar el ID único de auditoría, la fecha y hora exacta, la descripción y el estado de la operación.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'client-ajustes',
      title: '12. Ajustes (Configuración del Perfil y Datos Bancarios)',
      tab: 'cliente',
      keywords: ['cliente', 'ajustes', 'perfil', 'datos bancarios', 'banco', 'cuenta corriente', 'notificaciones'],
      description: 'Edición de información personal, carga de datos de transferencia y switch de notificaciones.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Ajustes** (`/app/perfil` y menús de Perfil), configuras tus preferencias de cuenta:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Editar Perfil:** Modifica tu foto de perfil (avatar), nombre, apellido, dirección de domicilio y teléfono.</li>
            <li>**Datos Bancarios:** Registra el nombre de tu Banco, número de cuenta bancaria y tipo de cuenta (Ahorro/Corriente). Estos datos son obligatorios si solicitas retiros de dinero de tu wallet a tu cuenta corriente física.</li>
            <li>**Notificaciones Push:** Activa o desactiva las alertas del navegador para recibir avisos de compras y transferencias.</li>
          </ul>
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
          <ul className="space-y-2 text-sm text-gray-300">
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
            El POS (`/vendedor/pos`) está optimizado para agilizar transacciones en local comercial:
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
          <ul className="space-y-3 text-sm text-gray-300">
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

    // === ADMINISTRADOR (16 SUB-MÓDULOS) ===
    {
      id: 'admin-dashboard',
      title: '1. Dashboard (Panel Principal Admin)',
      tab: 'admin',
      keywords: ['admin', 'dashboard', 'resumen', 'kpi', 'graficos', 'metricas'],
      description: 'Cómo supervisar el estado financiero y operativo general de la plataforma.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El **Dashboard** (`/admin`) es la pantalla de control principal del administrador. Contiene:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**KPIs Clave:** Resumen de Usuarios Totales, Tiendas Activas, Productos en catálogo, Ventas de hoy, Ingresos acumulados del mes y Créditos activos.</li>
            <li>**Tendencias comparativas:** Cada KPI muestra una variación porcentual en verde (crecimiento) o rojo (reducción) en comparación con el mes anterior.</li>
            <li>**Gráficos en tiempo real:** Gráfico mensual de Ventas vs Comisiones recaudadas (5% de retención base), barra de crecimiento de usuarios (clientes frente a vendedores), y distribución del estado de pedidos en gráfico de dona.</li>
            <li>**Tablas de Monitoreo:** Resumen de las últimas 5 órdenes de compra y las últimas 5 transacciones de wallet realizadas en todo el ecosistema.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-tiendas',
      title: '2. Tiendas (Gestión de Comercios)',
      tab: 'admin',
      keywords: ['admin', 'tiendas', 'aprobar tienda', 'verificar tienda', 'bloquear tienda'],
      description: 'Cómo verificar tiendas asociadas, modificar su estado de conexión y administrarlas.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En el módulo de **Tiendas** (`/admin/tiendas`), el administrador supervisa los perfiles de los vendedores:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Visualizar Catálogos:** Inspecciona los banners, logos, descripciones y datos de contacto de cada comercio.</li>
            <li>**Verificación (Badge Verificada):** Pulsa el botón "Verificar" en la ficha del comercio. Esto le añade un check azul de autenticidad en el Marketplace público, aumentando la confianza de los compradores.</li>
            <li>**Cambio de Estado:** Desactiva temporalmente tiendas que cometan faltas comerciales. Una tienda desactivada no aparecerá en el directorio público y sus productos quedarán ocultos temporalmente en el Marketplace.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-usuarios',
      title: '3. Usuarios (Gestión de Cuentas y Roles)',
      tab: 'admin',
      keywords: ['admin', 'usuarios', 'roles', 'contraseñas', 'modificar usuario', 'crear usuario', 'borrar usuario'],
      description: 'Control de perfiles, cambio de contraseñas, activación y borrado físico de cuentas.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Usuarios** (`/admin/usuarios`) administra las cuentas registradas en la base de datos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Crear Usuario:** Registra cuentas desde el panel asignándoles contraseña y roles inmediatos.</li>
            <li>**Asignación de Roles Múltiples:** Edita perfiles mediante casillas de verificación. Un mismo usuario puede tener checkboxes activados para Cliente (Wallet), Vendedor (POS/Tienda), Ingenio (Academia) y Admin (Acceso al panel). El backend autogenera billeteras si agregas el rol `client` y no existía una previamente.</li>
            <li>**Resetear Contraseñas:** Permite modificar la contraseña de cualquier usuario que deba blanquear accesos, cifrándola con bcrypt de forma segura al guardar.</li>
            <li>**Activar / Desactivar Cuentas:** Modifica el flag `isActive`. Si está desactivado, el usuario no podrá iniciar sesión.</li>
            <li>**Eliminación en Cascada:** Al presionar "Eliminar Usuario", la base de datos borrará la cuenta y todas sus relaciones (pedidos, productos, wallet) para evitar datos huérfanos.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-productos',
      title: '4. Productos (Monitoreo del Catálogo Global)',
      tab: 'admin',
      keywords: ['admin', 'productos', 'catalogo global', 'eliminar producto', 'precios'],
      description: 'Supervisión de artículos cargados por los vendedores y eliminación de contenido no permitido.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Productos** (`/admin/productos`), el administrador supervisa todo el inventario de la plataforma:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Búsqueda y Filtros:** Filtra productos por tienda de origen, categoría, stock y visibilidad (Online/POS).</li>
            <li>**Moderación:** Modifica o da de baja productos que infrinjan los términos de uso. La eliminación del producto es física y reduce el stock del marketplace de inmediato.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-pedidos',
      title: '5. Pedidos (Historial y Logística Global)',
      tab: 'admin',
      keywords: ['admin', 'pedidos', 'ordenes', 'comisiones', 'ganancias', 'seguimiento'],
      description: 'Supervisión de todas las compras online, comisiones retenidas y desglose de envíos.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Pedidos** (`/admin/pedidos`) consolida las transacciones de compraventa del Marketplace:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Inspección de Órdenes:** Visualiza el desglose completo del carrito comprado, datos del cliente, dirección de entrega y método de pago (Wallet o Contra entrega).</li>
            <li>**Desglose Monetario:** Rastrear el Subtotal, Impuesto, Costo de Envío, la **Comisión retenida para la plataforma** y la ganancia neta acreditada al vendedor.</li>
            <li>**Historial de Cambios de Estado:** Consulta el log temporal detallado (Tracking) que indica el día, hora y operador que cambió el pedido de "Pendiente" a "Confirmado", "Listo" o "Entregado".</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-finanzas',
      title: '6. Finanzas (Reportes de Rentabilidad de la Plataforma)',
      tab: 'admin',
      keywords: ['admin', 'finanzas', 'ganancia plataforma', 'balance general', 'comisiones acumuladas'],
      description: 'Visualización del balance contable general del ecosistema digital.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Finanzas** (`/admin/finanzas`) proporciona auditoría de rentabilidad:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Balance Consolidado:** Suma de ingresos totales (depósitos), egresos totales (retiros y créditos aprobados) y comisiones de plataforma.</li>
            <li>**Métricas de Comisión:** Reporte detallado de comisiones acumuladas provenientes del marketplace (5% default de ventas online).</li>
            <li>**Saldos en Tránsito:** Monitorea el volumen de dinero en estado "Pendiente" (retiros de efectivo solicitados que aún no se han aprobado).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-transacciones',
      title: '7. Transacciones (Auditoría del Ledger de Billeteras)',
      tab: 'admin',
      keywords: ['admin', 'transacciones', 'ledger', 'historial transacciones', 'auditar wallet'],
      description: 'Buscador y filtro global de todos los movimientos de saldo digital realizados.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Transacciones** (`/admin/transacciones`) es el registro inmutable de movimientos:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Historial Paginado:** Lista detallada que muestra fecha, ID, email del emisor, email del receptor, descripción, monto y estado.</li>
            <li>**Filtro por Tipo de Operación:** Clasifica las búsquedas por depósitos (`deposit`), retiros (`withdrawal`), transferencias P2P (`transfer_out` / `transfer_in`), compras en el marketplace (`purchase`), ventas (`sale`) y cobros de comisión (`commission`).</li>
            <li>**Trazabilidad:** Permite verificar auditorías en caso de disputas de pagos o transferencias P2P no reconocidas.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-retiros',
      title: '8. Retiros (Aprobación de Efectivo a Cuentas Bancarias)',
      tab: 'admin',
      keywords: ['admin', 'retiros', 'aprobar retiro', 'datos bancarios', 'rechazar retiro'],
      description: 'Cómo procesar las solicitudes de transferencia de saldo digital a cuentas bancarias físicas de los usuarios.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El flujo de **Retiros** (`/admin/retiros`) gestiona las salidas de dinero de las wallets de usuarios/comercios a sus cuentas bancarias:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Auditar Datos Bancarios:** Inspecciona la ficha del retiro que incluye: Banco del destinatario, Número de Cuenta, Tipo de Cuenta (Ahorro/Corriente), Nombre del Titular y su Documento de Identidad (CI/RUC).</li>
            <li>**Operación Externa:** El administrador debe ingresar al home banking físico de su banco y realizar la transferencia bancaria manual al destinatario por el monto indicado.</li>
            <li>**Aprobación:** Una vez realizada la transferencia manual, presiona **"Aprobar"** en el panel. El estado cambia a aprobado y se formaliza el débito en la billetera.</li>
            <li>**Rechazo:** Si los datos bancarios son erróneos, presiona **"Rechazar"**. El dinero retenido regresa automáticamente al saldo disponible de la wallet del usuario con una notificación de error.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'admin-creditos',
      title: '9. Créditos (Aprobación y Análisis de Préstamos)',
      tab: 'admin',
      keywords: ['admin', 'creditos', 'aprobar prestamos', 'cedula de identidad', 'amortizacion', 'desembolso'],
      description: 'Auditoría de imágenes de cédulas y activación de planes de amortización con desembolso automático.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En el módulo de **Créditos** (`/admin/creditos`), el administrador opera como la entidad crediticia:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground">
            <li>**Análisis de Documentación:** Abre la solicitud para inspeccionar los archivos de **Cédula de Identidad (Frente y Dorso)** cargados por el cliente.</li>
            <li>**Cálculo de Cuotas e Intereses:** Revisa la tabla de amortización con los vencimientos mensuales, monto solicitado, tasa de interés y valor exacto de la cuota.</li>
            <li>**Aprobación:** Presione **"Aprobar"**. Automáticamente:
              <ul className="list-disc pl-5 mt-1">
                <li>El estado del préstamo pasa a **Activo**.</li>
                <li>Se realiza una transferencia automática desde la cuenta de Oscorp acreditando el monto total solicitado al saldo disponible de la wallet del cliente.</li>
                <li>Se genera una notificación de acreditación inmediata en la cuenta del usuario.</li>
              </ul>
            </li>
            <li>**Rechazo:** Si los documentos son ilegibles o el perfil no califica, presiona **"Rechazar"** ingresando el motivo de rechazo.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-reportes',
      title: '10. Reportes (Auditoría y Descarga CSV)',
      tab: 'admin',
      keywords: ['admin', 'reportes', 'exportar csv', 'descargar excel', 'auditoria financiera'],
      description: 'Cómo generar y exportar listados de auditoría financiera con formato compatible para Excel.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Reportes** (`/admin/reportes`) recopila estadísticas de control fiscal:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Filtros de Exportación:** Selecciona rango de fechas, tipo de movimiento o estado del registro.</li>
            <li>**Exportación a CSV:** Haz clic en **"Exportar a CSV"**. El servidor generará un archivo con cabecera **BOM UTF-8** para asegurar que caracteres especiales e importes en Guaraníes se abran correctamente en Microsoft Excel.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-ingenio-master',
      title: '11. Ingenio Millonario (Gestión de la Academia y Ruleta)',
      tab: 'admin',
      keywords: ['admin', 'ingenio', 'setup inicial', 'ruleta', 'etapas', 'e1', 'e2', 'academia'],
      description: 'Inicialización de contenidos educativos, etapas de la ruleta de 10 pasos y academia.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Ingenio Millonario** (`/admin/ingenio`) permite estructurar el programa educativo premium:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Inicializar Sistema (Setup):** Si es la primera instalación, pulsa **"Setup Inicial"**. El sistema creará automáticamente las etapas **E1 (Fundamentos)** y **E2 (Maestría)**, configurará sus 10 segmentos respectivos de la ruleta con colores, e insertará dos cursos base en el e-learning.</li>
            <li>**Gestión de Segmentos:** Edita los títulos y descripciones de los 10 pasos de cada etapa (Mentalidad, Ahorro, Inversiones, etc.).</li>
            <li>**Carga de Contenido de Cursos:** Vincula lecciones de video (URLs de YouTube/Vimeo), documentos de lectura y resúmenes para cada etapa o segmento.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-suscripciones',
      title: '12. Suscripciones Ingenio (Habilitación de Estudiantes)',
      tab: 'admin',
      keywords: ['admin', 'suscripciones', 'aprobar ingenio', 'revocar acceso', 'transferencia bancaria'],
      description: 'Habilitación de estudiantes premium, registro de cuotas y aprobación de transferencias bancarias.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Suscripciones Ingenio** (`/admin/ingenio/suscripciones`), controlas quién tiene acceso al programa premium:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Aprobación de Transferencias Bancarias:** Cuando un alumno paga su suscripción mediante transferencia bancaria, el estado queda en `PENDING_APPROVAL`. Tras confirmar el cobro en tu banco, ingresa el monto recibido en el panel y pulsa **"Aprobar"**. El sistema habilitará el rol `ingenio` en su cuenta de inmediato.</li>
            <li>**Revocar Acceso:** Si el estudiante incumple el pago de sus cuotas mensuales de financiamiento, presiona **"Revocar Acceso"** para bloquear su ingreso a la academia y al dashboard financiero personal.</li>
            <li>**Restablecer / Eliminar:** Elimina la suscripción para realizar un reset completo del alumno (borrando sus avances y código de referido).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-materiales',
      title: '13. Materiales Ingenio (Gestión de Descargables)',
      tab: 'admin',
      keywords: ['admin', 'materiales', 'descargables', 'pdf', 'plantilla', 'excel', 'subir archivo'],
      description: 'Subida de archivos adjuntos, plantillas de presupuesto y guías PDF para alumnos.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Materiales** (`/admin/ingenio/materiales`) gestiona los recursos descargables:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Subir Recurso:** Presiona **"Nuevo Material"**. Carga el título, selecciona el tipo de archivo (PDF, Excel, Imagen), asigna la etapa (E1/E2) y el paso de la ruleta (1 al 10) al que pertenece.</li>
            <li>**Configurar Descarga:** Sube el archivo o ingresa su URL de almacenamiento, define si su acceso es público o requiere membresía activa y pulsa Guardar.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-campanas-push',
      title: '14. Campañas (Mensajes Push y Difusión Masiva)',
      tab: 'admin',
      keywords: ['admin', 'campañas', 'campanas', 'broadcast', 'push api', 'marketing', 'notificaciones'],
      description: 'Cómo disparar notificaciones push y alertas in-app a segmentos de usuarios.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Campañas** (`/admin/campanas`) opera como el portal de comunicación masiva:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Creación de Campaña:** Diseña comunicados agregando un título, descripción corta, imagen opcional y enlace de destino.</li>
            <li>**Segmentación:** Elige el grupo receptor: Todos los usuarios, solo Clientes, solo Vendedores o solo Estudiantes de la academia.</li>
            <li>**Envío (Web Push API):** Presiona **"Enviar"**. El servidor se conecta al Service Worker del navegador de cada usuario registrado, proyectando el mensaje emergente en pantallas móviles y de escritorio en tiempo real.</li>
            <li>**Estadísticas de Tasa de Clics:** Permite medir cuántas notificaciones fueron entregadas, cuántas leídas y cuántos clics totales se registraron.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-planes',
      title: '15. Planes (Suscripciones para Vendedores)',
      tab: 'admin',
      keywords: ['admin', 'planes', 'planes vendedor', 'membresias comercio', 'tarifas tiendas'],
      description: 'Cómo definir los planes comerciales y costos mensuales que pagan los vendedores para usar la plataforma.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            El módulo de **Planes** (`/admin/planes`) define la monetización del Marketplace:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Registrar Planes:** Crea ofertas comerciales como Plan Básico, Estándar y Comercial.</li>
            <li>**Costos y Ciclos:** Fija los precios en Guaraníes, los días de prueba gratuitos (ej: 7 días), el límite máximo de productos que pueden publicar y el ciclo de facturación (mensual, trimestral, anual).</li>
          </ul>
        </div>
      )
    },
    {
      id: 'admin-susc-vendedores',
      title: '16. Susc. Vendedores (Control de Membresías de Comercios)',
      tab: 'admin',
      keywords: ['admin', 'susc. vendedores', 'aprobar membresia vendedor', 'suscripciones tiendas'],
      description: 'Aprobación de pagos de membresías de comercios y activación de sus límites de catálogo.',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            En **Susc. Vendedores** (`/admin/planes/suscripciones`), controlas las membresías de los comercios:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
            <li>**Revisión de Pagos:** Verifica las solicitudes de activación de plan de las tiendas comerciales.</li>
            <li>**Aprobación:** Aprueba el pago del plan tras confirmar la acreditación bancaria, lo que actualiza la fecha de vencimiento del vendedor y activa su límite correspondiente de carga de productos.</li>
          </ul>
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
            <p className="text-xs text-muted-foreground">Genera los bindings de cliente compilados en typescript para usar en el backend:</p>
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
            <BookOpen className="w-7 h-7 text-blue-500" /> Manual y Documentación del Ecosistema
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
          placeholder="Buscar un tema en el manual (ej: POS, retiros, créditos, campañas, compilar, registro)..."
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
            <p className="text-xs text-gray-500 mt-1">Prueba con palabras clave más sencillas como "POS", "créditos", "campañas" o "compilar".</p>
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
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">1. Visión General y Roles del Ecosistema</h2>
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
            <li><strong>Administrador (superadmin):</strong> Control financiero y de usuarios a nivel de administración global.</li>
          </ul>
        </div>

        {/* Section 2: Cliente */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">2. Manual de Operaciones de Cliente (Billetera)</h2>
          
          {sections.filter(s => s.tab === 'cliente').map((sec, i) => (
            <div key={sec.id} className="mt-4 space-y-2">
              <h3 className="text-lg font-bold text-blue-700">{sec.title}</h3>
              <p className="text-xs italic text-gray-600">{sec.description}</p>
              <div className="text-sm text-slate-800">{sec.content}</div>
            </div>
          ))}
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

        {/* Section 4: Admin (Todos los submódulos impresos) */}
        <div className="print-page-break space-y-6">
          <h2 className="text-2xl font-black border-b pb-2 text-slate-900">4. Manual Completo del Administrador (16 Sub-módulos)</h2>
          
          {sections.filter(s => s.tab === 'admin').map((sec, i) => (
            <div key={sec.id} className="mt-4 space-y-2">
              <h3 className="text-lg font-bold text-indigo-700">{sec.title}</h3>
              <p className="text-xs italic text-gray-600">{sec.description}</p>
              <div className="text-sm text-slate-800">{sec.content}</div>
            </div>
          ))}
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  User,
  Shield,
  Cog,
  Download,
  Printer,
  ArrowRight,
  ArrowLeft,
  Terminal,
  LayoutDashboard,
  Database,
  Key,
  ShoppingCart,
  Percent,
  Smartphone,
  CreditCard,
  PlayCircle,
  HelpCircle,
  FileText,
  ChevronRight,
  Check,
  Building,
  Store,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  content: React.ReactNode;
  bgClass: string;
}

export default function SystemManual() {
  const [activeTab, setActiveTab] = useState<'presentacion' | 'cliente' | 'vendedor' | 'admin' | 'tecnico'>('presentacion');
  const [slideIndex, setSlideIndex] = useState(0);

  const handlePrint = () => {
    window.print();
  };

  const slides: Slide[] = [
    {
      title: "Oscorp Platform",
      subtitle: "Ecosistema Digital Integral E-Commerce + Fintech + E-Learning",
      bgClass: "from-[#0f172a] via-[#1e1b4b] to-[#0f172a]",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="animate-float mb-6">
            <img src="/images/oscorp-round.png" alt="Oscorp Logo" className="w-32 h-32 mx-auto drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-white">
            OSCORP <span className="gradient-text font-black">PLATFORM</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mb-8">
            Un ecosistema robusto de servicios financieros digitales, mercado multi-vendedor y academia de educación financiera unificados en un solo lugar.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-4">
            {[
              { label: "Fintech Wallet", desc: "Billetera P2P y Tarjetas QR", color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
              { label: "Marketplace", desc: "Tiendas y POS integrado", color: "border-purple-500/30 bg-purple-500/5 text-purple-400" },
              { label: "Créditos", desc: "Amortización automatizada", color: "border-indigo-500/30 bg-indigo-500/5 text-indigo-400" },
              { label: "Ingenio Millonario", desc: "Academia Financiera Premium", color: "border-pink-500/30 bg-pink-500/5 text-pink-400" }
            ].map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${item.color} backdrop-blur-sm`}>
                <div className="font-bold text-sm md:text-base">{item.label}</div>
                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Billetera Digital P2P y Tarjetas QR",
      subtitle: "El Núcleo Financiero de la Plataforma",
      bgClass: "from-[#0f172a] via-[#1e3a8a] to-[#0f172a]",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full max-w-5xl mx-auto px-6">
          <div className="text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" /> FINTECH SERVICES
            </div>
            <h3 className="text-3xl font-bold text-white">Transacciones Rápidas y Tarjetas Virtuales</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Cada usuario al registrarse obtiene una **Billetera Digital** y una **Tarjeta Virtual OSC** con un número único y un código QR estructurado.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>**Transferencias P2P**: Búsqueda por email o teléfono y envío con PIN de 4 dígitos.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>**Carga con QR**: Escaneo directo de tarjetas para pagos en comercios.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>**Historial de Ledger**: Registro inmutable de ingresos, egresos y comisiones.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center">
            {/* Visual virtual card */}
            <div className="w-80 h-48 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-[#0d2137] to-[#1a2744] shadow-2xl border border-white/10 text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="text-[10px] text-gray-400 tracking-wider">TARJETA DIGITAL PREMIUM</div>
                  <div className="text-sm font-bold text-white tracking-widest mt-0.5">OSCORP WALLET</div>
                </div>
                <img src="/images/oscorp-round.png" alt="Oscorp Mini" className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-lg font-mono text-gray-200 tracking-widest mb-4">OSC-8924-1729-9304</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[8px] text-gray-400">TITULAR</div>
                  <div className="text-xs font-semibold text-white">USUARIO DEMO</div>
                </div>
                <div className="bg-white p-1 rounded-md">
                  <div className="w-10 h-10 bg-black flex items-center justify-center text-[6px] text-white">QR CODE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Marketplace y Sistema POS Comercial",
      subtitle: "Habilitación Completa para Vendedores",
      bgClass: "from-[#0f172a] via-[#311042] to-[#0f172a]",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full max-w-5xl mx-auto px-6">
          <div className="flex justify-center order-2 md:order-1">
            <div className="w-full max-w-sm rounded-3xl p-6 bg-slate-900/80 border border-purple-500/20 backdrop-blur-md shadow-2xl space-y-4 text-left">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs text-purple-400 font-bold flex items-center gap-1"><Store className="w-4 h-4" /> PUNTO DE VENTA (POS)</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Sesión Activa</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>1x iPhone 15 Pro</span>
                  <span>₲ 8.500.000</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>2x Funda Protectora</span>
                  <span>₲ 300.000</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/5">
                  <span>Total a Cobrar</span>
                  <span className="text-purple-400">₲ 8.800.000</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-slate-800 rounded-lg text-center text-[10px] text-gray-300 border border-white/5 cursor-pointer">Efectivo</div>
                <div className="p-2 bg-slate-800 rounded-lg text-center text-[10px] text-gray-300 border border-white/5 cursor-pointer">Tarjeta</div>
                <div className="p-2 bg-purple-500/20 rounded-lg text-center text-[10px] text-purple-400 border border-purple-500/40 cursor-pointer">Wallet QR</div>
              </div>
              <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1">
                COBRAR (F2) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="text-left space-y-4 order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold">
              <Store className="w-3.5 h-3.5" /> TIENDA MULTI-VENDEDOR
            </div>
            <h3 className="text-3xl font-bold text-white">Ventas Online y Físicas Unificadas</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Los vendedores cuentan con una tienda virtual pública y un potente **Punto de Venta (POS)** para registrar ventas físicas y cobrar a través del QR del monedero del cliente.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>**POS de Cobro Inteligente**: Efectivo, tarjeta y wallet QR integrado.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>**Calculadora de Márgenes**: Define costos y porcentajes; el precio de venta se calcula de inmediato.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-purple-400 shrink-0" />
                <span>**Gestión Logística**: Avance del pedido de "Pendiente" a "Entregado" con notificaciones automáticas al cliente.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Ingenio Millonario",
      subtitle: "Habilitación Completa para Vendedores",
      bgClass: "from-[#0f172a] via-[#581c87] to-[#0f172a]",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full max-w-5xl mx-auto px-6">
          <div className="text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> PROGRAMA PREMIUM
            </div>
            <h3 className="text-3xl font-bold text-white">Educación Financiera y Finanzas Personales</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              El módulo estrella de la plataforma. Diseñado con una estructura en etapas (E1 y E2) y una **ruleta pedagógica de 10 principios financieros** por nivel.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>**Gestión de Contabilidad**: Seguimiento de Activos, Pasivos, Ingresos y Gastos de caja.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>**Metas de Ahorro y Presupuestos**: Control de límites mensuales y registro de bitácoras de ahorro.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>**Sistema de Referidos**: Creación de códigos únicos de referido para invitar a nuevos estudiantes y rastrear beneficios.</span>
              </li>
            </ul>
          </div>
          <div className="flex justify-center">
            {/* Visual wheel segment representation */}
            <div className="relative w-64 h-64 rounded-full border-4 border-violet-500/30 flex items-center justify-center bg-slate-950/60 shadow-2xl">
              <div className="absolute inset-2 rounded-full border-2 border-dashed border-violet-500/20"></div>
              <div className="absolute w-4 h-4 bg-violet-500 rounded-full z-10 animate-pulse"></div>
              <div className="text-center z-10 px-4">
                <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Etapa E1</div>
                <div className="text-lg font-black text-white mt-1">10 PASOS</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Fundamentos Financieros</div>
              </div>
              {/* Dots around the circle */}
              {[...Array(10)].map((_, i) => {
                const angle = (i * 360) / 10;
                return (
                  <div
                    key={i}
                    className="absolute w-6 h-6 rounded-full bg-slate-800 text-[10px] text-gray-400 flex items-center justify-center font-bold border border-violet-500/30"
                    style={{
                      transform: `rotate(${angle}deg) translate(110px) rotate(-${angle}deg)`
                    }}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Arquitectura y Stack Técnico",
      subtitle: "Un Ecosistema Robusto y Escalable",
      bgClass: "from-[#0f172a] via-[#0f2d2a] to-[#0f172a]",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full max-w-5xl mx-auto px-6">
          <div className="flex flex-col justify-center gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm">
                <Database className="w-4 h-4" /> Base de Datos Relacional
              </div>
              <p className="text-xs text-gray-300">
                PostgreSQL gestionado a través de **Prisma ORM (v6.8.0)**. Soporta transacciones atómicas para compras, transferencias e inscripciones.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm">
                <Terminal className="w-4 h-4" /> Node.js & Express API
              </div>
              <p className="text-xs text-gray-300">
                Servidor Express.js estructurado en controladores, servicios y middlewares de seguridad como `authenticate` y `requireActiveSubscription`.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 text-left">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2 text-sm">
                <Key className="w-4 h-4" /> Seguridad y Notificaciones
              </div>
              <p className="text-xs text-gray-300">
                Autenticación robusta con JSON Web Tokens (JWT) y hashes de contraseña bcryptjs. Sistema integrado de **Web Push API (VAPID)** para alertas en tiempo real.
              </p>
            </div>
          </div>
          <div className="text-left space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <Cog className="w-3.5 h-3.5" /> STACK TECNOLÓGICO
            </div>
            <h3 className="text-3xl font-bold text-white">Desarrollado para Alta Performance</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              El frontend corre sobre **React 19 + TypeScript + Vite** con estilos rápidos y adaptables provistos por Tailwind CSS y animaciones en Framer Motion.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Vite', 'React 19', 'Tailwind', 'Express', 'Prisma ORM', 'PostgreSQL', 'Zustand', 'JWT', 'Web Push'].map((tech) => (
                <span key={tech} className="px-2.5 py-1 bg-slate-800 rounded-lg text-xs text-emerald-300 border border-emerald-500/10">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-foreground pb-12 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none -z-10"></div>
      <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* HEADER (No-print) */}
      <header className="no-print border-b border-white/5 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/oscorp-round.png" alt="Oscorp Logo" className="w-9 h-9 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]" />
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">OSCORP</span>
              <span className="text-xs block text-gray-400 font-semibold mt-[-4px]">CENTRO DE DOCUMENTACIÓN</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Printer className="w-4 h-4" /> Exportar a PDF / Imprimir
            </button>
          </div>
        </div>
      </header>

      {/* TABS SELECTOR (No-print) */}
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex p-1 bg-slate-900/80 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar gap-1">
          {[
            { id: 'presentacion', label: '🖥️ Presentación', desc: 'Diapositivas' },
            { id: 'cliente', label: '👤 Cliente', desc: 'Guía de Usuario' },
            { id: 'vendedor', label: '🏬 Vendedor y POS', desc: 'Guía Comercial' },
            { id: 'admin', label: '🛡️ Administrador', desc: 'Guía del Panel' },
            { id: 'tecnico', label: '⚙️ Técnico', desc: 'Instalación y Carga' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl transition-all text-center relative ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="text-xs md:text-sm">{tab.label}</div>
              <div className={`text-[9px] block ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                {tab.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* TAB: PRESENTATION (No-print) */}
        {activeTab === 'presentacion' && (
          <div className="no-print">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-950">
              <div className={`py-16 md:py-24 bg-gradient-to-b ${slides[slideIndex].bgClass} transition-all duration-700 min-h-[480px] flex flex-col justify-between relative`}>
                {/* Visual grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                
                <div className="text-center px-4 mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {slides[slideIndex].title}
                  </span>
                  <p className="text-xs text-gray-400 mt-2 font-medium">{slides[slideIndex].subtitle}</p>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={slideIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      {slides[slideIndex].content}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Footer */}
                <div className="flex justify-between items-center px-6 md:px-12 pt-6 border-t border-white/5 mt-8">
                  <div className="flex gap-1">
                    {slides.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-800'}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePrevSlide}
                      className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-gray-400 hover:text-white transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="p-2 rounded-xl bg-slate-900 border border-white/5 hover:bg-slate-800 text-gray-400 hover:text-white transition-all"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Helper under the slider */}
            <div className="mt-8 p-6 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-400" />
                <div className="text-left">
                  <h4 className="font-bold text-white text-sm">¿Deseas el manual completo en un solo documento?</h4>
                  <p className="text-xs text-gray-400">Presiona el botón "Exportar a PDF" de arriba para abrir la vista de impresión optimizada.</p>
                </div>
              </div>
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Ver Formato PDF
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TABS CONTENT - WEB VIEW */}
        {/* ======================================================== */}
        <div className="no-print mt-4">
          
          {/* CLIENT MANUAL */}
          {activeTab === 'cliente' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-left">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-400" /> MANUAL DE USUARIO / CLIENTE
                </h2>
                <p className="text-gray-400 text-sm">Este manual cubre todas las operaciones que realiza un usuario regular en la plataforma (Wallet, Marketplace, Cursos y Créditos).</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 text-left">
                  {/* Sec 1: Registro */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">1</span>
                      Registro e Inicio de Sesión
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Para crear una cuenta nueva en **Oscorp Platform**:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-xs text-gray-400">
                        <li>Presiona el botón **"Regístrate"** en la pantalla de bienvenida.</li>
                        <li>
                          **Formulario Paso 1 (Datos Personales)**: Carga tu nombre, apellido, correo electrónico (será tu usuario), número de teléfono completo y contraseña de seguridad (mínimo 8 caracteres, 1 número y 1 letra).
                        </li>
                        <li>
                          **Formulario Paso 2 (Tipo de cuenta)**: Elige el rol inicial de tu cuenta seleccionando la tarjeta: **Usuarios** (para billetera y compras), **Comerciante** (vendedor con POS) o **Ingenio Millonario** (programa financiero).
                        </li>
                        <li>
                          **Formulario Paso 3 (Confirmación)**: Revisa tus datos y presiona **"Crear Cuenta"**.
                        </li>
                      </ol>
                      <div className="p-3 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex gap-2">
                        <Lock className="w-4 h-4 shrink-0" />
                        <div>
                          **Verificación Obligatoria**: Antes de iniciar sesión debes verificar tu email pulsando el botón en el correo recibido. En modo demo, copia el token y pégalo en la pantalla.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sec 2: Billetera */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">2</span>
                      Operaciones de Wallet y Pago QR
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Al ingresar a la interfaz del Cliente en `/app` verás tu **Tarjeta Digital**. Desde aquí puedes realizar las siguientes acciones financieras:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Recibir / Ver QR</div>
                          <p className="text-[11px] text-gray-400 mt-1">Presiona "Recibir". Mostrará tu tarjeta con un QR único de tu cuenta. También puedes copiar tu número de tarjeta OSC en un clic.</p>
                        </div>
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Transferencias P2P</div>
                          <p className="text-[11px] text-gray-400 mt-1">Presiona "Enviar". Busca al usuario de destino por su nombre o correo electrónico, ingresa el monto, un mensaje y confirma ingresando tu PIN de seguridad.</p>
                        </div>
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Cargar / Pagar QR</div>
                          <p className="text-[11px] text-gray-400 mt-1">Presiona "Cargar" para abrir el escáner de cámara. Apunta al QR de otro usuario o de una tienda y confirma la transacción de forma inmediata.</p>
                        </div>
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Carga de Fondos (Simulada)</div>
                          <p className="text-[11px] text-gray-400 mt-1">En el módulo Wallet puedes pulsar "Depositar" para acreditar dinero ficticio de inmediato a tu saldo para realizar pruebas de flujo.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sec 3: Marketplace */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold">3</span>
                      Marketplace y Proceso de Compra
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        El sistema incluye un catálogo global de tiendas en `/app/tiendas`.
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-xs text-gray-400">
                        <li>**Explorar Tiendas**: Navega por las tiendas verificadas o busca productos en el Home.</li>
                        <li>**Agregar al Carrito**: Haz clic sobre cualquier producto y pulsa **"Agregar al Carrito"**.</li>
                        <li>**Gestión de Carrito**: Accede al carrito en la barra inferior para ajustar cantidades o quitar productos.</li>
                        <li>**Proceso de Checkout**:
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Elige tipo de entrega: **Delivery** (envío) o **Retiro en Tienda**.</li>
                            <li>Elige método de pago: **Pagar con Wallet** (usa tu saldo OSC) o **Pago Contra Entrega**.</li>
                          </ul>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Quick stats / design sidebar info */}
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-blue-500/20 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl"></div>
                    <HelpCircle className="w-8 h-8 text-blue-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">¿Cómo se configura el PIN?</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      La primera vez que vayas a transferir dinero o pagar con QR, el sistema detectará que no tienes un PIN transaccional y te solicitará crear uno de **4 dígitos**. 
                    </p>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Este PIN se encripta de forma segura en la base de datos y se te exigirá para autorizar cada retiro o transferencia.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 text-left">
                    <h4 className="font-bold text-white text-sm mb-3">Créditos Personales</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      Si necesitas financiamiento, puedes dirigirte a **"Mis Créditos"**:
                    </p>
                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>Solicita ingresando el monto y número de cuotas (3 a 24 meses).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>Carga imágenes claras de tu **Cédula de Identidad (Frente y Dorso)**.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>Una vez aprobado por el Administrador, el monto total se acreditará a tu Wallet.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>Paga tus cuotas mensualmente pulsando "Pagar Cuota" (se debita de tu Wallet).</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SELLER MANUAL */}
          {activeTab === 'vendedor' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-left">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Store className="w-6 h-6 text-purple-400" /> MANUAL DEL VENDEDOR / COMERCIANTE y POS
                </h2>
                <p className="text-gray-400 text-sm">Este manual cubre el flujo comercial del sistema: gestión de tiendas, inventario, proveedores, ventas físicas y POS.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 text-left">
                  {/* POS */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">1</span>
                      Uso del Punto de Venta (POS)
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        El POS interactivo (`/vendedor/pos`) está diseñado para realizar ventas físicas de mostrador ágilmente:
                      </p>
                      <ol className="list-decimal pl-5 space-y-2 text-xs text-gray-400">
                        <li>**Carga de Productos**: Haz clic sobre los productos del grid de catálogo en pantalla para añadirlos al ticket. También puedes usar el escáner de lector de código de barras físico enfocando el SKU en la barra de búsqueda.</li>
                        <li>**Asignar Cliente**: Opcionalmente, pulsa el botón de cliente en la barra superior para registrar un cliente específico (necesario si la venta es a Crédito).</li>
                        <li>**Cobrar (Tecla F2)**: Abre el modal de pago y selecciona el tipo de venta:
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>**Contado**: Pago inmediato por Efectivo (el sistema calcula el vuelto), Tarjeta de Débito/Crédito (terminal simulada) o **Wallet QR** (genera un QR de cobro que el cliente escanea desde su app para pagar de inmediato).</li>
                            <li>**Crédito**: Venta a cuenta para un cliente previamente registrado en tu CRM interno.</li>
                          </ul>
                        </li>
                        <li>**Impresión del Ticket**: Al finalizar el cobro se visualiza el ticket RUC digital con el desglose de productos, IVA (10%) y botón de impresión.</li>
                      </ol>
                    </div>
                  </div>

                  {/* PRODUCTS */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                      Gestión de Productos (Escribir, Editar, Eliminar)
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Administra tu catálogo desde `/vendedor/productos`:
                      </p>
                      <ul className="space-y-3 text-xs text-gray-400">
                        <li>
                          <strong className="text-white">Añadir Producto:</strong> Pulsa **"Nuevo Producto"**. Carga nombre, SKU único, fotos (hasta 5, por arrastre o URL), stock inicial y categoría.
                        </li>
                        <li>
                          <strong className="text-white">Calculadora Financiera:</strong> Ingresa el **Costo de Compra** del producto y el **Porcentaje de Ganancia** deseado. El sistema calculará automáticamente el **Precio de Venta final**. También funciona a la inversa.
                        </li>
                        <li>
                          <strong className="text-white">Visibilidad:</strong> Puedes configurar si el producto se vende "Solo Online" (Marketplace), "Solo Local" (POS físico de mostrador) o en "Ambos" entornos.
                        </li>
                        <li>
                          <strong className="text-white">Editar y Eliminar:</strong> Haz clic en el botón de 3 puntos (⋯) de la fila del producto para modificar datos o pulsar **"Eliminar"** (requiere confirmación del navegador para evitar pérdidas accidentales).
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* ORDERS */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-bold">3</span>
                      Procesamiento de Pedidos
                    </h3>
                    <div className="text-sm text-gray-300 space-y-2">
                      <p>
                        Cuando un cliente realiza un pedido online en tu tienda, aparecerá en el panel de `/vendedor/pedidos` como **Pendiente**.
                      </p>
                      <p className="text-xs text-gray-400">
                        Deberás avanzar su estado secuencialmente pulsando el botón azul de estado rápido en la tabla:
                      </p>
                      <div className="flex flex-wrap gap-2 py-2">
                        {['Pendiente', 'Confirmado', 'En Preparación', 'Listo', 'En Camino', 'Entregado'].map((status, i) => (
                          <div key={status} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                            {i > 0 && <ChevronRight className="w-3 h-3 text-purple-400" />}
                            <span className="px-2 py-0.5 bg-slate-800 rounded-md border border-white/5 text-gray-200">{status}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        Cada cambio de estado notifica automáticamente al usuario por medio de alertas en su cuenta y alertas push en el navegador.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/20 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl"></div>
                    <Store className="w-8 h-8 text-purple-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Configuración de la Tienda</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Antes de poder utilizar el POS o vender productos en el Marketplace, debes configurar tu perfil comercial en **`/vendedor/tienda`**.
                    </p>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      El sistema te pedirá el **Nombre comercial**, dirección física, teléfono, enlace de WhatsApp Business, redes sociales, y las imágenes de **Logo circular** y **Banner rectangular**.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 text-left">
                    <h4 className="font-bold text-white text-sm mb-3">Gestión de Proveedores</h4>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                      En el submódulo **"Proveedores"** y **"Compras"** puedes:
                    </p>
                    <ul className="space-y-2 text-xs text-gray-300">
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Registrar a tus proveedores mayoristas con RUC y teléfono.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>Cargar compras de stock realizadas a proveedores para llevar la contabilidad del costo de compra real del inventario.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ADMIN MANUAL */}
          {activeTab === 'admin' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-left">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-400" /> MANUAL DEL ADMINISTRADOR (SUPERADMIN)
                </h2>
                <p className="text-gray-400 text-sm">Este manual cubre el control de administración global, aprobación de finanzas, retiros y campañas de marketing de la plataforma.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 text-left">
                  {/* Admin User */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                      Administración de Usuarios y Asignación de Planes
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Desde `/admin/usuarios` tienes el control completo sobre las cuentas registradas en el sistema:
                      </p>
                      <ul className="space-y-3 text-xs text-gray-400">
                        <li>
                          <strong className="text-white">Gestión de Perfiles y Contraseñas:</strong> Permite editar datos de contacto, cambiar contraseñas de usuarios con problemas de acceso, y asignar o revocar roles (Cliente, Vendedor, Admin, Estudiante) mediante casillas de verificación directas.
                        </li>
                        <li>
                          <strong className="text-white">Control de Planes Comerciales:</strong> Para cuentas con rol de vendedor, a través del menú de 3 puntos (⋯) puedes configurar su plan de facturación (Básico, Estándar, Comercial) o cambiar su modelo a **"Por Comisión"**, especificando el porcentaje que la plataforma retendrá de cada venta online.
                        </li>
                        <li>
                          <strong className="text-white">Desactivar / Eliminar:</strong> Puedes suspender temporalmente el acceso de un usuario (`isActive = false`) o borrar su cuenta permanentemente (esta acción realiza un borrado en cascada de sus billeteras, órdenes y tiendas).
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Financial Controls */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">2</span>
                      Aprobación de Créditos y Suscripciones
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        El administrador actúa como la entidad validadora de transacciones manuales:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Aprobación de Créditos</div>
                          <p className="text-[11px] text-gray-400 mt-1">Revisa en `/admin/creditos` los documentos de identidad cargados por el cliente. Si todo es correcto, pulsa **"Aprobar"**. Esto cambiará el crédito a "Activo" y transferirá los fondos a la wallet del usuario automáticamente.</p>
                        </div>
                        <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5">
                          <div className="font-bold text-xs text-white">Suscripciones de Ingenio</div>
                          <p className="text-[11px] text-gray-400 mt-1">Cuando un usuario selecciona suscripción por "Transferencia Bancaria", queda en estado pendiente de aprobación. Valida la transferencia en tu cuenta bancaria y pulsa **"Aprobar"** para otorgarle el acceso premium de inmediato.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Push and Marketing */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">3</span>
                      Campañas de Notificaciones Push
                    </h3>
                    <div className="text-sm text-gray-300 space-y-2">
                      <p>
                        El panel de `/admin/campanas` permite realizar acciones de marketing directo:
                      </p>
                      <p className="text-xs text-gray-400">
                        Crea campañas especificando título, mensaje corto y rol de destino (ej: solo vendedores, solo estudiantes de Ingenio, o todos). Al guardar y enviar, el servidor enviará alertas directas al navegador de los usuarios a través del Service Worker de Web Push API, registrando la tasa de apertura y clics de la campaña.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-indigo-500/20 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl"></div>
                    <Shield className="w-8 h-8 text-indigo-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Dashboard de Control Global</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      El panel principal de administración brinda KPIs en tiempo real de la salud del negocio.
                    </p>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Visualiza gráficamente el volumen de transacciones de billetera, el crecimiento diario de la base de usuarios y reportes contables del mes consolidando comisiones ganadas y egresos por retiros.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TECHNICAL MANUAL */}
          {activeTab === 'tecnico' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 backdrop-blur-md text-left">
                <h2 className="text-2xl font-black text-white mb-2 flex items-center gap-2">
                  <Terminal className="w-6 h-6 text-emerald-400" /> MANUAL TÉCNICO: CARGA, COMPILACIÓN Y DESPLIEGUE
                </h2>
                <p className="text-gray-400 text-sm">Guía de comandos y flujo técnico para programadores y administradores de servidores sobre cómo inicializar y compilar el software.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6 text-left">
                  {/* Step 1 */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                      Instalación e Inicialización del Software
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Para descargar el software y levantar el entorno de desarrollo local por primera vez:
                      </p>
                      <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/5 space-y-2">
                        <div># 1. Instalar las dependencias del proyecto</div>
                        <div className="text-gray-400">npm install</div>
                        <div className="mt-2"># 2. Configurar el archivo de entorno</div>
                        <div className="text-gray-400">cp .env.example .env</div>
                      </div>
                      <p className="text-xs text-gray-400">
                        Asegúrate de configurar las variables del archivo `.env` (cadena de conexión de PostgreSQL `DATABASE_URL`, variables de correo SMTP y llaves Web Push VAPID).
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                      Base de Datos (Prisma ORM)
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Inicializa la base de datos PostgreSQL mapeando el esquema de Prisma y poblando los datos iniciales de prueba:
                      </p>
                      <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/5 space-y-2">
                        <div># Generar el cliente de Prisma</div>
                        <div className="text-gray-400">npm run db:generate</div>
                        <div className="mt-2"># Aplicar las migraciones a la base de datos</div>
                        <div className="text-gray-400">npm run db:push</div>
                        <div className="mt-2"># Poblar la BD con datos iniciales (Seed)</div>
                        <div className="text-gray-400">npm run db:seed</div>
                      </div>
                      <p className="text-xs text-gray-400">
                        El comando `db:seed` creará las cuentas de demostración (admin, cliente, vendedor, ingenio) y configurará los parámetros del sistema por defecto.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="p-6 rounded-3xl bg-slate-900/30 border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                      Compilación y Construcción para Producción
                    </h3>
                    <div className="text-sm text-gray-300 space-y-3">
                      <p>
                        Para compilar el código de TypeScript a JavaScript optimizado para producción tanto para el frontend como para el servidor backend:
                      </p>
                      <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 border border-white/5 space-y-2">
                        <div># Compilar Frontend (React Vite Bundle)</div>
                        <div className="text-gray-400">npm run build</div>
                        <div className="mt-2 font-bold"># Compilar Servidor Express Backend</div>
                        <div className="text-gray-400">npm run server:build</div>
                        <div className="mt-2"># Ejecutar en producción</div>
                        <div className="text-gray-400">npm run server:start</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-slate-900/80 border border-emerald-500/20 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                    <Terminal className="w-8 h-8 text-emerald-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Ejecución en Desarrollo</h4>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Durante la etapa de programación local, puedes iniciar el servidor Express y el cliente Vite al mismo tiempo utilizando:
                    </p>
                    <div className="bg-slate-950 p-3 rounded-lg font-mono text-xs text-emerald-400 border border-white/5 mt-2">
                      npm run dev:full
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                      Esto corre concurrentemente ambos entornos con escucha de cambios automáticos (hot-reload).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PRINT ONLY LAYOUT (Oculto en pantalla normal) */}
        {/* ======================================================== */}
        <div className="print-layout hidden space-y-12 text-left p-12 bg-white text-black leading-relaxed">
          {/* Cover Page */}
          <div className="print-page-break flex flex-col items-center justify-center min-h-[90vh] text-center pt-24">
            <img src="/images/oscorp-round.png" alt="Oscorp Logo" className="w-40 h-40 mb-8" />
            <h1 className="text-5xl font-black tracking-tight text-slate-950 mb-2">MANUAL COMPLETO DEL SISTEMA</h1>
            <h2 className="text-2xl font-bold text-blue-600 mb-8">OSCORP PLATFORM</h2>
            <div className="w-24 h-1 bg-blue-600 mb-12"></div>
            <p className="text-lg text-slate-600 max-w-xl mb-12">
              Ecosistema Integral de E-Commerce, Fintech y E-Learning de Alta Gama para Administración y Clientes.
            </p>
            <div className="text-sm text-slate-500 mt-24">
              <div>Sitio Oficial: https://oscorp.com.py/</div>
              <div>Versión del Software: 1.0.0</div>
              <div>Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</div>
            </div>
          </div>

          {/* Section 1: Intro */}
          <div className="print-page-break space-y-6">
            <h2 className="text-3xl font-extrabold border-b pb-2 text-slate-900">1. Introducción al Ecosistema Oscorp</h2>
            <p>
              **Oscorp Platform** es un ecosistema digital paraguayo integral que unifica cuatro pilares de negocios y finanzas dentro de una sola interfaz:
            </p>
            <table className="w-full text-left border-collapse border border-slate-300 text-sm mt-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-2.5 font-bold">Módulo</th>
                  <th className="border border-slate-300 p-2.5 font-bold">Funcionalidad Clave</th>
                  <th className="border border-slate-300 p-2.5 font-bold">Roles de Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2.5 font-bold">Billetera Digital (Wallet)</td>
                  <td className="border border-slate-300 p-2.5">Envío y recepción de dinero digital P2P, generación de tarjetas con QR.</td>
                  <td className="border border-slate-300 p-2.5">Cliente, Vendedor</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2.5 font-bold">Marketplace Multi-Tienda</td>
                  <td className="border border-slate-300 p-2.5">Creación de catálogo online, procesamiento de pedidos y delivery.</td>
                  <td className="border border-slate-300 p-2.5">Cliente, Vendedor</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2.5 font-bold">Créditos Automáticos</td>
                  <td className="border border-slate-300 p-2.5">Carga de cédula, amortización y pago de cuotas debitadas de la wallet.</td>
                  <td className="border border-slate-300 p-2.5">Cliente</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2.5 font-bold">Ingenio Millonario</td>
                  <td className="border border-slate-300 p-2.5">Academia financiera premium, control de flujo de caja personal.</td>
                  <td className="border border-slate-300 p-2.5">Estudiante Premium (Ingenio)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: Cliente */}
          <div className="print-page-break space-y-6">
            <h2 className="text-3xl font-extrabold border-b pb-2 text-slate-900">2. Manual de Usuario (Cliente)</h2>
            
            <h3 className="text-xl font-bold text-blue-700 mt-4">2.1 Registro en la Plataforma</h3>
            <p>
              El flujo de registro está estructurado en 3 fases para recopilar y verificar la identidad de los usuarios:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>Fase 1 - Datos Personales:</strong> Nombre completo, apellido, dirección de correo electrónico válida (usuario para el inicio de sesión) y número de teléfono celular completo. Se define una contraseña que cumpla con los estándares de seguridad mínimos (al menos una letra, un número y mínimo 8 caracteres).
              </li>
              <li>
                <strong>Fase 2 - Tipo de Cuenta:</strong> Elección del rol principal. Cada rol habilita interfaces y monederos específicos automáticamente de fondo en la base de datos relacional.
              </li>
              <li>
                <strong>Fase 3 - Verificación:</strong> Creación del perfil. El sistema genera un token criptográfico único con validez de 24 horas. El usuario debe ingresar a su correo para pulsar el enlace de verificación. Si la cuenta no está verificada, el sistema bloqueará el login automáticamente con un código de error 403.
              </li>
            </ol>

            <h3 className="text-xl font-bold text-blue-700 mt-6">2.2 Operaciones de Wallet y Pago con QR</h3>
            <p>
              Cada usuario tiene asignado un número de tarjeta con el formato <code>OSCXXXXXX</code> y un código QR que encapsula la información de su wallet:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Transferencia P2P:</strong> En la sección "Enviar", el usuario busca al receptor escribiendo su correo o teléfono. Ingresa el monto en Guaraníes (₲) y confirma mediante su <strong>PIN de Seguridad de 4 dígitos</strong>. Este PIN es hasheado con bcrypt al crearse.
              </li>
              <li>
                <strong>Pagar en Comercios (QR):</strong> El usuario selecciona el lector QR, lo que activa la cámara del dispositivo móvil. Al enfocar el código QR de un comercio o de otro usuario, se realiza la validación de saldo del emisor y se transfiere el dinero instantáneamente, registrando un movimiento tipo <code>purchase</code> y <code>sale</code> respectivamente.
              </li>
            </ul>

            <h3 className="text-xl font-bold text-blue-700 mt-6">2.3 Solicitud y Pago de Créditos</h3>
            <p>
              El módulo de préstamos permite a los clientes solicitar líneas de financiación directa en cuotas mensuales:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>El cliente ingresa a "Créditos" y selecciona el monto deseado y la cantidad de cuotas (3, 6, 12, 18 o 24 meses).</li>
              <li>Carga las imágenes obligatorias de su documento de identidad: <strong>Cédula Frente</strong> y <strong>Cédula Dorso</strong>.</li>
              <li>La solicitud ingresa al panel administrativo en estado <code>pending</code>. Una vez revisada y aprobada por el admin, el capital total se inyecta en la wallet del usuario, generándose la tabla de amortización de vencimientos mensuales.</li>
              <li>Cada mes, el cliente abona su cuota presionando "Pagar Cuota" en su interfaz, lo que realiza el cobro directo de su saldo de wallet disponible.</li>
            </ol>
          </div>

          {/* Section 3: Vendedor */}
          <div className="print-page-break space-y-6">
            <h2 className="text-3xl font-extrabold border-b pb-2 text-slate-900">3. Manual Comercial (Vendedor y POS)</h2>
            
            <h3 className="text-xl font-bold text-purple-700 mt-4">3.1 Configuración de Tienda</h3>
            <p>
              El comerciante debe inicializar su perfil de negocio en <code>/vendedor/tienda</code> para poder publicar productos en la plataforma pública o cobrar con el POS. Los campos requeridos son:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nombre legal y comercial de la tienda.</li>
              <li>Dirección física detallada y número de teléfono.</li>
              <li>Enlace de WhatsApp Business y perfiles de Facebook/Instagram.</li>
              <li>Carga de imágenes para el Logo comercial e imagen de portada (Banner).</li>
            </ul>

            <h3 className="text-xl font-bold text-purple-700 mt-6">3.2 Gestión de Catálogo e Inventario (CRUD)</h3>
            <p>
              La creación de productos requiere la especificación de un <strong>SKU único</strong> (Stock Keeping Unit). El sistema facilita un gestor financiero:
            </p>
            <div className="p-4 bg-slate-100 rounded-lg font-mono text-xs border border-slate-300">
              PRECIO DE VENTA = COSTO DE COMPRA + (COSTO DE COMPRA * PORCENTAJE DE GANANCIA / 100)
            </div>
            <p className="text-sm">
              Al cargar el costo de compra del producto y la ganancia deseada, el formulario de creación de productos calcula el precio público sugerido inmediatamente. Las imágenes se pueden subir arrastrándolas al recuadro o ingresando enlaces web directos. Para eliminar un producto, se debe seleccionar "Eliminar" en el menú de acciones del producto y confirmar en la ventana emergente.
            </p>

            <h3 className="text-xl font-bold text-purple-700 mt-6">3.3 Funcionamiento del Punto de Venta (POS)</h3>
            <p>
              El POS del comerciante es una de las pantallas más completas, integrando ventas físicas tradicionales con la wallet fintech de Oscorp:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Escanear Productos:</strong> Se realiza de forma ágil tocando la cuadrícula de artículos en pantalla o leyendo el SKU con un lector láser enfocado en el campo de texto.</li>
              <li><strong>Métodos de Cobro:</strong> Al pulsar "Cobrar" (o presionar la tecla rápida **F2**), se abre el modal que soporta pagos en efectivo (calculando el vuelto), tarjeta física (simulada) y **Cobro con Wallet QR**. Este último muestra un código de barras en pantalla con el identificador único y total de la venta; el cliente lo escanea con la cámara de su teléfono y, al confirmar, el sistema de base de datos realiza la transferencia de saldo y liquida el ticket POS automáticamente.</li>
              <li><strong>Ventas a Crédito:</strong> El vendedor puede fiar la compra asignando el ticket a un cliente previamente registrado en su base de datos comercial (CRM interno), cargando la deuda en su cuenta corriente comercial.</li>
            </ul>
          </div>

          {/* Section 4: Admin */}
          <div className="print-page-break space-y-6">
            <h2 className="text-3xl font-extrabold border-b pb-2 text-slate-900">4. Manual del Administrador</h2>
            <p>
              El rol de <code>superadmin</code> posee atribuciones globales sobre el funcionamiento financiero y operativo de la plataforma desde `/admin`:
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Gestión de Cuentas:</strong> Controla los roles de cada usuario y el estado de sus suscripciones. Permite modificar, bloquear y eliminar cuentas conflictivas.
              </li>
              <li>
                <strong>Aprobación de Transacciones:</strong> Valida retiros de dinero de monederos digitales solicitados por comerciantes y usuarios. Revisa los documentos cargados para aprobar créditos personales pendientes.
              </li>
              <li>
                <strong>Control de Suscripciones Premium:</strong> Administra el ingreso al programa "Ingenio Millonario". El administrador puede otorgar o revocar el flag <code>ingenioAccess</code> manualmente a cuentas que abonen por transferencia bancaria.
              </li>
              <li>
                <strong>Campañas y Marketing:</strong> Permite redactar comunicados masivos y enviarlos por medio de notificaciones Push del navegador a todos los dispositivos móviles y navegadores que posean suscripciones Web Push activas registradas en la base de datos.
              </li>
            </ul>
          </div>

          {/* Section 5: Technical */}
          <div className="print-page-break space-y-6">
            <h2 className="text-3xl font-extrabold border-b pb-2 text-slate-900">5. Manual Técnico: Compilación y Carga del Software</h2>
            <p>
              Detalles específicos para programadores y administradores sobre cómo instalar y compilar el ecosistema de Oscorp Platform en servidores propios.
            </p>

            <h3 className="text-xl font-bold text-emerald-700 mt-4">5.1 Requisitos de Entorno</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Node.js (versión 18 o superior recomendada).</li>
              <li>Base de datos PostgreSQL.</li>
              <li>Gestor de paquetes npm o yarn.</li>
            </ul>

            <h3 className="text-xl font-bold text-emerald-700 mt-6">5.2 Instalación de la Base de Datos</h3>
            <p>
              La estructura de la base de datos está modelada a través del archivo <code>schema.prisma</code>. Debe inicializarse ejecutando:
            </p>
            <div className="bg-slate-100 p-3 rounded font-mono text-xs border border-slate-300 space-y-1">
              <div># Instalar dependencias</div>
              <div>npm install</div>
              <div># Generar cliente ORM y migrar esquemas</div>
              <div>npx prisma generate</div>
              <div>npx prisma db push</div>
              <div># Cargar registros por defecto en la BD</div>
              <div>npm run db:seed</div>
            </div>

            <h3 className="text-xl font-bold text-emerald-700 mt-6">5.3 Procesos de Compilación</h3>
            <p>
              Para compilar el frontend y el backend de forma optimizada y segura:
            </p>
            <div className="bg-slate-100 p-3 rounded font-mono text-xs border border-slate-300 space-y-1">
              <div># Compilar el bundle estático del Frontend (React + Vite)</div>
              <div>npm run build</div>
              <div># Compilar el servidor de Backend a producción</div>
              <div>npm run server:build</div>
              <div># Iniciar la plataforma en modo producción</div>
              <div>npm run server:start</div>
            </div>
            
            <h3 className="text-xl font-bold text-emerald-700 mt-6">5.4 Ejecución de Desarrollo Concurrentemente</h3>
            <p>
              Para correr el entorno de desarrollo local con recarga en caliente de cliente y servidor al mismo tiempo:
            </p>
            <div className="bg-slate-100 p-3 rounded font-mono text-xs border border-slate-300">
              npm run dev:full
            </div>
          </div>
        </div>
      </main>

      {/* Embedded print css overrides */}
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

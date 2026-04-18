import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores';
import { useThemeStore } from '@/stores/themeStore';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';
import SellerLayout from '@/layouts/SellerLayout';
import ClientLayout from '@/layouts/ClientLayout';

// Public Pages
import LandingPage from '@/pages/public/LandingPage';
import LoginPage from '@/pages/public/LoginPage';
import RegisterPage from '@/pages/public/RegisterPage';
import StorePage from '@/pages/public/StorePage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';
import PricingPage from '@/pages/public/PricingPage';
import PresentacionE1 from '@/pages/public/PresentacionE1';
import PresentacionE2 from '@/pages/public/PresentacionE2';
import ForgotPasswordPage from '@/pages/public/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/public/ResetPasswordPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import type { UserRole } from '@/types';

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStores from '@/pages/admin/Stores';
import AdminUsers from '@/pages/admin/Users';

// Ingenio Pages
import IngenioLayout from '@/layouts/IngenioLayout';
import IngenioDashboard from '@/pages/ingenio/Dashboard';
import IngenioBudget from '@/pages/ingenio/Budget';
import IngenioReports from '@/pages/ingenio/Reports';
import IngenioAcademy from '@/pages/ingenio/Academy';
import IngenioCourseDetail from '@/pages/ingenio/CourseDetail';
import IngenioProfile from '@/pages/ingenio/Profile';
import AdminProducts from '@/pages/admin/Products';
import AdminOrders from '@/pages/admin/Orders';
import AdminFinances from '@/pages/admin/Finances';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminWithdrawals from '@/pages/admin/Withdrawals';
import AdminCredits from '@/pages/admin/Credits';
import AdminReports from '@/pages/admin/Reports';
import AdminIngenio from '@/pages/admin/Ingenio';
import AdminIngenioMaterials from '@/pages/admin/IngenioMaterials';
import IngenioMaterials from '@/pages/ingenio/Materials';
import AdminIngenioSubscriptions from '@/pages/admin/IngenioSubscriptions';
import AdminPlans from '@/pages/admin/Plans';
import AdminPushNotifications from '@/pages/admin/PushNotifications';
import AdminSettings from '@/pages/admin/Settings';
import AdminProfile from '@/pages/admin/Profile';

// Seller Pages
import SellerDashboard from '@/pages/seller/Dashboard';
import SellerStore from '@/pages/seller/Store';
import SellerProducts from '@/pages/seller/Products';
import SellerOrders from '@/pages/seller/Orders';
import SellerSales from '@/pages/seller/Sales';
import SellerWithdrawals from '@/pages/seller/Withdrawals';
import SellerReports from '@/pages/seller/Reports';
import SellerPOS from '@/pages/seller/POS';
import SellerSuppliers from '@/pages/seller/Suppliers';
import SellerCustomers from '@/pages/seller/Customers';
import SellerPurchases from '@/pages/seller/Purchases';
import SellerGestion from '@/pages/seller/Gestion';
import SellerProfile from '@/pages/seller/Profile';
import SellerSettings from '@/pages/seller/Settings';
import SellerPlans from '@/pages/seller/SellerPlans';

// Client Pages
import ClientHome from '@/pages/client/Home';
import ClientStore from '@/pages/client/Store';
import ClientStores from '@/pages/client/Stores';
import ClientProduct from '@/pages/client/Product';
import ClientCart from '@/pages/client/Cart';
import ClientCheckout from '@/pages/client/Checkout';
import ClientWallet from '@/pages/client/Wallet';
import ClientScan from '@/pages/client/Scan';
import ClientCard from '@/pages/client/Card';
import ClientOrders from '@/pages/client/Orders';
import ClientOrderDetail from '@/pages/client/OrderDetail';
import ClientProfile from '@/pages/client/Profile';
import ClientCredits from '@/pages/client/Credits';
import ClientIngenio from '@/pages/client/Ingenio';
import ClientIngenioStudy from '@/pages/client/IngenioStudy';
import ClientCourses from '@/pages/client/Courses';
import ClientCourseDetail from '@/pages/client/CourseDetail';
import ClientNotifications from '@/pages/client/Notifications';
import TransferMoney from '@/pages/client/TransferMoney';
import DepositPage from '@/pages/client/Deposit';
import { GlobalPaywall } from '@/components/ingenio/GlobalPaywall';

// Protected Route Component
function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { isAuthenticated, user, activeRole, isHydrated } = useAuthStore();

  if (!isHydrated) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Si por alguna razón no hay activeRole pero sí usuario, lo redirigimos 
  // para que la lógica de inicialización en el store actúe o lo mande al login
  if (!activeRole) {
    return <Navigate to="/login" replace />;
  }

  const hasAccess = allowedRoles.includes(activeRole);

  if (!hasAccess) {
    // Si intenta entrar a una ruta fuera de su contexto actual, 
    // lo devolvemos a su dashboard activo
    if (activeRole === 'superadmin') return <Navigate to="/admin" replace />;
    if (activeRole === 'seller') return <Navigate to="/vendedor" replace />;
    if (activeRole === 'ingenio') return <Navigate to="/ingenio" replace />;
    if (activeRole === 'client') return <Navigate to="/app" replace />;
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isHydrated, fetchCurrentUser } = useAuthStore();

  // 1. Initial re-validation on mount
  useEffect(() => {
    if (localStorage.getItem('oscorp-token')) {
      fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  // 2. Theme and Splash Screen management
  useEffect(() => {
    // Theme initialization
    const { resolvedTheme } = useThemeStore.getState();
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);

    // Hide splash screen only when hydrated
    if (isHydrated) {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 500);
      }
    }
  }, [isHydrated]);

  if (!isHydrated) return null;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/tienda/:slug" element={<StorePage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/precios" element={<PricingPage />} />
        <Route path="/presentacion-e1" element={<PresentacionE1 />} />
        <Route path="/presentacion-e2" element={<PresentacionE2 />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="tiendas" element={<AdminStores />} />
          <Route path="usuarios" element={<AdminUsers />} />
          <Route path="productos" element={<AdminProducts />} />
          <Route path="pedidos" element={<AdminOrders />} />
          <Route path="finanzas" element={<AdminFinances />} />
          <Route path="transacciones" element={<AdminTransactions />} />
          <Route path="retiros" element={<AdminWithdrawals />} />
          <Route path="creditos" element={<AdminCredits />} />
          <Route path="reportes" element={<AdminReports />} />
          <Route path="ingenio" element={<AdminIngenio />} />
          <Route path="ingenio/materiales" element={<AdminIngenioMaterials />} />
          <Route path="ingenio/suscripciones" element={<AdminIngenioSubscriptions />} />
          <Route path="campanas" element={<AdminPushNotifications />} />
          <Route path="planes" element={<AdminPlans />} />
          <Route path="configuracion" element={<AdminSettings />} />
          <Route path="perfil" element={<AdminProfile />} />
          <Route path="notificaciones" element={<ClientNotifications />} />
        </Route>

        {/* Seller Routes */}
        <Route
          path="/vendedor"
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SellerDashboard />} />
          <Route path="tienda" element={<SellerStore />} />
          <Route path="productos" element={<SellerProducts />} />
          <Route path="pedidos" element={<SellerOrders />} />
          <Route path="ventas" element={<SellerSales />} />
          <Route path="pos" element={<SellerPOS />} />
          <Route path="retiros" element={<SellerWithdrawals />} />
          <Route path="reportes" element={<SellerReports />} />
          <Route path="proveedores" element={<SellerSuppliers />} />
          <Route path="clientes" element={<SellerCustomers />} />
          <Route path="compras" element={<SellerPurchases />} />
          <Route path="gestion" element={<SellerGestion />} />
          <Route path="perfil" element={<SellerProfile />} />
          <Route path="configuracion" element={<SellerSettings />} />
          <Route path="notificaciones" element={<ClientNotifications />} />
          <Route path="planes" element={<SellerPlans />} />
        </Route>

        {/* Client Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute allowedRoles={['client', 'seller', 'superadmin']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientHome />} />
          <Route path="tiendas" element={<ClientStores />} />
          <Route path="tienda/:slug" element={<StorePage />} />
          <Route path="tienda" element={<ClientStore />} />
          <Route path="producto/:id" element={<ClientProduct />} />
          <Route path="carrito" element={<ClientCart />} />
          <Route path="checkout" element={<ClientCheckout />} />
          <Route path="escanear" element={<ClientScan />} />
          <Route path="wallet" element={<ClientWallet />} />
          <Route path="wallet/transferir" element={<TransferMoney />} />
          <Route path="wallet/recargar" element={<DepositPage />} />
          <Route path="tarjeta" element={<ClientCard />} />
          <Route path="pedidos" element={<ClientOrders />} />
          <Route path="pedidos/:id" element={<ClientOrderDetail />} />
          <Route path="perfil" element={<ClientProfile />} />
          <Route path="creditos" element={<ClientCredits />} />
          <Route path="ingenio" element={<ClientIngenio />} />
          <Route path="ingenio/estudiar" element={<ClientIngenioStudy />} />
          <Route path="cursos" element={<ClientCourses />} />
          <Route path="cursos/:id" element={<ClientCourseDetail />} />
          <Route path="notificaciones" element={<ClientNotifications />} />
        </Route>

        <Route
          path="/ingenio"
          element={
            <ProtectedRoute allowedRoles={['ingenio', 'client', 'seller', 'superadmin']}>
              <IngenioLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<IngenioDashboard />} />
          <Route path="presupuesto" element={<IngenioBudget />} />
          <Route path="reportes" element={<IngenioReports />} />
          <Route path="academia" element={<IngenioAcademy />} />
          <Route path="materiales" element={<IngenioMaterials />} />
          <Route path="cursos/:id" element={<IngenioCourseDetail />} />
          <Route path="wallet" element={<Navigate to="/app/wallet" replace />} />
          <Route path="profile" element={<IngenioProfile />} />
          <Route path="notificaciones" element={<ClientNotifications />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors />
      <GlobalPaywall />
    </BrowserRouter>
  );
}

export default App;

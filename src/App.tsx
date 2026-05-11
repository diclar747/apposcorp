import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore, useSettingsStore } from '@/stores';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GlobalPaywall } from '@/components/ingenio/GlobalPaywall';
import { MaintenanceOverlay } from '@/components/shared/MaintenanceOverlay';

// Layouts
import AdminLayout from '@/layouts/AdminLayout';
import SellerLayout from '@/layouts/SellerLayout';
import ClientLayout from '@/layouts/ClientLayout';
import IngenioLayout from '@/layouts/IngenioLayout';

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

// Admin Pages
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminStores from '@/pages/admin/Stores';
import AdminUsers from '@/pages/admin/Users';
import AdminProducts from '@/pages/admin/Products';
import AdminOrders from '@/pages/admin/Orders';
import AdminFinances from '@/pages/admin/Finances';
import AdminTransactions from '@/pages/admin/Transactions';
import AdminWithdrawals from '@/pages/admin/Withdrawals';
import AdminCredits from '@/pages/admin/Credits';
import AdminReports from '@/pages/admin/Reports';
import AdminIngenio from '@/pages/admin/Ingenio';
import AdminIngenioMaterials from '@/pages/admin/IngenioMaterials';
import AdminIngenioSubscriptions from '@/pages/admin/IngenioSubscriptions';
import AdminPushNotifications from '@/pages/admin/PushNotifications';
import AdminPlans from '@/pages/admin/Plans';
import AdminSellerSubscriptions from '@/pages/admin/SellerSubscriptions';
import AdminSettings from '@/pages/admin/Settings';
import AdminProfile from '@/pages/admin/Profile';

// Seller Pages
import SellerDashboard from '@/pages/seller/Dashboard';
import SellerStore from '@/pages/seller/Store';
import SellerProducts from '@/pages/seller/Products';
import SellerOrders from '@/pages/seller/Orders';
import SellerSales from '@/pages/seller/Sales';
import SellerPOS from '@/pages/seller/POS';
import SellerWithdrawals from '@/pages/seller/Withdrawals';
import SellerReports from '@/pages/seller/Reports';
import SellerSuppliers from '@/pages/seller/Suppliers';
import SellerCustomers from '@/pages/seller/Customers';
import SellerPurchases from '@/pages/seller/Purchases';
import SellerGestion from '@/pages/seller/Gestion';
import SellerProfile from '@/pages/seller/Profile';
import SellerSettings from '@/pages/seller/Settings';
import SellerPlans from '@/pages/seller/SellerPlans';

// Client Pages
import ClientDashboard from '@/pages/client/Home';
import ClientStores from '@/pages/client/Stores';
import ClientStoreDetail from '@/pages/client/Store';
import ClientScan from '@/pages/client/Scan';
import ClientWallet from '@/pages/client/Wallet';
import TransferMoney from '@/pages/client/TransferMoney';
import DepositPage from '@/pages/client/Deposit';
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
import ClientProduct from '@/pages/client/Product';
import ClientCart from '@/pages/client/Cart';
import ClientCheckout from '@/pages/client/Checkout';

// Ingenio Pages
import IngenioDashboard from '@/pages/ingenio/Dashboard';
import IngenioBudget from '@/pages/ingenio/Budget';
import IngenioReports from '@/pages/ingenio/Reports';
import IngenioAcademy from '@/pages/ingenio/Academy';
import IngenioMaterials from '@/pages/ingenio/Materials';
import IngenioCourseDetail from '@/pages/ingenio/CourseDetail';
import IngenioProfile from '@/pages/ingenio/Profile';

function App() {
  const { fetchCurrentUser, isHydrated, activeRole } = useAuthStore();
  const { fetchSettings, settings } = useSettingsStore();

  useEffect(() => {
    fetchCurrentUser();
    fetchSettings();
  }, [fetchCurrentUser, fetchSettings]);

  // Splash Screen Logic
  useEffect(() => {
    if (isHydrated) {
      const splash = document.getElementById('splash');
      if (splash) {
        splash.classList.add('hide');
        setTimeout(() => splash.remove(), 500);
      }
    }
  }, [isHydrated]);

  const isMaintenanceActive = settings.maintenance_mode === 'true';
  const isAdmin = activeRole === 'superadmin';

  if (!isHydrated) return null;

  return (
    <BrowserRouter>
      <AppContent isMaintenanceActive={isMaintenanceActive} isAdmin={isAdmin} />
    </BrowserRouter>
  );
}

function AppContent({ isMaintenanceActive, isAdmin }: { isMaintenanceActive: boolean, isAdmin: boolean }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';

  // If maintenance is active, only admin can bypass
  // Public users see overlay unless they are trying to login (to let admin in)
  if (isMaintenanceActive && !isAdmin && !isLoginPage) {
    if (isRegisterPage) {
      return <MaintenanceOverlay />;
    }
    return <MaintenanceOverlay />;
  }

  return (
    <>
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
          <Route path="planes/suscripciones" element={<AdminSellerSubscriptions />} />
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

        {/* Client App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute allowedRoles={['client', 'seller', 'superadmin']}>
              <ClientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ClientDashboard />} />
          <Route path="tiendas" element={<ClientStores />} />
          <Route path="tiendas/:slug" element={<ClientStoreDetail />} />
          <Route path="tienda" element={<ClientStoreDetail />} />
          <Route path="tienda/:slug" element={<ClientStoreDetail />} />
          <Route path="producto/:id" element={<ClientProduct />} />
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
          <Route path="carrito" element={<ClientCart />} />
          <Route path="checkout" element={<ClientCheckout />} />
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
    </>
  );
}

export default App;

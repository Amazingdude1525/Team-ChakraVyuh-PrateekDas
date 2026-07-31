import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';

// Layouts
import StudentLayout from './layouts/StudentLayout';
import StaffLayout from './layouts/StaffLayout';

// Public pages
import Landing from './pages/public/Landing';
import ChooseRole from './pages/public/ChooseRole';
import StudentLogin from './pages/public/StudentLogin';
import VendorLogin from './pages/public/VendorLogin';
import About from './pages/public/About';
import Help from './pages/public/Help';
import NotFound from './pages/public/NotFound';

// Student pages
import StudentHome from './pages/student/Home';
import StudentSearch from './pages/student/Search';
import CafeMenu from './pages/student/CafeMenu';
import Cart from './pages/student/Cart';
import Checkout from './pages/student/Checkout';
import OrderConfirmed from './pages/student/OrderConfirmed';
import Orders from './pages/student/Orders';
import OrderDetail from './pages/student/OrderDetail';
import Favorites from './pages/student/Favorites';
import Reviews from './pages/student/Reviews';
import Notifications from './pages/student/Notifications';
import Profile from './pages/student/Profile';
import GroupOrder from './pages/student/GroupOrder';
import Assistant from './pages/student/Assistant';
import QrEntry from './pages/student/QrEntry';

// Staff pages
import SelectCafe from './pages/staff/SelectCafe';
import SelectMode from './pages/staff/SelectMode';
import StaffCounter from './pages/staff/Counter';
import StaffKitchen from './pages/staff/Kitchen';
import StaffMenuManagement from './pages/staff/MenuManagement';
import StaffInsights from './pages/staff/Insights';
import StaffDiscounts from './pages/staff/Discounts';
import StaffOrderDetail from './pages/staff/OrderDetail';

/** Route guard: automatically initializes student session for prototype demo. */
function StudentGuard() {
  const student = useStore((s) => s.student);
  const loginStudent = useStore((s) => s.loginStudent);

  if (!student) {
    loginStudent();
  }
  return <Outlet />;
}

/** Staff guard: redirects to vendor-login if no staff session. */
function StaffGuard() {
  const role = useStore((s) => s.role);
  const vendor = useStore((s) => s.vendor);
  if (role !== 'staff' || !vendor) {
    return <Navigate to="/vendor-login" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ========================= Public routes ========================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/vendor-login" element={<VendorLogin />} />
      <Route path="/about" element={<About />} />
      <Route path="/help" element={<Help />} />

      {/* ========================= Student routes ========================= */}
      <Route element={<StudentGuard />}>
        {/* Pages with the bottom nav / top bar */}
        <Route path="/app" element={<StudentLayout />}>
          <Route index element={<StudentHome />} />
          <Route path="search" element={<StudentSearch />} />
          <Route path="orders" element={<Orders />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Standalone student pages (no bottom nav) */}
        <Route path="/app/cafe/:cafeId" element={<CafeMenu />} />
        <Route path="/app/cart" element={<Cart />} />
        <Route path="/app/checkout" element={<Checkout />} />
        <Route path="/app/order-confirmed/:orderId" element={<OrderConfirmed />} />
        <Route path="/app/orders/:orderId" element={<OrderDetail />} />
        <Route path="/app/group-order/:groupId" element={<GroupOrder />} />
        <Route path="/app/assistant" element={<Assistant />} />
        <Route path="/app/qr-entry" element={<QrEntry />} />
      </Route>

      {/* ========================= Staff routes ========================= */}
      <Route element={<StaffGuard />}>
        <Route path="/staff/select-cafe" element={<SelectCafe />} />
        <Route path="/staff/select-mode/:cafeId" element={<SelectMode />} />

        {/* Tabbed staff layout: counter, menu, insights, discounts */}
        <Route path="/staff/:cafeId" element={<StaffLayout />}>
          <Route path="counter" element={<StaffCounter />} />
          <Route path="menu" element={<StaffMenuManagement />} />
          <Route path="insights" element={<StaffInsights />} />
          <Route path="discounts" element={<StaffDiscounts />} />
          <Route path="order/:orderId" element={<StaffOrderDetail />} />
        </Route>

        {/* Kitchen display runs full-bleed, no staff layout chrome */}
        <Route path="/staff/:cafeId/kitchen" element={<StaffKitchen />} />
      </Route>

      {/* ========================= Catch-all ========================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--color-charcoal)',
            color: 'var(--color-cream)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            fontFamily: 'var(--font-sans)',
          },
        }}
      />
    </BrowserRouter>
  );
}

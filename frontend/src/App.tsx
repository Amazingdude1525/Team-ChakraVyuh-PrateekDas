import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import RoleSelect from './pages/RoleSelect';
import Home from './pages/app/Home';
import VendorMenu from './pages/app/VendorMenu';
import Cart from './pages/app/Cart';
import Orders from './pages/app/Orders';
import OrderTracking from './pages/app/OrderTracking';
import Profile from './pages/app/Profile';
import Search from './pages/app/Search';
import Counter from './pages/cafe/Counter';
import Kitchen from './pages/cafe/Kitchen';
import QRGenerator from './pages/admin/QRGenerator';
import QRLanding from './pages/app/QRLanding';

// Layout
import AppLayout from './components/layout/AppLayout';
import Spinner from './components/ui/Spinner';

// Protected route wrapper for students/faculty
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect vendors to role select
  if (profile?.role === 'vendor_counter' || profile?.role === 'vendor_kitchen') {
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
}

// Protected route wrapper for vendors — validates vendor_id from URL matches profile
function VendorRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const { vendorId } = useParams<{ vendorId: string }>();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'vendor_counter' && profile?.role !== 'vendor_kitchen') {
    return <Navigate to="/app" replace />;
  }

  // If URL has a vendorId param, verify it matches the user's assigned vendor
  if (vendorId && profile?.vendor_id && vendorId !== profile.vendor_id) {
    // Redirect to their correct vendor panel
    const correctPath = profile.role === 'vendor_kitchen'
      ? `/cafe/${profile.vendor_id}/kitchen`
      : `/cafe/${profile.vendor_id}/counter`;
    return <Navigate to={correctPath} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/order" element={<QRLanding />} />
      <Route path="/admin/qr" element={<QRGenerator />} />

      {/* Vendor role selection */}
      <Route
        path="/select-role"
        element={
          <VendorRoute>
            <RoleSelect />
          </VendorRoute>
        }
      />

      {/* Student/Faculty app routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="search" element={<Search />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<Orders />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Standalone app routes (no bottom nav) */}
      <Route
        path="/app/vendor/:vendorId"
        element={
          <ProtectedRoute>
            <VendorMenu />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/order/:orderId"
        element={
          <ProtectedRoute>
            <OrderTracking />
          </ProtectedRoute>
        }
      />

      {/* Vendor routes */}
      <Route
        path="/cafe/:vendorId/counter"
        element={
          <VendorRoute>
            <Counter />
          </VendorRoute>
        }
      />
      <Route
        path="/cafe/:vendorId/kitchen"
        element={
          <VendorRoute>
            <Kitchen />
          </VendorRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A2E',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

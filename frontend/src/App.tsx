import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { ManufacturingPage } from './pages/manufacturing/ManufacturingPage';
import { MaterialsPage } from './pages/materials/MaterialsPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { ProductsPage } from './pages/products/ProductsPage';
import { UsersPage } from './pages/users/UsersPage';
import { AIPage } from './pages/ai/AIPage';
import ShipmentsPage from './pages/shipments/ShipmentsPage';
import AuditPage from './pages/audit/AuditPage';
import ForbiddenPage from './pages/ForbiddenPage';
import { getAccessibleModules } from './lib/permissions';

// ─── Route Guard ────────────────────────────────────────────────────────────

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
}

function ProtectedRoute({ children, requiredModule }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredModule) {
    const accessible = getAccessibleModules(user.role);
    if (!accessible.includes(requiredModule)) {
      return <Navigate to="/forbidden" replace />;
    }
  }

  return <>{children}</>;
}

// ─── Default redirect after login ───────────────────────────────────────────

function DefaultRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const modules = getAccessibleModules(user.role);
  // OPERATOR has no dashboard access — redirect to first accessible module
  if (modules.includes('dashboard')) return <Navigate to="/dashboard" replace />;
  if (modules.includes('orders')) return <Navigate to="/orders" replace />;
  if (modules.includes('manufacturing')) return <Navigate to="/manufacturing" replace />;
  if (modules.includes('materials')) return <Navigate to="/materials" replace />;
  if (modules.includes('incidents')) return <Navigate to="/incidents" replace />;
  return <Navigate to="/forbidden" replace />;
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <DefaultRedirect /> : <LoginPage />}
        />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Protected layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DefaultRedirect />} />

          <Route
            path="dashboard"
            element={
              <ProtectedRoute requiredModule="dashboard">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="orders"
            element={
              <ProtectedRoute requiredModule="orders">
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="manufacturing"
            element={
              <ProtectedRoute requiredModule="manufacturing">
                <ManufacturingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="materials"
            element={
              <ProtectedRoute requiredModule="materials">
                <MaterialsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="incidents"
            element={
              <ProtectedRoute requiredModule="incidents">
                <IncidentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="customers"
            element={
              <ProtectedRoute requiredModule="customers">
                <CustomersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="products"
            element={
              <ProtectedRoute requiredModule="products">
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="users"
            element={
              <ProtectedRoute requiredModule="users">
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="ai"
            element={
              <ProtectedRoute requiredModule="ai">
                <AIPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="shipments"
            element={
              <ProtectedRoute requiredModule="shipments">
                <ShipmentsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="audit"
            element={
              <ProtectedRoute requiredModule="audit">
                <AuditPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

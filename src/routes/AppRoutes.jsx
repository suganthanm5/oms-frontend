import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/common/PageLoader";

import MainLayout from "../components/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

// Lazy loaded pages
const Login = lazy(() => import("../pages/Login/Login"));
const Register = lazy(() => import("../pages/Register/Register"));
const Dashboard = lazy(() => import("../pages/Dashboard/Dashboard"));
const Outlet = lazy(() => import("../pages/Outlet/Outlet"));
const Location = lazy(() => import("../pages/Location/Location"));
const Division = lazy(() => import("../pages/Division/Division"));
const Product = lazy(() => import("../pages/Product/Product"));
const UserManagement = lazy(() => import("../pages/UserManagement/UserManagement"));
const Stock = lazy(() => import("../pages/Stock/Stock"));
const Orders = lazy(() => import("../pages/Orders/Orders"));
const Unauthorized = lazy(() => import("../pages/Unauthorized/Unauthorized"));
const NotificationPage = lazy(() => import("../pages/NotificationPage/NotificationPage"));
const Settings = lazy(() => import("../pages/Settings/Settings"));
const Reports = lazy(() => import("../pages/Reports/Reports"));
const AuditLogs = lazy(() => import("../pages/AuditLogs/AuditLogs"));


const Private = ({ children, title }) => (
  <ProtectedRoute>
    <MainLayout title={title}>{children}</MainLayout>
  </ProtectedRoute>
);

const RoleRoute = ({ children, title, roles }) => (
  <ProtectedRoute roles={roles}>
    <MainLayout title={title}>{children}</MainLayout>
  </ProtectedRoute>
);


const AppRoutes = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* All authenticated users */}
        <Route path="/dashboard" element={<Private title="Dashboard"><Dashboard /></Private>} />
        <Route path="/stock" element={<Private title="Stock Management"><Stock /></Private>} />
        <Route path="/orders" element={<Private title="Orders"><Orders /></Private>} />
        <Route path="/reports" element={<Private title="Reports"><Reports /></Private>} />
        <Route path="/notifications" element={<Private title="Notification Centre"><NotificationPage /></Private>} />
        <Route path="/settings" element={<Private title="Settings"><Settings /></Private>} />

        {/* Admin + Manager */}
        <Route path="/outlet" element={<RoleRoute title="Outlet Management" roles={["ADMIN", "MANAGER"]}><Outlet /></RoleRoute>} />
        <Route path="/product" element={<RoleRoute title="Product Management" roles={["ADMIN", "MANAGER"]}><Product /></RoleRoute>} />

        {/* Admin only */}
        <Route path="/division" element={<RoleRoute title="Division Management" roles={["ADMIN"]}><Division /></RoleRoute>} />
        <Route path="/location" element={<RoleRoute title="Location Management" roles={["ADMIN"]}><Location /></RoleRoute>} />
        <Route path="/users" element={<RoleRoute title="User Management" roles={["ADMIN"]}><UserManagement /></RoleRoute>} />
        <Route path="/audit-logs" element={<RoleRoute title="Audit Logs" roles={["ADMIN"]}><AuditLogs /></RoleRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

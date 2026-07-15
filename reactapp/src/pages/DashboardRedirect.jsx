import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function DashboardRedirect() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === "ADMIN") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user?.role === "OWNER") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  return <Navigate to="/customer/dashboard" replace />;
}

export default DashboardRedirect;

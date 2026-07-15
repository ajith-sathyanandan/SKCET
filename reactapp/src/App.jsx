import { Route, Routes } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import PrivateRoute from "./components/routing/PrivateRoute";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardRedirect from "./pages/DashboardRedirect";
import CustomerDashboard from "./pages/CustomerDashboard";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import NotFoundPage from "./pages/NotFoundPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import ProfilePage from "./pages/ProfilePage";
import Register from "./pages/Register";
import RestaurantDetailsPage from "./pages/RestaurantDetailsPage";
import RestaurantDiscoveryPage from "./pages/RestaurantDiscoveryPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="unauthorized" element={<UnauthorizedPage />} />
        <Route path="dashboard" element={<DashboardRedirect />} />

        <Route element={<PrivateRoute allowedRoles={["CUSTOMER"]} />}>
          <Route path="customer/dashboard" element={<CustomerDashboard />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["OWNER", "ADMIN"]} />}>
          <Route path="owner/dashboard" element={<OwnerDashboard />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["ADMIN"]} />}>
          <Route path="admin/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={["CUSTOMER", "OWNER", "ADMIN"]} />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="restaurants" element={<RestaurantDiscoveryPage />} />
          <Route path="restaurants/:restaurantId" element={<RestaurantDetailsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;

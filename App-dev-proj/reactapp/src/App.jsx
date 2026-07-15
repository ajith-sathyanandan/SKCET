import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerDashboard from './pages/CustomerDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children, allowedRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) return <Navigate to="/login" />;
    if (allowedRole && role !== allowedRole) return <Navigate to="/login" />;
    
    return children;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/customer/dashboard" element={<PrivateRoute allowedRole="CUSTOMER"><CustomerDashboard /></PrivateRoute>} />
                    <Route path="/owner/dashboard" element={<PrivateRoute allowedRole="OWNER"><OwnerDashboard /></PrivateRoute>} />
                    <Route path="/admin/dashboard" element={<PrivateRoute allowedRole="ADMIN"><AdminDashboard /></PrivateRoute>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;

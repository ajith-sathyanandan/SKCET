import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'CUSTOMER' });
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            alert("Registration successful! Please login.");
            navigate('/login');
        } catch (error) {
            alert("Registration failed. Try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-center text-gray-800">Create Account</h2>
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input type="email" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input type="password" required className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select className="w-full px-4 py-2 mt-1 border rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setFormData({...formData, role: e.target.value})}>
                            <option value="CUSTOMER">Customer</option>
                            <option value="OWNER">Restaurant Owner</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">Register</button>
                </form>
                <p className="text-sm text-center text-gray-600">Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link></p>
            </div>
        </div>
    );
}

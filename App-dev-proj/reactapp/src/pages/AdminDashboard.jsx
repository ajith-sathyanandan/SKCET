import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-gray-900 text-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Admin Portal</h1>
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-400 bg-gray-800 rounded-lg hover:bg-gray-700 border border-gray-700">Logout</button>
            </nav>
            <main className="p-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Manage Users</h3>
                        <p className="text-gray-500 text-sm mt-1">View and manage all registered accounts.</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800">Manage Restaurants</h3>
                        <p className="text-gray-500 text-sm mt-1">Approve or remove platform restaurants.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

import { useNavigate } from 'react-router-dom';

export default function OwnerDashboard() {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b-4 border-indigo-500">
                <h1 className="text-2xl font-bold text-gray-800">Restaurant Owner Dashboard</h1>
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Logout</button>
            </nav>
            <main className="p-8 max-w-7xl mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Incoming Reservations</h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
                    Your reservations will appear here once connected to the API.
                </div>
            </main>
        </div>
    );
}

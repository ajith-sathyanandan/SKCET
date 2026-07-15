import { useNavigate } from 'react-router-dom';

export default function CustomerDashboard() {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Customer Dashboard</h1>
                <button onClick={handleLogout} className="px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Logout</button>
            </nav>
            <main className="p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex gap-4">
                    <input type="text" placeholder="Search restaurants..." className="flex-1 px-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500" />
                    <button className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Search</button>
                </div>
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Available Restaurants</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800">The Grand Kitchen</h3>
                            <p className="text-gray-500 text-sm mt-1">Italian Cuisine • Open till 10 PM</p>
                            <button className="mt-4 w-full px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">Book a Table</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import WGManagement from "../components/WGManagement";
import wg_api from "../services/wg_api"; // New: Import the dedicated WG API service

const HomePage = () => {
  const { user, logout } = useAuth();
  const [wgs, setWgs] = useState([]);

  useEffect(() => {
    const fetchWGs = async () => {
      try {
        const res = await wg_api.getWGs(); // New: Use wg_api to fetch WGs
        setWgs(res.data);
      } catch (err) {
        console.error("Failed to fetch WGs:", err);
      }
    };
    fetchWGs();
  }, []);

  const handleWGCreate = (newWG) => {
    setWgs([...wgs, newWG]);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Welcome, {user?.username}! 👋</h1>
        <div className="flex space-x-2">
          <Link to="/profile" className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
            Profile
          </Link>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My WGs Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-200 dark:border-gray-700 pb-2">My Shared Apartments</h2>
          {wgs.length > 0 ? (
            <ul className="space-y-4">
              {wgs.map((wg) => (
                <li key={wg.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <Link to={`/wg/${wg.id}`} className="block font-medium text-lg truncate">
                    {wg.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{wg.address}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center">You are not a member of any shared apartment yet.</p>
          )}
        </div>

        {/* Create New WG Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-200 dark:border-gray-700 pb-2">Create New Shared Apartment</h2>
          <WGManagement onCreated={handleWGCreate} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
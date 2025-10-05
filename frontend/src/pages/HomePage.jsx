import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import WGManagement from "../components/WGManagement";
import wg_api from "../services/wg_api";
import { FaSignOutAlt, FaPlus, FaDoorOpen } from "react-icons/fa";
import { useAlert } from "../contexts/AlertContext"; 

const HomePage = () => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert(); 
  const [wgs, setWgs] = useState([]);
  const [joinWgId, setJoinWgId] = useState("");

  const fetchWGs = async () => {
    try {
      const res = await wg_api.getWGs();
      setWgs(res.data);
    } catch (err) {
      console.error("Failed to fetch WGs:", err);
    }
  };

  useEffect(() => {
    fetchWGs();
  }, []);

  const handleWGCreate = async (newWG) => {
    // setWgs([...wgs, newWG]);
    await fetchWGs();
  };

  const handleJoinWG = async (e) => {
    e.preventDefault();
    try {
      if (joinWgId) {
        await wg_api.joinWG(joinWgId);
        showAlert("You have successfully joined the WG!", "success");
        setJoinWgId("");
        await fetchWGs(); 
      }
    } catch (err) {
      showAlert((err.response?.data?.message || "Failed to join shared apartment"), "info");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Welcome, {user?.username}! 👋</h1>
        {/* <div className="flex space-x-2">
          <Link to="/profile" className="px-4 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors">
            Profile
          </Link>
          <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">
            Logout
          </button>
        </div> */}
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

        {/* NEW: Join WG Section */}
        <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 border-b-2 border-gray-200 dark:border-gray-700 pb-2">Join an Existing Shared Apartment</h2>
          <form onSubmit={handleJoinWG} className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <input
              type="text"
              placeholder="Enter WG ID"
              value={joinWgId}
              onChange={(e) => setJoinWgId(e.target.value)}
              className="w-full sm:w-auto flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center px-6 py-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
            >
              <FaDoorOpen className="mr-2" />
              Join Shared Apartment
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
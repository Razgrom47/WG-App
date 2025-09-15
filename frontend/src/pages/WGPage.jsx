import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import wg_api from "../services/wg_api";
import {
  FaUsers,
  FaTasks,
  FaShoppingCart,
  FaMoneyBillWave,
  FaTrash,
  FaSignOutAlt,
  FaArrowLeft,
  FaUserCog,
  FaUserSlash,
  FaEllipsisV,
  FaPlus,
} from "react-icons/fa";

const WGPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wg, setWg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});

  const fetchWG = async () => {
    try {
      setLoading(true);
      const res = await wg_api.getWG(id);
      setWg(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load shared apartment data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWG();
  }, [id]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId].contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuId]);

  const isAdmin = (userId) => {
    if (!wg || !wg.admins) return false;
    return wg.admins.some((admin) => admin.id === userId);
  };

  const isCreator = (userId) => {
    if (!wg || !wg.creator) return false;
    return wg.creator.id === userId;
  };

  const isCurrentUserAdmin = isAdmin(user.id) || isCreator(user.id);

  const handleToggleAdmin = async (userId) => {
    try {
      await wg_api.toggleAdmin(id, userId);
      fetchWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle admin status:", err);
      alert("Failed to change admin status. Please try again.");
    }
  };

  const handleKickUser = async (userId) => {
    if (window.confirm("Are you sure you want to kick this user from the WG?")) {
      try {
        await wg_api.kickUser(id, userId);
        fetchWG();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to kick user:", err);
        alert("Failed to kick user. Please try again.");
      }
    }
  };

  const handleInviteUser = async () => {
    const userId = prompt("Enter the User ID to invite:");
    if (userId) {
      try {
        await wg_api.inviteUser(id, userId);
        alert("User invited successfully!");
        fetchWG();
      } catch (err) {
        console.error("Failed to invite user:", err);
        alert(
          err.response?.data?.message ||
            "Failed to invite user. Please try again."
        );
      }
    }
  };

  const handleLeaveWG = async () => {
    if (window.confirm("Are you sure you want to leave this shared apartment?")) {
      try {
        await wg_api.leaveWG(id);
        alert("You have successfully left the shared apartment.");
        navigate("/");
      } catch (err) {
        console.error("Failed to leave WG:", err);
        alert(
          err.response?.data?.message || "Failed to leave WG. Please try again."
        );
      }
    }
  };

  const handleMenuToggle = (userId) => {
    const el = menuRefs.current[userId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 100;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [userId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [userId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === userId ? null : userId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg text-gray-500 dark:text-gray-400">
          Loading shared apartment...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!wg) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-indigo-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <FaArrowLeft className="mr-2" />
          Back to Home
        </button>
        <h1 className="text-3xl font-bold mb-2">{wg.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
          {wg.description}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Address: {wg.address} - Etage {wg.etage}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-6 border-t pt-4 border-gray-200 dark:border-gray-700 sm:grid-cols-4">
          {isCurrentUserAdmin ? (
            <Link
              to={`/wg/${id}/manage`}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors aspect-square text-sm sm:text-base"
            >
              <FaUsers className="text-2xl sm:text-3xl" />
              <span className="mt-2 text-center">Manage WG</span>
            </Link>
          ) : (
            <button
              disabled
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-gray-400 text-gray-700 cursor-not-allowed aspect-square text-sm sm:text-base"
            >
              <FaUsers className="text-2xl sm:text-3xl" />
              <span className="mt-2 text-center">Manage WG</span>
            </button>
          )}

          <Link
            to={`/wg/${id}/budget_plans`}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors aspect-square text-sm sm:text-base"
          >
            <FaMoneyBillWave className="text-2xl sm:text-3xl" />
            <span className="mt-2 text-center">Budget Plans</span>
          </Link>
          <Link
            to={`/wg/${id}/task_lists`}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 transition-colors aspect-square text-sm sm:text-base"
          >
            <FaTasks className="text-2xl sm:text-3xl" />
            <span className="mt-2 text-center">Task Lists</span>
          </Link>
          <Link
            to={`/wg/${id}/shopping_lists`}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors aspect-square text-sm sm:text-base"
          >
            <FaShoppingCart className="text-2xl sm:text-3xl" />
            <span className="mt-2 text-center">Shopping Lists</span>
          </Link>
        </div>

        {/* Member List with Add Button */}
        <div className="mt-6 border-t pt-4 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Members:</h3>
            {isCurrentUserAdmin && (
              <button
                onClick={handleInviteUser}
                className="flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FaPlus className="mr-2" />
                Add
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {wg.users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FaUsers className="text-gray-500 dark:text-gray-400" />
                  <span>{u.name}</span>
                  {isAdmin(u.id) && !isCreator(u.id) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      (Admin)
                    </span>
                  )}
                  {isCreator(u.id) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      (Creator)
                    </span>
                  )}
                </div>
                {isCurrentUserAdmin && user.id !== u.id && !isCreator(u.id) && (
                  <div
                    className="relative"
                    ref={(el) => (menuRefs.current[u.id] = el)}
                  >
                    <button
                      onClick={() => handleMenuToggle(u.id)}
                      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FaEllipsisV />
                    </button>
                    {openMenuId === u.id && (
                      <div
                        className={`absolute right-0 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg py-1 z-10
                          ${
                            menuDirection[u.id] === "up"
                              ? "bottom-full mb-2"
                              : "top-full mt-2"
                          }`}
                      >
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          className={`w-full text-left flex items-center px-4 py-2 text-sm ${
                            isAdmin(u.id)
                              ? "text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900"
                              : "text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                          }`}
                        >
                          <FaUserCog className="mr-2" />
                          {isAdmin(u.id) ? "Remove Admin" : "Make Admin"}
                        </button>
                        <button
                          onClick={() => handleKickUser(u.id)}
                          className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                        >
                          <FaUserSlash className="mr-2" />
                          Kick User
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Leave WG Button */}
        {user && wg && !isCreator(user.id) && (
          <div className="mt-6 text-center">
            <button
              onClick={handleLeaveWG}
              className="flex items-center justify-center mx-auto px-6 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <FaSignOutAlt className="mr-2" /> Leave Shared Apartment
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WGPage;
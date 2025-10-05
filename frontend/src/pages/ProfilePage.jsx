import { useAuth } from "../contexts/AuthContext";
import { useState, useEffect } from "react"; 
import api from "../services/api";
import wg_api from "../services/wg_api"; 
import { FaUserEdit, FaTrash, FaSignOutAlt, FaArrowLeft, FaHome } from "react-icons/fa"; 
import { Link, useNavigate } from "react-router-dom";
import { useAlert } from "../contexts/AlertContext"; // Import useAlert

const ProfilePage = () => {
  const { user, logout, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { showAlert, confirm } = useAlert(); 

  const [wgs, setWgs] = useState([]);
  const [selectedHome, setSelectedHome] = useState(user?.strHomePage || "/"); 

  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Fetch user's WGs on component mount
  useEffect(() => {
    const fetchWGs = async () => {
      try {
        const res = await wg_api.getWGs(); 
        setWgs(res.data);
      } catch (err) {
        console.error("Failed to fetch WGs:", err);
      }
    };
    fetchWGs();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    // 1. Password Match Validation
    if (newPassword && newPassword !== confirmPassword) {
      showAlert("New passwords do not match. Please try again.", "warning");
      return;
    }
    
    // 2. NEW: Password Length Validation (at least 8 characters)
    if (newPassword && newPassword.length < 8) {
      showAlert("New password must be at least 8 characters long.", "warning");
      return;
    }
    
    try {
      // Create a payload including the new password if it's set
      const payload = { ...form };
      if (newPassword) {
        payload.new_password = newPassword;
      }

      // Prepare home_page_wg_id for payload
      let homePageIdToSend;
      if (selectedHome === "/") {
        homePageIdToSend = "/";
      } else {
        homePageIdToSend = selectedHome.split('/wg/')[1];
      }
      payload.home_page_wg_id = homePageIdToSend;
      
      await updateUser(payload);
      
      showAlert("Profile updated successfully!", "success");
      
      // Clear password fields after a successful update
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An unexpected error occurred during profile update.";
      showAlert(`Update failed: ${errorMessage}`, "error");
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
        title: "Delete Account",
        message: "Are you sure you want to permanently delete your account? This action cannot be undone.",
    });
    if (confirmed) {
        try {
            await deleteAccount();
            showAlert("Account deleted successfully.", "success");
            navigate("/");
        } catch (err) {
            showAlert("Failed to delete account. Please try again.", "error");
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => navigate(-1)} 
              className="text-indigo-500 hover:text-indigo-400 transition-colors flex items-center"
              aria-label="Go back"
            >
              <FaArrowLeft className="mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <div className="w-16"></div> {/* Spacer for alignment */}
          </div>

          {/* Profile Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-2">Edit Details</h2>
              
              {/* Username Input */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  required
                />
              </div>

              {/* New Password Input */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="newPassword">New Password (optional)</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  autoComplete="new-password"
                />
              </div>
              
              {/* Confirm New Password Input */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  autoComplete="new-password"
                />
              </div>

              {/* NEW: Select Home Page Field */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="homePage">Preferred Home Page</label>
                <div className="relative">
                  <FaHome className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <select
                    id="homePage"
                    name="homePage"
                    value={selectedHome}
                    onChange={(e) => setSelectedHome(e.target.value)}
                    className="w-full p-2 pl-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors appearance-none cursor-pointer"
                    aria-label="Preferred Home Page"
                  >
                    <option value="/">Home Page (Your WGs List)</option>
                    {wgs.map((wg) => (
                      <option key={wg.id} value={`/wg/${wg.id}`}>
                        WG: {wg.title}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              <button
                onClick={handleUpdate}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FaUserEdit className="mr-2" />
                Update Profile
              </button>
            </div>
            
            {/* Account Actions Section */}
            <div className="md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6 space-y-4 pt-6 md:pt-0">
              <h2 className="text-2xl font-semibold mb-2">Account Actions</h2>
              
              {/* Logout Button */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>

              {/* Delete Account Button */}
              <button
                onClick={handleDelete}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <FaTrash className="mr-2" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import api from "../services/api";
import { FaUserEdit, FaTrash, FaSignOutAlt, FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  // NEW: State for new password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    // NEW: Client-side validation for passwords
    if (newPassword && newPassword !== confirmPassword) {
      alert("New passwords do not match. Please try again.");
      return;
    }
    
    try {
      // Create a payload including the new password if it's set
      const payload = { ...form };
      if (newPassword) {
        payload.new_password = newPassword;
      }
      
      // Call the updateUser function from AuthContext with the new payload
      await updateUser(payload);
      
      alert("Profile updated successfully!");
      // Clear password fields after a successful update
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || "Error"));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete("/user");
      logout();
      navigate("/login");
      alert("Account deleted successfully.");
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.error || "Error"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <Link to="/home" className="flex items-center text-indigo-500 hover:text-indigo-600 transition-colors">
              <FaArrowLeft className="mr-2" /> Back to Home
            </Link>
          </div>

          {/* Profile Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-2">Edit Details</h2>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter new username"
                  aria-label="Username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter new email"
                  aria-label="Email"
                />
              </div>

              {/* NEW: Password fields */}
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Leave blank to keep current"
                  aria-label="New Password"
                  autoComplete="new-password"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Confirm new password"
                  aria-label="Confirm New Password"
                  autoComplete="new-password"
                />
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
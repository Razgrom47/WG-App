import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import wg_api from "../services/wg_api";
import { FaArrowLeft, FaSave, FaUserPlus, FaTrash, FaTimes } from "react-icons/fa";

const WGUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wg, setWg] = useState(null);
  const [form, setForm] = useState({
    title: "",
    address: "",
    etage: "",
    description: "",
    is_public: false, 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  // State for Transfer Creator Modal
  const [transferCreatorModalOpen, setTransferCreatorModalOpen] = useState(false);
  const [usernameToTransfer, setUsernameToTransfer] = useState("");

  const fetchWG = async () => {
    try {
      const res = await wg_api.getWG(id);
      const wgData = res.data;
      setWg(wgData);
      setForm({
        title: wgData.title,
        address: wgData.address,
        etage: wgData.etage,
        description: wgData.description,
      });

      setIsPublic(wgData.is_public);

      const userIsAdmin = wgData.admins.some((admin) => admin.id === user.id);
      const userIsCreator = wgData.creator.id === user.id;

      setIsCurrentUserAdmin(userIsAdmin);
      setIsCreator(userIsCreator);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load shared apartment data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWG();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await wg_api.updateWG(id, { ...form, is_public: isPublic });
      alert("Shared apartment updated successfully!");
      navigate(`/wg/${id}`);
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || "Failed to update shared apartment."));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'is_public') {
      setIsPublic(checked);
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleTransferOwnership = () => {
    setTransferCreatorModalOpen(true);
  };

  const handleSendTransferRequest = async () => {
    if (!usernameToTransfer) {
      alert("Please enter a username.");
      return;
    }
    if (usernameToTransfer === user.name) {
      alert("You cannot transfer creator status to yourself.");
      return;
    }
    try {
      await wg_api.transferCreator(id, usernameToTransfer);
      alert(`Creator status transferred to ${usernameToTransfer} successfully!`);
      navigate(`/wg/${id}`);
    } catch (err) {
      alert(
        err.response?.data?.message ||
        `Failed to transfer creator status. Please try again.`
      );
    } finally {
      setTransferCreatorModalOpen(false);
      setUsernameToTransfer("");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this shared apartment? This action cannot be undone.")) {
      try {
        await wg_api.deleteWG(id);
        alert("Shared apartment deleted successfully.");
        navigate("/");
      } catch (err) {
        alert("Error: " + (err.response?.data?.message || "Failed to delete shared apartment."));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!isCurrentUserAdmin && !isCreator) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <p>You do not have permission to edit this shared apartment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <FaArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold">Update Shared Apartment</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="block text-sm font-medium mb-1">Etage</label>
              <input
                type="text"
                name="etage"
                placeholder="Etage (e.g., 2nd floor)"
                value={form.etage}
                onChange={handleChange}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={isPublic}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out"
                />
                <label className="text-gray-700 dark:text-gray-300">Allow public joining</label>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <FaSave className="mr-2" />
                Save Changes
              </button>
            </form>
          </div>

          {/* Admin Actions */}
          <div className="md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6">
              {isCreator && (
            <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
              )}
            <div className="space-y-4">
              {isCreator && (
                <button
                  onClick={handleTransferOwnership}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FaUserPlus className="mr-2" />
                  Transfer Creator
                </button>
              )}
              {isCreator && (
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <FaTrash className="mr-2" />
                  Delete WG
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Transfer Creator Modal */}
      {transferCreatorModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Transfer Creator Status
              </h2>
              <button
                onClick={() => setTransferCreatorModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to transfer creator status? You will lose all creator privileges, but remain an admin.
              </p>
              <input
                type="text"
                placeholder="Enter new creator's username"
                value={usernameToTransfer}
                onChange={(e) => setUsernameToTransfer(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setTransferCreatorModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendTransferRequest}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WGUpdate;
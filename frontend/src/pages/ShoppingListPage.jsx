import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import wg_api from "../services/wg_api";
import shopping_list_api from "../services/shopping_list_api";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaEllipsisV,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";
import { useAlert } from "../contexts/AlertContext"; 

const ShoppingListPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wg, setWg] = useState(null);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});
  const { showAlert, confirm } = useAlert(); 

  // State for Create Shopping List Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newShoppingListTitle, setNewShoppingListTitle] = useState("");
  const [newShoppingListDescription, setNewShoppingListDescription] = useState("");
  const [newShoppingListDate, setNewShoppingListDate] = useState("");

  // State for Edit Shopping List Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditShoppingList, setCurrentEditShoppingList] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const fetchWGAndShoppingLists = async () => {
    try {
      setLoading(true);
      const [wgRes, shoppingListsRes] = await Promise.all([
        wg_api.getWG(id),
        wg_api.getShoppingLists(id),
      ]);
      setWg(wgRes.data);
      setShoppingLists(shoppingListsRes.data.shoppinglists);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWGAndShoppingLists();
  }, [id]);

  const isCurrentUserAdmin = () => {
    if (!wg || !user) return false;
    return (
      wg.admins.some((admin) => admin.id === user.id) ||
      wg.creator.id === user.id
    );
  };

  const handleCreateShoppingList = () => {
    setCreateModalOpen(true);
  };

  const handleSaveNewShoppingList = async () => {
    if (!newShoppingListTitle) {
      showAlert("Please enter a title for the new shopping list.", "warning");
      return;
    }

    try {
      const shoppingListData = {
        title: newShoppingListTitle,
        description: newShoppingListDescription,
        date: newShoppingListDate || null,
      };
      await shopping_list_api.createShoppingList(id, shoppingListData);
      await fetchWGAndShoppingLists();
      setCreateModalOpen(false);
      setNewShoppingListTitle("");
      setNewShoppingListDescription("");
      setNewShoppingListDate("");
    } catch (err) {
      showAlert("Failed to create shopping list. Please try again.", "error");
    }
  };

  const handleUpdateShoppingList = (shoppingList) => {
    setCurrentEditShoppingList(shoppingList);
    setEditedTitle(shoppingList.title);
    setEditedDescription(shoppingList.description);
    setEditModalOpen(true);
    setOpenMenuId(null); // Close the options menu
  };

  const handleSaveEditShoppingList = async () => {
    if (!editedTitle) {
      showAlert("Please enter a title for the shopping list.", "warning");
      return;
    }
    const updatedData = {
      title: editedTitle,
      description: editedDescription,
    };
    try {
      await shopping_list_api.updateShoppingList(currentEditShoppingList.id, updatedData);
      await fetchWGAndShoppingLists();
      setEditModalOpen(false);
      setCurrentEditShoppingList(null);
      setEditedTitle("");
      setEditedDescription("");
    } catch (err) {
      showAlert("Failed to update shopping list. Please try again.", "error");
    }
  };

  const handleDeleteShoppingList = async (listId) => {
    const confirmed = await confirm({
        title: "Delete Shopping List",
        message: "Are you sure you want to delete this shopping list? All associated items will also be deleted.",
    });

    if (confirmed) {
        try {
            await shopping_list_api.deleteShoppingList(listId);
            await fetchWGAndShoppingLists();
            setOpenMenuId(null);
        } catch (err) {
            showAlert("Failed to delete shopping list. Please try again.", "error");
        }
    }
  };

  const handleToggleCheckShoppingList = async (shoppingList) => {
    try {
      await shopping_list_api.toggleCheckShoppingList(shoppingList.id);
      await fetchWGAndShoppingLists();
      setOpenMenuId(null);
    } catch (err) {
      showAlert("Failed to toggle shopping list check status. Please try again.", "error");
    }
  };

  const handleMenuToggle = (shoppinglistId) => {
    const el = menuRefs.current[shoppinglistId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [shoppinglistId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [shoppinglistId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === shoppinglistId ? null : shoppinglistId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  if (error || !wg) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>{error}</p>
      </div>
    );
  }

  const sortedShoppingLists = [...shoppingLists].sort((a, b) => {
    if (a.is_checked === b.is_checked) {
      return 0;
    }
    return a.is_checked ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Shopping Lists</h1>
        <button onClick={handleCreateShoppingList} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <FaPlus className="mr-2" /> New
        </button>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {shoppingLists.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No shopping lists found.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedShoppingLists.map((shoppingList) => {
              const linkClass = `block p-4 rounded-lg transition-colors ${
                shoppingList.is_checked ? "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
              }`;
              const titleClass = shoppingList.is_checked ? "text-green-800 dark:text-green-200 font-bold line-through" : "text-gray-900 dark:text-white font-medium";
              const descriptionClass = shoppingList.is_checked ? "text-green-700 dark:text-green-300 text-sm line-through" : "text-gray-600 dark:text-gray-400 text-sm";
              
              return (
                <li key={shoppingList.id} className="relative">
                  <div className="flex items-center justify-between">
                    <Link to={`/shoppinglist/${shoppingList.id}`} className="flex-grow">
                      <div className={linkClass}>
                        <div className="flex items-center">
                          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCheckShoppingList(shoppingList); }} className="text-xl mr-2">
                            {shoppingList.is_checked ? <MdOutlineCheckBox className="text-green-500" /> : <MdOutlineCheckBoxOutlineBlank className="text-gray-400" />}
                          </button>
                          <div>
                            <span className={titleClass}>{shoppingList.title}</span>
                            <p className={descriptionClass}>{shoppingList.description}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuToggle(shoppingList.id)}
                        className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        ref={(el) => (menuRefs.current[shoppingList.id] = el)}
                      >
                        <FaEllipsisV />
                      </button>
                      {openMenuId === shoppingList.id && (
                        <div className={`absolute right-0 w-40 mt-2 py-1 bg-white dark:bg-gray-800 rounded-md shadow-xl z-10 ${menuDirection[shoppingList.id] === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}>
                          <button
                            onClick={() => handleUpdateShoppingList(shoppingList)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <FaEdit className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteShoppingList(shoppingList.id)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                          >
                            <FaTrash className="mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Shopping List</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={newShoppingListTitle}
                onChange={(e) => setNewShoppingListTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={newShoppingListDescription}
                onChange={(e) => setNewShoppingListDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewShoppingList}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Shopping List</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditShoppingList}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
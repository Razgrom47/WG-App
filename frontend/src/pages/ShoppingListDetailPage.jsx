import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import shopping_list_api from "../services/shopping_list_api";
import wg_api from "../services/wg_api";
import item_api from "../services/item_api";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";

const ShoppingListDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState(null);
  const [wg, setWg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});

  // State for Create Item Modal
  const [createItemModalOpen, setCreateItemModalOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");

  // State for Edit Item Modal
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const fetchShoppingListAndWG = async () => {
    try {
      setLoading(true);
      const shoppingListRes = await shopping_list_api.getShoppingList(id);
      const fetchedShoppingList = shoppingListRes.data;
      setShoppingList(fetchedShoppingList);
      const wgRes = await wg_api.getWG(fetchedShoppingList.wg_id);
      setWg(wgRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load shopping list data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingListAndWG();
  }, [id]);

  const handleToggleCheckItem = async (itemId) => {
    try {
      await item_api.toggleCheckItem(itemId);
      await fetchShoppingListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle item check status:", err);
      alert("Failed to toggle item check status. Please try again.");
    }
  };

  const handleUpdateItem = (item) => {
    setCurrentEditItem(item);
    setEditedTitle(item.title);
    setEditedDescription(item.description);
    setEditItemModalOpen(true);
    setOpenMenuId(null); // Close the options menu
  };

  const handleSaveEditItem = async () => {
    if (!editedTitle) {
      alert("Please enter a title for the item.");
      return;
    }
    const updatedData = {
      title: editedTitle,
      description: editedDescription,
    };
    try {
      await item_api.updateItem(currentEditItem.id, updatedData);
      await fetchShoppingListAndWG();
      setEditItemModalOpen(false);
      setCurrentEditItem(null);
      setEditedTitle("");
      setEditedDescription("");
    } catch (err) {
      console.error("Failed to update item:", err);
      alert("Failed to update item. Please try again.");
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (
      window.confirm("Are you sure you want to delete this item?")
    ) {
      try {
        await item_api.deleteItem(itemId);
        await fetchShoppingListAndWG();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to delete item:", err);
        alert("Failed to delete item. Please try again.");
      }
    }
  };

  const handleCreateItem = () => {
    setCreateItemModalOpen(true);
  };

  const handleSaveNewItem = async () => {
    if (!newItemTitle) {
      alert("Please enter a title for the new item.");
      return;
    }
    const itemData = {
      title: newItemTitle,
      description: newItemDescription,
    };
    try {
      await item_api.createItem(shoppingList.id, itemData);
      await fetchShoppingListAndWG();
      setCreateItemModalOpen(false);
      setNewItemTitle("");
      setNewItemDescription("");
    } catch (err) {
      console.error("Failed to create item:", err);
      alert("Failed to create item. Please try again.");
    }
  };

  const handleMenuToggle = (itemId) => {
    const el = menuRefs.current[itemId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [itemId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [itemId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  if (error || !shoppingList || !wg) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>{error}</p>
      </div>
    );
  }

  const sortedItems = [...shoppingList.items].sort((a, b) => {
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
        <h1 className="text-2xl font-bold">
          {shoppingList.title}
        </h1>
        <button onClick={handleCreateItem} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <FaPlus className="mr-2" /> New Item
        </button>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-lg font-semibold mb-2">Description:</p>
        <p className="text-gray-600 dark:text-gray-300">
          {shoppingList.description || "No description provided."}
        </p>
      </div>
      <h2 className="text-xl font-bold mb-4">Items</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {shoppingList.items.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No items found.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedItems.map((item) => {
              const linkClass = `block p-4 rounded-lg transition-colors ${item.is_checked ? "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"}`;
              const titleClass = item.is_checked ? "text-green-800 dark:text-green-200 font-bold line-through" : "text-gray-900 dark:text-white font-medium";
              const descriptionClass = item.is_checked ? "text-green-700 dark:text-green-300 text-sm line-through" : "text-gray-600 dark:text-gray-400 text-sm";
              
              return (
                <li key={item.id} className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className={linkClass}>
                        <div className="flex items-center">
                          <button onClick={() => handleToggleCheckItem(item.id)} className="text-xl mr-2">
                            {item.is_checked ? <MdOutlineCheckBox className="text-green-500" /> : <MdOutlineCheckBoxOutlineBlank className="text-gray-400" />}
                          </button>
                          <div>
                            <span className={titleClass}>{item.title}</span>
                            <p className={descriptionClass}>{item.description}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuToggle(item.id)}
                        className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        ref={(el) => (menuRefs.current[item.id] = el)}
                      >
                        <FaEllipsisV />
                      </button>
                      {openMenuId === item.id && (
                        <div className={`absolute right-0 w-40 mt-2 py-1 bg-white dark:bg-gray-800 rounded-md shadow-xl z-10 ${menuDirection[item.id] === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}>
                          <button
                            onClick={() => handleUpdateItem(item)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <FaEdit className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
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

      {createItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description like 300 gramms or 5 pieces (Optional)</label>
              <textarea
                placeholder="Description like 300 gramms or 5 pieces (Optional)"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setCreateItemModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewItem}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {editItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Item</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                placeholder="Description (Optional)"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setEditItemModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditItem}
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

export default ShoppingListDetailPage;

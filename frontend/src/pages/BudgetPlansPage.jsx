import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import wg_api from "../services/wg_api"; // Assume this service is updated
import budget_planning_api from "../services/budget_planning_api"; // New service
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

const BudgetPlansPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wg, setWg] = useState(null);
  const [budgetPlans, setBudgetPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});

  // State for Create Budget Plan Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBudgetPlanTitle, setNewBudgetPlanTitle] = useState("");
  const [newBudgetPlanDescription, setNewBudgetPlanDescription] = useState("");
  const [newBudgetPlanGoal, setNewBudgetPlanGoal] = useState("");
  const [newBudgetPlanDeadline, setNewBudgetPlanDeadline] = useState("");

  // State for Edit Budget Plan Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditBudgetPlan, setCurrentEditBudgetPlan] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedGoal, setEditedGoal] = useState("");
  const [editedDeadline, setEditedDeadline] = useState("");

  const { showAlert, confirm } = useAlert(); 
  const fetchWGAndBudgetPlans = async () => {
    try {
      setLoading(true);
      const [wgRes, budgetPlansRes] = await Promise.all([
        wg_api.getWG(id),
        budget_planning_api.getBudgetPlans(id),
      ]);
      setWg(wgRes.data);
      // Safely access the data and set state
      if (budgetPlansRes.data && budgetPlansRes.data.budgetplannings) {
        setBudgetPlans(budgetPlansRes.data.budgetplannings);
      } else {
        setBudgetPlans([]);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
      setBudgetPlans([]); // Ensure state is an array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWGAndBudgetPlans();
  }, [id]);

  const handleCreateBudgetPlan = () => {
    setCreateModalOpen(true);
  };

  const handleSaveNewBudgetPlan = async () => {
    if (!newBudgetPlanTitle || !newBudgetPlanGoal) {
      showAlert("Please enter a title and goal for the new budget plan.", "warning");
      return;
    }

    try {
      const budgetPlanData = {
        title: newBudgetPlanTitle,
        description: newBudgetPlanDescription,
        goal: parseFloat(newBudgetPlanGoal),
        deadline: newBudgetPlanDeadline || null,
        wg_id: id,
      };
      await budget_planning_api.createBudgetPlanning(budgetPlanData);
      await fetchWGAndBudgetPlans();
      setCreateModalOpen(false);
      setNewBudgetPlanTitle("");
      setNewBudgetPlanDescription("");
      setNewBudgetPlanGoal("");
      setNewBudgetPlanDeadline("");
    } catch (err) {
      showAlert("Failed to create budget plan. Please try again.", "error");
    }
  };

  const handleUpdateBudgetPlan = (budgetPlan) => {
    setCurrentEditBudgetPlan(budgetPlan);
    setEditedTitle(budgetPlan.title);
    setEditedDescription(budgetPlan.description);
    setEditedGoal(budgetPlan.goal);
    // Format the deadline date for the input field
    if (budgetPlan.deadline) {
      const formattedDate = new Date(budgetPlan.deadline).toISOString().split('T')[0];
      setEditedDeadline(formattedDate);
    } else {
      setEditedDeadline("");
    }
    setEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEditBudgetPlan = async () => {
    if (!editedTitle || !editedGoal) {
      showAlert("Please enter a title and goal for the budget plan.", "warning");
      return;
    }
    const updatedData = {
      title: editedTitle,
      description: editedDescription,
      goal: parseFloat(editedGoal),
      deadline: editedDeadline || null,
    };
    try {
      await budget_planning_api.updateBudgetPlanning(currentEditBudgetPlan.id, updatedData);
      await fetchWGAndBudgetPlans();
      setEditModalOpen(false);
      setCurrentEditBudgetPlan(null);
      setEditedTitle("");
      setEditedDescription("");
      setEditedGoal("");
      setEditedDeadline("");
    } catch (err) {
      showAlert("Failed to update budget plan. Please try again.", "error");
    }
  };

  const handleDeleteBudgetPlan = async (budgetPlanId) => {
    const confirmed = await confirm({
        title: "Delete Budget Plan",
        message: "Are you sure you want to delete this budget plan? All associated costs will also be deleted.",
    });
    
    if (confirmed) {
        try {
            await budget_planning_api.deleteBudgetPlanning(budgetPlanId);
            await fetchWGAndBudgetPlans();
            setOpenMenuId(null);
        } catch (err) {
            showAlert("Failed to delete budget plan. Please try again.", "error");
        }
    }
  };
  
  const handleMenuToggle = (budgetPlanId) => {
    const el = menuRefs.current[budgetPlanId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [budgetPlanId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [budgetPlanId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === budgetPlanId ? null : budgetPlanId);
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">Budget Plans</h1>
        <button onClick={handleCreateBudgetPlan} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <FaPlus className="mr-2" /> New
        </button>
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {budgetPlans.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No budget plans found.
          </p>
        ) : (
          <ul className="space-y-4">
            {budgetPlans.map((budgetPlan) => {
              const linkClass = `block p-4 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600`;
              
              return (
                <li key={budgetPlan.id} className="relative">
                  <div className="flex items-center justify-between">
                    <Link to={`/budgetplan/${budgetPlan.id}`} className="flex-grow">
                      <div className={linkClass}>
                        <div className="flex items-center">
                          <div>
                            <span className="text-gray-900 dark:text-white font-medium">{budgetPlan.title}</span>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{budgetPlan.description}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">Goal: ${budgetPlan.goal}</p>
                            <p className="text-gray-600 dark:text-gray-400 text-sm font-bold">Deadline: {new Date(budgetPlan.deadline).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => handleMenuToggle(budgetPlan.id)}
                        className="text-gray-500 dark:text-gray-400 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        ref={(el) => (menuRefs.current[budgetPlan.id] = el)}
                      >
                        <FaEllipsisV />
                      </button>
                      {openMenuId === budgetPlan.id && (
                        <div className={`absolute right-0 w-40 mt-2 py-1 bg-white dark:bg-gray-800 rounded-md shadow-xl z-10 ${menuDirection[budgetPlan.id] === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}>
                          <button
                            onClick={() => handleUpdateBudgetPlan(budgetPlan)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                          >
                            <FaEdit className="mr-2" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBudgetPlan(budgetPlan.id)}
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
            <h2 className="text-xl font-bold mb-4">Create New Budget Plan</h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={newBudgetPlanTitle}
                onChange={(e) => setNewBudgetPlanTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={newBudgetPlanDescription}
                onChange={(e) => setNewBudgetPlanDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <label className="block text-sm font-medium mb-1">Goal ($)</label>
              <input
                type="number"
                placeholder="Goal"
                value={newBudgetPlanGoal}
                onChange={(e) => setNewBudgetPlanGoal(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input
                type="date"
                value={newBudgetPlanDeadline}
                onChange={(e) => setNewBudgetPlanDeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                onClick={handleSaveNewBudgetPlan}
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
            <h2 className="text-xl font-bold mb-4">Edit Budget Plan</h2>
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
              <label className="block text-sm font-medium mb-1">Goal ($)</label>
              <input
                type="number"
                placeholder="Goal"
                value={editedGoal}
                onChange={(e) => setEditedGoal(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Deadline</label>
              <input
                type="date"
                value={editedDeadline}
                onChange={(e) => setEditedDeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                onClick={handleSaveEditBudgetPlan}
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

export default BudgetPlansPage;
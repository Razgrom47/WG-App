import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import budget_planning_api from "../services/budget_planning_api";
import wg_api from "../services/wg_api";
import cost_api from "../services/cost_api";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaUserPlus,
} from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";
import { FaMoneyBillAlt } from "react-icons/fa";
import BudgetGoalPieChart from "../components/BudgetGoalPieChart";

const BudgetPlanDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [budgetPlan, setBudgetPlan] = useState(null);
  const [wg, setWg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});

  // State for Create Cost Modal
  const [createCostModalOpen, setCreateCostModalOpen] = useState(false);
  const [newCostTitle, setNewCostTitle] = useState("");
  const [newCostDescription, setNewCostDescription] = useState("");
  const [newCostGoal, setNewCostGoal] = useState("");

  // State for Edit Cost Modal
  const [editCostModalOpen, setEditCostModalOpen] = useState(false);
  const [currentEditCost, setCurrentEditCost] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedGoal, setEditedGoal] = useState("");
  const [editedPaid, setEditedPaid] = useState("");

  // State for Assign/Unassign Users Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentCostToAssign, setCurrentCostToAssign] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const fetchBudgetPlanAndWG = async () => {
    try {
      setLoading(true);
      const budgetPlanRes = await budget_planning_api.getBudgetPlan(id);
      const fetchedBudgetPlan = budgetPlanRes.data;
      setBudgetPlan(fetchedBudgetPlan);
      const wgRes = await wg_api.getWG(fetchedBudgetPlan.wg_id);
      setWg(wgRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load budget plan data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetPlanAndWG();
  }, [id]);

  const isCurrentUserAdminOrCreator = () => {
    if (!wg || !user) return false;
    return (
      wg.admins.some((admin) => admin.id === user.id) ||
      wg.creator.id === user.id
    );
  };

  const handleTogglePaid = async (cost) => {
    const isFullyPaid = cost.paid >= cost.goal;
    const newPaidAmount = isFullyPaid ? 0 : cost.goal;
    try {
      await budget_planning_api.checkCost(budgetPlan.id, cost.id, { paid: newPaidAmount });
      await fetchBudgetPlanAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle cost paid status:", err);
      alert("Failed to toggle cost paid status. Please try again.");
    }
  };

  const handleUpdateCost = (cost) => {
    setCurrentEditCost(cost);
    setEditedTitle(cost.title);
    setEditedDescription(cost.description);
    setEditedGoal(cost.goal);
    setEditedPaid(cost.paid);
    setEditCostModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEditCost = async () => {
    if (!editedTitle || editedGoal === "") {
      alert("Please enter a title and goal for the cost.");
      return;
    }
    const updatedData = {
      title: editedTitle,
      description: editedDescription,
      goal: parseFloat(editedGoal),
      paid: parseFloat(editedPaid),
    };
    try {
      await cost_api.updateCost(currentEditCost.id, updatedData);
      await fetchBudgetPlanAndWG();
      setEditCostModalOpen(false);
      setCurrentEditCost(null);
      setEditedTitle("");
      setEditedDescription("");
      setEditedGoal("");
      setEditedPaid("");
    } catch (err) {
      console.error("Failed to update cost:", err);
      alert("Failed to update cost. Please try again.");
    }
  };

  const handleDeleteCost = async (costId) => {
    if (
      window.confirm("Are you sure you want to delete this cost?")
    ) {
      try {
        await cost_api.deleteCost(costId);
        await fetchBudgetPlanAndWG();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to delete cost:", err);
        alert("Failed to delete cost. Please try again.");
      }
    }
  };

  const handleCreateCost = () => {
    setCreateCostModalOpen(true);
  };

  const handleSaveNewCost = async () => {
    if (!newCostTitle || newCostGoal === "") {
      alert("Please enter a title and goal for the new cost.");
      return;
    }
    const costData = {
      title: newCostTitle,
      description: newCostDescription,
      goal: parseFloat(newCostGoal),
    };
    try {
      await budget_planning_api.addCostToBudgetPlanning(budgetPlan.id, costData);
      await fetchBudgetPlanAndWG();
      setCreateCostModalOpen(false);
      setNewCostTitle("");
      setNewCostDescription("");
      setNewCostGoal("");
    } catch (err) {
      console.error("Failed to create cost:", err);
      alert("Failed to create cost. Please try again.");
    }
  };

  const openAssignModal = (cost) => {
    setCurrentCostToAssign(cost);
    setSelectedUserIds(cost.users.map(u => u.id));
    setAssignModalOpen(true);
    setOpenMenuId(null);
  };

  const handleToggleUserSelection = (userId) => {
    setSelectedUserIds(prevSelectedUserIds =>
      prevSelectedUserIds.includes(userId)
        ? prevSelectedUserIds.filter(id => id !== userId)
        : [...prevSelectedUserIds, userId]
    );
  };

  const handleSaveCostAssignments = async () => {
    const updatedData = {
      user_ids: selectedUserIds,
      title: currentCostToAssign.title,
      description: currentCostToAssign.description,
      goal: currentCostToAssign.goal,
      paid: currentCostToAssign.paid,
    };
    try {
      await cost_api.updateCost(currentCostToAssign.id, updatedData);
      await fetchBudgetPlanAndWG();
      setAssignModalOpen(false);
      setCurrentCostToAssign(null);
      setSelectedUserIds([]);
      alert("User assignments updated successfully!");
    } catch (err) {
      console.error("Failed to update user assignments:", err);
      alert("Failed to update user assignments. Please try again.");
    }
  };

  const handleMenuToggle = (costId) => {
    const el = menuRefs.current[costId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [costId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [costId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === costId ? null : costId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  if (error || !budgetPlan || !wg) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>{error}</p>
      </div>
    );
  }

  const sortedCosts = [...budgetPlan.costs].sort((a, b) => {
    const aPaid = a.paid >= a.goal;
    const bPaid = b.paid >= b.goal;
    if (aPaid === bPaid) {
      return 0;
    }
    return aPaid ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">
          {budgetPlan.title}
        </h1>
        <button onClick={handleCreateCost} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
          <FaPlus className="mr-2" /> New Cost
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-lg font-semibold mb-1">Description:</p>
        <p className="text-gray-600 dark:text-gray-300">
          {budgetPlan.description || "No description provided."}
        </p>
        <p className="text-gray-600 dark:text-gray-300">
            Goal: ${budgetPlan.goal}
        </p>
        <p className="text-gray-600 dark:text-gray-300">
            Deadline: {new Date(budgetPlan.deadline).toLocaleDateString()}
        </p>
      </div>
       <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <BudgetGoalPieChart budgetPlan={budgetPlan} />
       </div>
      <h2 className="text-xl font-bold mb-4">Costs</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {budgetPlan.costs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No costs found.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedCosts.map((cost) => {
              const isFullyPaid = cost.paid >= cost.goal;
              const linkClass = `block p-4 rounded-lg transition-colors ${isFullyPaid ? "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"}`;
              const titleClass = isFullyPaid ? "text-green-800 dark:text-green-200 line-through" : "text-gray-900 dark:text-white";
              const descriptionClass = isFullyPaid ? "text-green-700 dark:text-green-300 line-through" : "text-gray-600 dark:text-gray-300";
              const userNames = cost.users.map((u) => u.name).join(", ");

              return (
                <li key={cost.id} className="relative group">
                  <div className={linkClass}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <button
                            onClick={() => handleTogglePaid(cost)}
                            className="mr-3 text-2xl text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {isFullyPaid ? <MdOutlineCheckBox /> : <MdOutlineCheckBoxOutlineBlank />}
                          </button>
                          <div>
                            <h3 className={`text-lg font-semibold ${titleClass}`}>
                              {cost.title}
                            </h3>
                            {cost.description && (
                              <p className={`text-sm ${descriptionClass}`}>
                                {cost.description}
                              </p>
                            )}
                            {cost.users && cost.users.length > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Assigned to: {userNames}
                                </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center mt-2 text-gray-700 dark:text-gray-300">
                          <FaMoneyBillAlt className="mr-2 text-sm" />
                          <span className="text-sm font-medium">
                            Paid: ${cost.paid.toFixed(2)} / Goal: ${cost.goal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuToggle(cost.id);
                          }}
                          className="text-gray-500 dark:text-gray-400 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                          ref={(el) => (menuRefs.current[cost.id] = el)}
                        >
                          <FaEllipsisV />
                        </button>
                        {openMenuId === cost.id && (
                          <div
                            className={`absolute right-0 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 ${menuDirection[cost.id] === "up" ? "bottom-full mb-2" : "top-full mt-2"}`}
                          >
                            <button
                                onClick={() => handleUpdateCost(cost)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                                <FaEdit className="mr-2" />
                                Edit
                            </button>
                            {isCurrentUserAdminOrCreator() && (
                                <button
                                    onClick={() => openAssignModal(cost)}
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                                >
                                    <FaUserPlus className="mr-2" />
                                    Assign/Unassign Users
                                </button>
                            )}
                            <button
                                onClick={() => handleDeleteCost(cost.id)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                                <FaTrash className="mr-2" />
                                Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Create Cost Modal */}
      {createCostModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Cost</h2>
              <button onClick={() => setCreateCostModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={newCostTitle}
                onChange={(e) => setNewCostTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Description (Optional)"
                value={newCostDescription}
                onChange={(e) => setNewCostDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <label className="block text-sm font-medium mb-1">Goal</label>
              <input
                type="number"
                placeholder="Goal Amount ($)"
                value={newCostGoal}
                onChange={(e) => setNewCostGoal(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setCreateCostModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewCost}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cost Modal */}
      {editCostModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Cost</h2>
              <button onClick={() => setEditCostModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
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
                placeholder="Description (Optional)"
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <label className="block text-sm font-medium mb-1">Goal</label>
              <input
                type="number"
                placeholder="Goal Amount ($)"
                value={editedGoal}
                onChange={(e) => setEditedGoal(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Paid Amount</label>
              <input
                type="number"
                placeholder="Paid Amount ($)"
                value={editedPaid}
                onChange={(e) => setEditedPaid(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setEditCostModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditCost}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign/Unassign Users Modal */}
      {assignModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Assign Users to {currentCostToAssign?.title}
              </h2>
              <button onClick={() => setAssignModalOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {wg.users.map((wgUser) => {
                const isSelected = selectedUserIds.includes(wgUser.id);
                return (
                  <li
                    key={wgUser.id}
                    onClick={() => handleToggleUserSelection(wgUser.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-500 dark:bg-blue-700 text-white font-medium"
                        : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white"
                    }`}
                  >
                    <span>{wgUser.name}</span>
                    {isSelected && (
                      <FaTimes className="text-red-300 hover:text-red-500 ml-2" />
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCostAssignments}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
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

export default BudgetPlanDetailPage;
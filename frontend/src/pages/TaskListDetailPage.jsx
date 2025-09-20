import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import task_list_api from "../services/task_list_api";
import wg_api from "../services/wg_api";
import task_api from "../services/task_api";
import {
  FaArrowLeft,
  FaEllipsisV,
  FaEdit,
  FaUserPlus,
  FaTrash,
  FaPlus,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";

const TaskListDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [taskList, setTaskList] = useState(null);
  const [wg, setWg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});

  // State for Create Task Modal
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");

  // State for Edit Task Modal
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [currentEditTask, setCurrentEditTask] = useState(null);
  const [editedTaskTitle, setEditedTaskTitle] = useState("");
  const [editedTaskDescription, setEditedTaskDescription] = useState("");
  const [editedTaskStartDate, setEditedTaskStartDate] = useState("");
  const [editedTaskEndDate, setEditedTaskEndDate] = useState("");

  // State for Assign/Unassign Users Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentTaskToAssign, setCurrentTaskToAssign] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const fetchTaskListAndWG = async () => {
    try {
      setLoading(true);
      const taskListRes = await task_list_api.getTaskList(id);
      const fetchedTaskList = taskListRes.data;
      setTaskList(fetchedTaskList);
      const wgRes = await wg_api.getWG(fetchedTaskList.wg_id);
      setWg(wgRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load task list data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskListAndWG();
  }, [id]);

  const isCurrentUserAdmin = () => {
    if (!wg || !user) return false;
    return (
      wg.admins.some((admin) => admin.id === user.id) ||
      wg.creator.id === user.id
    );
  };

  const isUserOfTask = (task) => {
    if (!task || !user) return false;
    return task.users.some((u) => u.id === user.id);
  };

  const handleToggleCheckTask = async (taskId, is_done) => {
    try {
      await task_api.checkTask(taskId);
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle task check status:", err);
      alert("Failed to toggle task check status. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (
      window.confirm("Are you sure you want to delete this task?")
    ) {
      try {
        await task_api.deleteTask(taskId);
        await fetchTaskListAndWG();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to delete task:", err);
        alert("Failed to delete task. Please try again.");
      }
    }
  };

  const handleCreateTask = () => {
      setCreateTaskModalOpen(true);
  };

  const handleSaveNewTask = async () => {
    if (!newTaskTitle) {
      alert("Please enter a title for the new task.");
      return;
    }
    const taskData = {
      title: newTaskTitle,
      description: newTaskDescription,
      start_date: newTaskStartDate || null,
      end_date: newTaskEndDate || null,
    };
    try {
      await task_list_api.createTask(taskList.id, taskData);
      await fetchTaskListAndWG();
      setCreateTaskModalOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskStartDate("");
      setNewTaskEndDate("");
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleUpdateTask = (task) => {
    setCurrentEditTask(task);
    setEditedTaskTitle(task.title);
    setEditedTaskDescription(task.description);
    // Convert date strings to "YYYY-MM-DD" format for input type="date"
    setEditedTaskStartDate(task.start_date ? new Date(task.start_date).toISOString().split('T')[0] : "");
    setEditedTaskEndDate(task.end_date ? new Date(task.end_date).toISOString().split('T')[0] : "");
    setEditTaskModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEditTask = async () => {
    if (!editedTaskTitle) {
      alert("Please enter a title for the task.");
      return;
    }
    const updatedData = {
      title: editedTaskTitle,
      description: editedTaskDescription,
      start_date: editedTaskStartDate || null,
      end_date: editedTaskEndDate || null,
    };
    try {
      await task_api.updateTask(currentEditTask.id, updatedData);
      await fetchTaskListAndWG();
      setEditTaskModalOpen(false);
      setCurrentEditTask(null);
      setEditedTaskTitle("");
      setEditedTaskDescription("");
      setEditedTaskStartDate("");
      setEditedTaskEndDate("");
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  const openAssignModal = (task) => {
    setCurrentTaskToAssign(task);
    setSelectedUserIds(task.users.map(u => u.id));
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

  const handleSaveTaskAssignments = async () => {
    const currentAssignedIds = currentTaskToAssign.users.map(u => u.id);
    const usersToAssign = selectedUserIds.filter(id => !currentAssignedIds.includes(id));
    const usersToUnassign = currentAssignedIds.filter(id => !selectedUserIds.includes(id));

    setAssignModalOpen(false);
    
    try {
      if (usersToAssign.length > 0) {
        await task_api.assignUsersToTask(currentTaskToAssign.id, usersToAssign);
      }
      if (usersToUnassign.length > 0) {
        await task_api.removeUsersFromTask(currentTaskToAssign.id, usersToUnassign);
      }
      alert("User assignments updated successfully!");
      await fetchTaskListAndWG();
    } catch (err) {
      console.error("Failed to update user assignments:", err);
      alert("Failed to update user assignments. Please try again.");
    }
    setCurrentTaskToAssign(null);
  };

  const handleMenuToggle = (taskId) => {
    const el = menuRefs.current[taskId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [taskId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [taskId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === taskId ? null : taskId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        Loading...
      </div>
    );
  }

  if (error || !taskList || !wg) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        <p>{error}</p>
      </div>
    );
  }

  const sortedTasks = [...taskList.tasks].sort((a, b) => {
    if (a.is_done === b.is_done) {
      return 0;
    }
    return a.is_done ? 1 : -1;
  });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">
          {taskList.title}
        </h1>
        <button
          onClick={handleCreateTask}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <FaPlus className="mr-2" /> New Task
        </button>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-sm text-gray-400 mt-4">
          Created on: {new Date(taskList.date).toLocaleDateString()}
        </p>
        <p className="text-lg font-semibold mb-2">Description:</p>
        <p className="text-gray-600 dark:text-gray-300">
          {taskList.description || "No description provided."}
        </p>
        <p className="text-lg font-semibold mb-2">Assigned Users:</p>
        {taskList.users && taskList.users.length > 0 ? (
          <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
            {taskList.users.map((u) => (
              <li key={u.id}>{u.name}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No users assigned.</p>
        )}
      </div>

      <h2 className="text-xl font-bold mb-4">Tasks</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {taskList.tasks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No tasks found.
          </p>
        ) : (
          <ul className="space-y-4">
            {sortedTasks.map((task) => {
              const userIsAssigned = isUserOfTask(task);
              const linkClass = `block p-4 rounded-lg transition-colors ${task.is_done ? "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700" : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"}`;
              const titleClass = task.is_done ? "text-green-800 dark:text-green-200 font-bold line-through" : "text-gray-900 dark:text-white font-medium";
              const descriptionClass = task.is_done ? "text-green-700 dark:text-green-300 text-sm line-through" : "text-gray-600 dark:text-gray-400 text-sm";
              const userNames = task.users.map((u) => u.name).join(", ");
              return (
                <li key={task.id} className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className={linkClass}>
                        <div className="flex items-center">
                          {/* Checkbox button, only show if user is assigned or is admin */}
                          {(userIsAssigned || isCurrentUserAdmin()) && (
                            <button
                              onClick={() => handleToggleCheckTask(task.id, task.is_done)}
                              className="text-xl mr-2"
                            >
                              {task.is_done ? (
                                <MdOutlineCheckBox className="text-green-500" />
                              ) : (
                                <MdOutlineCheckBoxOutlineBlank className="text-gray-400" />
                              )}
                            </button>
                          )}
                          <div>
                            <span className={titleClass}>{task.title}</span>
                            <p className={descriptionClass}>{task.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Start:{" "}
                              {task.start_date
                                ? new Date(task.start_date).toLocaleDateString()
                                : "N/A"}{" "}
                              | End:{" "}
                              {task.end_date
                                ? new Date(task.end_date).toLocaleDateString()
                                : "N/A"}
                            </p>
                            {userNames && (
                              <p
                                className={`${descriptionClass} text-xs mt-1`}
                              >
                                Assigned to: {userNames}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {(isCurrentUserAdmin()) && (
                      <div
                        className="relative ml-2"
                        ref={(el) => (menuRefs.current[task.id] = el)}
                      >
                        <button
                          onClick={() => handleMenuToggle(task.id)}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FaEllipsisV />
                        </button>
                        {openMenuId === task.id && (
                          <div
                            className={`absolute right-0 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10
                              ${
                                menuDirection[task.id] === "up"
                                  ? "bottom-full mb-2"
                                  : "top-full mt-2"
                              }`}
                          >
                            <button
                                onClick={() => handleUpdateTask(task)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                                <FaEdit className="mr-2" />
                                Edit
                            </button>
                            <button
                              onClick={() => openAssignModal(task)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                            >
                              <FaUserPlus className="mr-2" />
                              Assign/Unassign Users
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                            >
                              <FaTrash className="mr-2" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* CREATE NEW TASK MODAL */}
      {createTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Create New Task
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                placeholder="Description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={newTaskStartDate}
                  onChange={(e) => setNewTaskStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setCreateTaskModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewTask}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK MODAL */}
      {editTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Task
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={editedTaskTitle}
                onChange={(e) => setEditedTaskTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <textarea
                placeholder="Description"
                value={editedTaskDescription}
                onChange={(e) => setEditedTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={editedTaskStartDate}
                  onChange={(e) => setEditedTaskStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={editedTaskEndDate}
                  onChange={(e) => setEditedTaskEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setEditTaskModalOpen(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditTask}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && currentTaskToAssign && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Assign Users to "{currentTaskToAssign.title}"
            </h2>
            <ul className="space-y-2 max-h-64 overflow-y-auto">
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
                onClick={handleSaveTaskAssignments}
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

export default TaskListDetailPage;
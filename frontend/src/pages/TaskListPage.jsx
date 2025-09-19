import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import wg_api from "../services/wg_api";
import task_list_api from "../services/task_list_api";
import {
  FaArrowLeft,
  FaPlus,
  FaTrash,
  FaUserPlus,
  FaEllipsisV,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineCheckBoxOutlineBlank, MdOutlineCheckBox } from "react-icons/md";

const TaskListPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wg, setWg] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuDirection, setMenuDirection] = useState({});
  const menuRefs = useRef({});
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [currentTaskListToAssign, setCurrentTaskListToAssign] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // State for Create Task List Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTaskListTitle, setNewTaskListTitle] = useState("");
  const [newTaskListDescription, setNewTaskListDescription] = useState("");
  const [newTaskListDate, setNewTaskListDate] = useState("");

  // State for Edit Task List Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditTaskList, setCurrentEditTaskList] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  const fetchWGAndTaskLists = async () => {
    try {
      setLoading(true);
      const [wgRes, taskListsRes] = await Promise.all([
        wg_api.getWG(id),
        wg_api.getTaskLists(id),
      ]);
      setWg(wgRes.data);
      setTaskLists(taskListsRes.data.tasklists);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWGAndTaskLists();
  }, [id]);

  const isCurrentUserAdmin = () => {
    if (!wg || !user) return false;
    return (
      wg.admins.some((admin) => admin.id === user.id) ||
      wg.creator.id === user.id
    );
  };

  const isUserOfTaskList = (taskList) => {
    if (!taskList || !user) return false;
    return taskList.users.some((u) => u.id === user.id);
  };

  const handleCreateTaskList = () => {
    setCreateModalOpen(true);
  };

  const handleSaveNewTaskList = async () => {
    if (!newTaskListTitle) {
      alert("Please enter a title for the new task list.");
      return;
    }

    try {
      const taskListData = {
        title: newTaskListTitle,
        description: newTaskListDescription,
        date: newTaskListDate || null,
      };
      await task_list_api.createTaskList(id, taskListData);
      await fetchWGAndTaskLists();
      setCreateModalOpen(false);
      setNewTaskListTitle("");
      setNewTaskListDescription("");
      setNewTaskListDate("");
    } catch (err) {
      console.error("Failed to create task list:", err);
      alert("Failed to create task list. Please try again.");
    }
  };

  const handleUpdateTaskList = (taskList) => {
    setCurrentEditTaskList(taskList);
    setEditedTitle(taskList.title);
    setEditedDescription(taskList.description);
    setEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSaveEditTaskList = async () => {
    if (!editedTitle) {
      alert("Please enter a title for the task list.");
      return;
    }
    const updatedData = {
      title: editedTitle,
      description: editedDescription,
    };
    try {
      await task_list_api.updateTaskList(currentEditTaskList.id, updatedData);
      await fetchWGAndTaskLists();
      setEditModalOpen(false);
      setCurrentEditTaskList(null);
      setEditedTitle("");
      setEditedDescription("");
    } catch (err) {
      console.error("Failed to update task list:", err);
      alert("Failed to update task list. Please try again.");
    }
  };

  const handleDeleteTaskList = async (tasklistId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this task list? This action cannot be undone."
      )
    ) {
      try {
        await task_list_api.deleteTaskList(tasklistId);
        await fetchWGAndTaskLists();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to delete task list:", err);
        alert("Failed to delete task list. Please try again.");
      }
    }
  };

  const handleToggleCheckTaskList = async (taskList) => {
    try {
      if (taskList.is_checked) {
        await task_list_api.uncheckTaskList(taskList.id);
      } else {
        await task_list_api.checkTaskList(taskList.id);
      }
      await fetchWGAndTaskLists();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle task list check status:", err);
      alert("Failed to toggle task list check status. Please try again.");
    }
  };

  const openAssignModal = (taskList) => {
    setCurrentTaskListToAssign(taskList);
    setSelectedUserIds(taskList.users.map(u => u.id));
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

  const handleSaveAssignments = async () => {
    const currentAssignedIds = currentTaskListToAssign.users.map(u => u.id);
    const usersToAssign = selectedUserIds.filter(id => !currentAssignedIds.includes(id));
    const usersToUnassign = currentAssignedIds.filter(id => !selectedUserIds.includes(id));

    setAssignModalOpen(false);

    try {
      if (usersToAssign.length > 0) {
        await task_list_api.assignUsersToTaskList(currentTaskListToAssign.id, usersToAssign);
      }

      if (usersToUnassign.length > 0) {
        await task_list_api.removeUsersFromTaskList(currentTaskListToAssign.id, usersToUnassign);
      }

      alert("User assignments updated successfully!");
      await fetchWGAndTaskLists();
    } catch (err) {
      console.error("Failed to update user assignments:", err);
      alert("Failed to update user assignments. Please try again.");
    }
    setCurrentTaskListToAssign(null);
  };

  const handleMenuToggle = (tasklistId) => {
    const el = menuRefs.current[tasklistId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150;

      if (rect.bottom + menuHeightEstimate > viewportHeight) {
        setMenuDirection((prev) => ({ ...prev, [tasklistId]: "up" }));
      } else {
        setMenuDirection((prev) => ({ ...prev, [tasklistId]: "down" }));
      }
    }
    setOpenMenuId(openMenuId === tasklistId ? null : tasklistId);
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

  const sortedTaskLists = [...taskLists].sort((a, b) => {
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
        <h1 className="text-2xl font-bold">Task Lists</h1>
        {isCurrentUserAdmin() && (
          <button
            onClick={handleCreateTaskList}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaPlus className="mr-2" /> New
          </button>
        )}
      </header>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {taskLists.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No task lists found.
          </p>
        ) : (
          <ul className="space-y-4">
            <li>
              <Link
                to={`/wg/${id}/undone-tasks`}
                className="block p-4 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  My Undone Tasks
                </span>
              </Link>
            </li>
            {sortedTaskLists.map((taskList) => {
              const userIsMember = isUserOfTaskList(taskList);
              const linkClass = `block p-4 rounded-lg transition-colors ${
                userIsMember || isCurrentUserAdmin()
                  ? taskList.is_checked
                    ? "bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700"
                    : "bg-gray-50 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
              }`;
              const textClass = `${
                userIsMember || isCurrentUserAdmin()
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`;
              const titleLink = userIsMember || isCurrentUserAdmin()
                ? `/tasklist/${taskList.id}`
                : "#";

              return (
                <li key={taskList.id} className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className={linkClass}>
                        <div className="flex items-center">
                          <Link to={titleLink} className="flex-1">
                            <span
                              className={`${textClass} truncate font-medium flex-1`}
                            >
                              {taskList.title}
                            </span>
                          </Link>
                          {isCurrentUserAdmin() && (
                            <button
                              onClick={() => handleToggleCheckTaskList(taskList)}
                              className="ml-4 text-2xl"
                            >
                              {taskList.is_checked ? (
                                <MdOutlineCheckBox className="text-green-500" />
                              ) : (
                                <MdOutlineCheckBoxOutlineBlank className="text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {isCurrentUserAdmin() && (
                      <div
                        className="relative ml-2"
                        ref={(el) => (menuRefs.current[taskList.id] = el)}
                      >
                        <button
                          onClick={() => handleMenuToggle(taskList.id)}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <FaEllipsisV />
                        </button>
                        {openMenuId === taskList.id && (
                          <div
                            className={`absolute right-0 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10
                              ${
                                menuDirection[taskList.id] === "up"
                                  ? "bottom-full mb-2"
                                  : "top-full mt-2"
                              }`}
                          >
                            <button
                              onClick={() => handleUpdateTaskList(taskList)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                              <FaEdit className="mr-2" />
                              Update
                            </button>
                            <button
                              onClick={() => openAssignModal(taskList)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                            >
                              <FaUserPlus className="mr-2" />
                              Assign/Unassign Users
                            </button>
                            <button
                              onClick={() => handleDeleteTaskList(taskList.id)}
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

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && currentTaskListToAssign && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Assign Users to "{currentTaskListToAssign.title}"
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
                onClick={handleSaveAssignments}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TASK LIST MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Create New Task List
            </h2>
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                placeholder="Title"
                value={newTaskListTitle}
                onChange={(e) => setNewTaskListTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                placeholder="Description"
                value={newTaskListDescription}
                onChange={(e) => setNewTaskListDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows="3"
              />
              <label className="block text-sm font-medium mb-1">Start Date</label>              
              <input
                type="date"
                placeholder="Date"
                value={newTaskListDate}
                onChange={(e) => setNewTaskListDate(e.target.value)}
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
                onClick={handleSaveNewTaskList}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TASK LIST MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Task List</h2>
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
                onClick={handleSaveEditTaskList}
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

export default TaskListPage;
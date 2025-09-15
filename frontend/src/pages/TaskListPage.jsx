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
  FaEdit
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

  const handleCreateTaskList = async () => {
    const title = prompt("Enter the title for the new task list:");
    if (title) {
      try {
        await task_list_api.createTaskList(id, { title });
        await fetchWGAndTaskLists();
        setOpenMenuId(null); 
      } catch (err) {
        console.error("Failed to create task list:", err);
        alert("Failed to create task list. Please try again.");
      }
    }
  };

  const handleUpdateTaskList = async (tasklistId, currentTitle, currentDescription) => {
    const title = prompt("Enter the new title:", currentTitle);
    if (title) {
      const description = prompt("Enter the new description:", currentDescription);
      try {
        await task_list_api.updateTaskList(tasklistId, { title, description });
        await fetchWGAndTaskLists();
        setOpenMenuId(null); 
      } catch (err) {
        console.error("Failed to update task list:", err);
        alert("Failed to update task list. Please try again.");
      }
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

  const handleAssignUsers = async (tasklistId) => {
    const userIdsInput = prompt(
      "Enter user IDs to assign (comma-separated):"
    );
    if (userIdsInput) {
      const userIds = userIdsInput.split(",").map((id) => parseInt(id.trim())).filter(id => !isNaN(id));
      if (userIds.length > 0) {
        try {
          await task_list_api.assignUsersToTaskList(tasklistId, userIds);
          alert("Users assigned successfully!");
          await fetchWGAndTaskLists();
          setOpenMenuId(null); 
        } catch (err) {
          console.error("Failed to assign users:", err);
          alert("Failed to assign users. Please try again.");
        }
      } else {
        alert("No valid user IDs entered.");
      }
    }
  };

  const handleMenuToggle = (tasklistId) => {
    const el = menuRefs.current[tasklistId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const menuHeightEstimate = 150; // adjust based on expected menu height

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
                      <Link to={titleLink} className={linkClass}>
                        <div className="flex items-center">
                          <span
                            className={`${textClass} truncate font-medium flex-1`}
                          >
                            {taskList.title}
                          </span>
                        </div>
                      </Link>
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
                              onClick={() => handleUpdateTaskList(taskList.id, taskList.title, taskList.description)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                              <FaEdit className="mr-2" />
                              Update
                            </button>
                            <button
                              onClick={() => handleToggleCheckTaskList(taskList)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                            >
                              {taskList.is_checked ? (
                                <MdOutlineCheckBox className="mr-2" />
                              ) : (
                                <MdOutlineCheckBoxOutlineBlank className="mr-2" />
                              )}
                              {taskList.is_checked ? "Uncheck" : "Check"}
                            </button>
                            <button
                              onClick={() => handleAssignUsers(taskList.id)}
                              className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                            >
                              <FaUserPlus className="mr-2" />
                              Assign Users
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
    </div>
  );
};

export default TaskListPage;
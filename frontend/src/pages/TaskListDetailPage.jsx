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
  FaPlus
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
      console.error("Failed to load task list or WG data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskListAndWG();
  }, [id]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        openMenuId &&
        menuRefs.current[openMenuId] &&
        !menuRefs.current[openMenuId].contains(event.target)
      ) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMenuId]);

  const isCurrentUserAdmin = () => {
    if (!wg || !user) return false;
    return (
      wg.admins.some((admin) => admin.id === user.id) ||
      wg.creator.id === user.id
    );
  };

  const isUserAssignedToTask = (task) => {
    if (!task || !user) return false;
    return task.users.some((u) => u.id === user.id);
  };

  const handleCreateTask = async () => {
    const title = prompt("Enter the title for the new task:");
    if (!title) return;

    const description = prompt("Enter the description for the new task:") || "";
    const startDate = prompt("Enter start date (YYYY-MM-DD):") || null;
    const endDate = prompt("Enter end date (YYYY-MM-DD):") || null;

    try {
      await task_list_api.createTask(id, { title, description, startDate, endDate });
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleUpdateTask = async (taskId, currentTitle, currentDescription, currentStart, currentEnd) => {
    const title = prompt("Enter the new title:", currentTitle);
    if (!title) return;

    const description = prompt("Enter the new description:", currentDescription) || "";
    const startDate = prompt("Enter new start date (YYYY-MM-DD):", currentStart || "") || null;
    const endDate = prompt("Enter new end date (YYYY-MM-DD):", currentEnd || "") || null;

    try {
      await task_api.updateTask(taskId, { title, description, startDate, endDate });
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (
      window.confirm("Are you sure you want to delete this task? This action cannot be undone.")
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

  const handleToggleCheckTask = async (task) => {
    try {
      await task_api.checkTask(task.id);
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to toggle task check status:", err);
      alert("Failed to toggle task check status. Please try again.");
    }
  };

  const handleAssignUsersToTask = async (taskId) => {
    const userIdsInput = prompt("Enter user IDs to assign (comma-separated):");
    if (userIdsInput) {
      const userIds = userIdsInput
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      if (userIds.length > 0) {
        try {
          await task_api.assignUsersToTask(taskId, userIds);
          alert("Users assigned successfully!");
          await fetchTaskListAndWG();
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-6">
      <header className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="text-xl">
          <FaArrowLeft />
        </button>
        <h1 className="text-2xl font-bold">{taskList.title}</h1>
        {isCurrentUserAdmin() && (
          <button
            onClick={handleCreateTask}
            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <FaPlus className="mr-2" /> New
          </button>
        )}
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <p className="text-lg font-semibold mb-2">Description:</p>
        <p className="text-gray-600 dark:text-gray-300">
          {taskList.description || "No description provided."}
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Created on: {new Date(taskList.date).toLocaleDateString()}
        </p>
      </div>

      <h2 className="text-xl font-bold mb-4">Tasks</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        {taskList.tasks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            No tasks found in this list.
          </p>
        ) : (
          <ul className="space-y-4">
            {taskList.tasks.map((task) => {
              const userIsAssigned = isUserAssignedToTask(task);
              const cardClass = `p-4 rounded-lg transition-colors ${
                userIsAssigned || isCurrentUserAdmin()
                  ? task.is_done
                    ? "bg-green-100 dark:bg-green-800"
                    : "bg-gray-50 dark:bg-gray-700"
                  : "bg-gray-200 dark:bg-gray-600 cursor-not-allowed"
              }`;

              return (
                <li key={task.id} className="relative">
                  <div className={`${cardClass} flex flex-col`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {task.description || "No description"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Start: {task.startDate ? new Date(task.startDate).toLocaleDateString() : "N/A"} <br />
                          End: {task.endDate ? new Date(task.endDate).toLocaleDateString() : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned: {task.users.map(u => u.name).join(", ") || "None"}
                        </p>
                      </div>
                      {isCurrentUserAdmin() && (
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
                                onClick={() =>
                                  handleUpdateTask(task.id, task.title, task.description, task.startDate, task.endDate)
                                }
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                <FaEdit className="mr-2" />
                                Update
                              </button>
                              <button
                                onClick={() => handleToggleCheckTask(task)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                {task.is_done ? (
                                  <MdOutlineCheckBox className="mr-2" />
                                ) : (
                                  <MdOutlineCheckBoxOutlineBlank className="mr-2" />
                                )}
                                {task.is_done ? "Uncheck" : "Check"}
                              </button>
                              <button
                                onClick={() => handleAssignUsersToTask(task.id)}
                                className="w-full text-left flex items-center px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                              >
                                <FaUserPlus className="mr-2" />
                                Assign Users
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

export default TaskListDetailPage;

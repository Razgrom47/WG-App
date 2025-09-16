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
    const start_date = prompt("Enter start date (YYYY-MM-DD):") || null;
    const end_date = prompt("Enter end date (YYYY-MM-DD):") || null;

    try {
      await task_list_api.createTask(id, { title, description, start_date, end_date });
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to create task:", err);
      alert("Failed to create task. Please try again.");
    }
  };

  const handleUpdateTask = async (
    taskId,
    currentTitle,
    currentDescription,
    currentStart,
    currentEnd
  ) => {
    const title = prompt("Enter the new title:", currentTitle);
    if (!title) return;

    const description =
      prompt("Enter the new description:", currentDescription) || "";
    const start_date =
      prompt("Enter new start date (YYYY-MM-DD):", currentStart || "") || null;
    const end_date =
      prompt("Enter new end date (YYYY-MM-DD):", currentEnd || "") || null;

    try {
      await task_api.updateTask(taskId, { title, description, start_date, end_date });
      await fetchTaskListAndWG();
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to update task:", err);
      alert("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
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

  const handleAssignUsersToTask = async (taskId, currentUsers) => {
    // Pre-fill with existing user IDs
    const currentIds = currentUsers.map((u) => u.id).join(", ");
    const userIdsInput = prompt("Edit user IDs (comma-separated):", currentIds);

    if (userIdsInput !== null) {
      const userIds = userIdsInput
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));

      try {
        await task_api.updateTask(taskId, { user_ids: userIds });
        alert("Users updated successfully!");
        await fetchTaskListAndWG();
        setOpenMenuId(null);
      } catch (err) {
        console.error("Failed to update users:", err);
        alert("Failed to update users. Please try again.");
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
            No tasks found in this list.
          </p>
        ) : (
          <ul className="space-y-4">
            {taskList.tasks.map((task) => {
              const userIsAssigned = isUserAssignedToTask(task);
              const userIsAdmin = isCurrentUserAdmin();
              let cardColorClass;

              if (task.is_done) {
                // Green if the task is done
                cardColorClass = "bg-green-100 dark:bg-green-800";
              } else if (userIsAssigned) {
                // Blue if the user is assigned to an undone task
                cardColorClass = "bg-blue-100 dark:bg-blue-800";
              } else {
                // Default gray for all other cases
                cardColorClass = "bg-gray-200 dark:bg-gray-600";
              }

              const cardClass = `p-4 rounded-lg transition-colors ${cardColorClass} ${
                !userIsAssigned && !userIsAdmin ? "cursor-not-allowed" : ""
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
                          Start:{" "}
                          {task.start_date
                            ? new Date(task.start_date).toLocaleDateString()
                            : "N/A"}{" "}
                          <br />
                          End:{" "}
                          {task.end_date
                            ? new Date(task.end_date).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Assigned:{" "}
                          {task.users.map((u) => u.name).join(", ") || "None"}
                        </p>
                      </div>
                      {(userIsAdmin || userIsAssigned) && (
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
                              {/* Check/Uncheck - Available to both admins and assigned users */}
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

                              {/* Admin-only options */}
                              {userIsAdmin && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateTask(
                                        task.id,
                                        task.title,
                                        task.description,
                                        task.start_date,
                                        task.end_date
                                      )
                                    }
                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  >
                                    <FaEdit className="mr-2" />
                                    Update
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleAssignUsersToTask(task.id, task.users)
                                    }
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
                                </>
                              )}
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

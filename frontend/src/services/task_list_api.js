import api from "./api";

const task_list_api = {
  getTaskList: (tasklistId) => api.get(`/tasklist/${tasklistId}`),

  createTaskList: (wgId, formData) =>
    api.post("/tasklist", { ...formData, wg_id: wgId }),

  updateTaskList: (tasklistId, formData) =>
    api.put(`/tasklist/${tasklistId}`, formData),

  deleteTaskList: (tasklistId) => api.delete(`/tasklist/${tasklistId}`),

  checkTaskList: (tasklistId) =>
    api.post(`/tasklist/${tasklistId}/check_tasklist`),

  uncheckTaskList: (tasklistId) =>
    api.post(`/tasklist/${tasklistId}/uncheck_tasklist`),

  assignUsersToTaskList: (tasklistId, userIds) =>
    api.post(`/tasklist/${tasklistId}/assign_users`, { user_ids: userIds }),

  removeUsersFromTaskList: (tasklistId, userIds) =>
  api.post(`/tasklist/${tasklistId}/remove_users`, { user_ids: userIds }),

  createTask: (taskListId, taskData) => {
    return api.post(`/tasklist/${taskListId}/add_task`, taskData);
  },
};

export default task_list_api;
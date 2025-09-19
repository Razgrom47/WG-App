import api from './api';

const task_api = {
  getTask: (taskId) => {
    return api.get(`/task/${taskId}`);
  },
  updateTask: (taskId, taskData) => {
    return api.put(`/task/${taskId}`, taskData);
  },
  deleteTask: (taskId) => {
    return api.delete(`/task/${taskId}`);
  },
  checkTask: (taskId) => {
    return api.post(`/task/${taskId}/check`);
  },
  getUndoneTasksForWG: (wgId) => {
    return api.get(`/tasks/undone/wg/${wgId}`);
  },
  assignUsersToTask: (taskId, userIds) => {
    return api.post(`/task/${taskId}/assign_users`, { user_ids: userIds });
  },
  removeUsersFromTask: (taskId, userIds) => {
    return api.post(`/task/${taskId}/remove_users`, { user_ids: userIds });
  },
};

export default task_api;
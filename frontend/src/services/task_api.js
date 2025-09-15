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
  assignUsersToTask: (taskId, userIds) => {
    return api.post(`/task/${taskId}/assign`, { user_ids: userIds });
  },
};

export default task_api;
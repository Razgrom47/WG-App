import api from "./api";

const wg_api = {
  // Get all WGs for the authenticated user
  getWGs: () => api.get("/wg/my"),

  // Create a new WG
  createWG: (formData) => api.post("/wg", formData),

  // Get a specific WG by ID
  getWG: (id) => api.get(`/wg/${id}`),

  // Update WG details
  updateWG: (id, formData) => api.put(`/wg/${id}`, formData),

  // Delete a WG
  deleteWG: (id) => api.delete(`/wg/${id}`),

  // Invite a user to a WG
  inviteUser: (wgId, userId) => api.post(`/wg/${wgId}/invite`, { userId }),

  // Kick a user from a WG
  kickUser: (wgId, userId) => api.delete(`/wg/${wgId}/kick`, { userId: userId }),

  // Leave a WG
  leaveWG: (wgId) => api.post(`/wg/${wgId}/leave`),

  // Additional routes as per requirements
  getBudgetPlans: (wgId) => api.get(`/wg/${wgId}/budget`),
  getTaskLists: (wgId) => api.get(`/wg/${wgId}/tasks`),
  getShoppingLists: (wgId) => api.get(`/wg/${wgId}/shopping`),

  // NEW: Admin-specific actions
  toggleAdmin: (wgId, userId) => api.post(`/wg/${wgId}/admin`, { user_id: userId }),
};

export default wg_api;
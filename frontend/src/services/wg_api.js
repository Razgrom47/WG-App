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

  inviteUserByUsername: (wgId, username) => api.post(`/wg/${wgId}/invite_by_username`, { username: username }),

  // Kick a user from a WG
  kickUser: (wgId, userId) => api.post(`/wg/${wgId}/kick`, { user_id: userId }),

  // Leave a WG
  leaveWG: (wgId) => api.post(`/user/leave_wg/${wgId}`),

  // Join WG
  joinWG: (wgId) => api.post(`/user/join/${wgId}`),

  // Get all task lists for a WG
  getTaskLists: (wgId) => api.get(`/wg/${wgId}/tasklists`),

  // Get all budget plans for a WG
  getBudgetPlans: (wgId) => api.get(`/wg/${wgId}/budgetplans`),

  // Get all shopping lists for a WG
  getShoppingLists: (wgId) => api.get(`/wg/${wgId}/shoppinglists`),

  // Admin-specific actions
  toggleAdmin: (wgId, userId) => api.post(`/wg/${wgId}/admin`, { user_id: userId }),
  
  transferCreator: (wgId, username) => api.post(`/wg/${wgId}/transfer_creator`, { username: username }),
};

export default wg_api;
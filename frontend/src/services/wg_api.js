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
  inviteUser: (wgId, userId) => api.post(`/wg/${wgId}/invite`, { user_id: userId  }),

  // Kick a user from a WG
  kickUser: (wgId, userId) => api.post(`/wg/${wgId}/kick`, { user_id: userId }),

  // Leave a WG
  leaveWG: (wgId) => api.post(`/user/leave/${wgId}`),

  // Join WG
  joinWG: (wgId) => api.post(`/user/join/${wgId}`),
  
  // Additional routes as per requirements
  getBudgetPlans: (wgId) => api.get(`/wg/${wgId}/budget`),
  getTaskLists: (wgId) => api.get(`/wg/${wgId}/tasks`),
  getShoppingLists: (wgId) => api.get(`/wg/${wgId}/shopping`),

  // Admin-specific actions
  toggleAdmin: (wgId, userId) => api.post(`/wg/${wgId}/admin`, { user_id: userId }),
  transferCreator: (wgId, newCreatorId) => api.post(`/wg/${wgId}/transfer_creator`, { user_id: newCreatorId }),
};

export default wg_api;
import api from "./api";

const cost_api = {
  updateCost: (id, formData) => api.put(`/cost/${id}`, formData),
  deleteCost: (id) => api.delete(`/cost/${id}`),
};

export default cost_api;
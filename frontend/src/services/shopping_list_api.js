import api from "./api";

const shopping_list_api = {
  getShoppingList: (id) => api.get(`/shoppinglist/${id}`),
  createShoppingList: (wgId, formData) => api.post(`/shoppinglist`, { ...formData, wg_id: wgId }),
  updateShoppingList: (id, formData) => api.put(`/shoppinglist/${id}`, formData),
  deleteShoppingList: (id) => api.delete(`/shoppinglist/${id}`),
  toggleCheckShoppingList: (id) => api.put(`/shoppinglist/${id}/check`),
};

export default shopping_list_api;
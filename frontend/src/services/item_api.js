import api from "./api";

const item_api = {
  createItem: (shoppingListId, formData) => api.post(`/item`, { ...formData, shoppinglist_id: shoppingListId }),
  updateItem: (id, formData) => api.put(`/item/${id}`, formData),
  deleteItem: (id) => api.delete(`/item/${id}`),
  toggleCheckItem: (id) => api.put(`/item/${id}/check`),
};

export default item_api;
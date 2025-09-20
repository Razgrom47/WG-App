import api from './api';

const budget_planning_api = {
  // Fetches a single budget plan by ID
  getBudgetPlan: (id) => {
    return api.get(`/budgetplanning/${id}`);
  },

  // Fetches all budget plans for a specific workgroup
  getBudgetPlans: (wgId) => {
    return api.get(`/wg/${wgId}/budgetplanning`);
  },

  // Creates a new budget planning
  createBudgetPlanning: (data) => {
    return api.post('/budgetplanning', data);
  },

  // Updates an existing budget planning
  updateBudgetPlanning: (budgetplanningId, data) => {
    return api.put(`/budgetplanning/${budgetplanningId}`, data);
  },

  // Deletes a budget planning
  deleteBudgetPlanning: (budgetplanningId) => {
    return api.delete(`/budgetplanning/${budgetplanningId}`);
  },

  // Adds a cost to a budget planning
  addCostToBudgetPlanning: (budgetplanningId, data) => {
    return api.post(`/budgetplanning/${budgetplanningId}/add_cost`, data);
  },

  // Updates the paid amount for a cost
  checkCost: (budgetplanningId, costId, data) => {
    return api.post(`/budgetplanning/${budgetplanningId}/check_cost`, { cost_id: costId, paid: data.paid });
  },
};

export default budget_planning_api;
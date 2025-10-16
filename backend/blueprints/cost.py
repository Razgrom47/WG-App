from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Cost, BudgetPlanning, User, WG
from decorators import token_required

cost_bp = Blueprint('cost_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def serialize_cost(cost):
    return {
        'id': cost.idCost,
        'title': cost.title,
        'description': cost.description,
        'goal': cost.goal,
        'paid': cost.paid,
        'budgetplanning_id': cost.budgetplanning_id,
        'users': [{'id': u.idUser, 'name': u.strUser} for u in cost.users]
    }

def update_budgetplanning_goal(budgetplanning_id):
    """Calculates the total goal of all costs and updates the BudgetPlanning goal."""
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if bp:
        total_goal = db.session.query(db.func.sum(Cost.goal)).filter(
            Cost.budgetplanning_id == budgetplanning_id
        ).scalar() or 0.0
        bp.goal = total_goal
        # Note: db.session.commit() will be called in the route function
        return True
    return False

@cost_bp.route('/cost/<string:cost_id>', methods=['PUT'])
@token_required
def update_cost(cost_id):
    """
    Update a cost
    ---
    tags:
      - Cost
    security:
      - Bearer: []
    parameters:
      - name: cost_id
        in: path
        required: true
        schema:
          type: integer
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
              description:
                type: string
              goal:
                type: number
              paid:
                type: number
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      200:
        description: Cost updated
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Cost'
      403:
        description: Not authorized
      404:
        description: Cost not found
    """
    cost = Cost.query.get_or_404(cost_id)
    bp = BudgetPlanning.query.get(cost.budgetplanning_id)
    if not bp or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    if 'goal' in data and data['goal'] != cost.goal:
        cost.goal = data['goal']
        cost_updated = True
    if 'title' in data:
        cost.title = data['title']
    if 'description' in data:
        cost.description = data['description']        
    if 'goal' in data and data['goal'] != cost.goal:
        cost.goal = data['goal']
        cost_updated = True
    if 'paid' in data:
        cost.paid = data['paid']
    if 'user_ids' in data:
        users = User.query.filter(User.idUser.in_(data['user_ids'])).all()
        cost.users = users
    if cost_updated:
        update_budgetplanning_goal(cost.budgetplanning_id)
    db.session.commit()
    return jsonify(serialize_cost(cost)), 200

@cost_bp.route('/cost/<string:cost_id>', methods=['DELETE'])
@token_required
def delete_cost(cost_id):
    """
    Delete a cost
    ---
    tags:
      - Cost
    security:
      - Bearer: []
    parameters:
      - name: cost_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Cost deleted successfully
      403:
        description: Not authorized
      404:
        description: Cost not found
    """
    cost = Cost.query.get_or_404(cost_id)
    bp = BudgetPlanning.query.get(cost.budgetplanning_id)
    if not bp or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    update_budgetplanning_goal(cost.budgetplanning_id)
    db.session.delete(cost)
    db.session.commit()
    return jsonify({'message': 'Cost deleted successfully'}), 204
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

@cost_bp.route('/cost', methods=['POST'])
@token_required
def create_cost():
    """
    Create a new cost
    ---
    tags:
      - Cost
    security:
      - Bearer: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              budgetplanning_id:
                type: integer
              title:
                type: string
              description:
                type: string
              goal:
                type: number
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      201:
        description: Cost created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Cost'
      403:
        description: Not authorized
    """
    data = request.get_json()
    bp = BudgetPlanning.query.get(data['budgetplanning_id'])
    if not bp or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    users = User.query.filter(User.idUser.in_(data.get('user_ids', []))).all()
    new_cost = Cost(
        title=data['title'],
        description=data.get('description', ''),
        goal=data['goal'],
        budgetplanning_id=data['budgetplanning_id'],
        users=users
    )
    db.session.add(new_cost)
    db.session.commit()
    return jsonify(serialize_cost(new_cost)), 201

@cost_bp.route('/cost/<int:cost_id>', methods=['PUT'])
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
    cost.title = data.get('title', cost.title)
    cost.description = data.get('description', cost.description)
    cost.goal = data.get('goal', cost.goal)
    cost.paid = data.get('paid', cost.paid)
    if 'user_ids' in data:
        users = User.query.filter(User.idUser.in_(data['user_ids'])).all()
        cost.users = users
    db.session.commit()
    return jsonify(serialize_cost(cost)), 200

@cost_bp.route('/cost/<int:cost_id>', methods=['DELETE'])
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
    db.session.delete(cost)
    db.session.commit()
    return jsonify({'message': 'Cost deleted successfully'}), 204
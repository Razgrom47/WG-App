from flask import Blueprint, request, jsonify, g
from extensions import db
from models import BudgetPlanning, Cost, WG, User
from decorators import token_required

budget_planning_bp = Blueprint('budget_planning_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.admins

def serialize_budgetplanning(bp):
    return {
        'id': bp.idBudgetPlanning,
        'title': bp.title,
        'description': bp.description,
        'goal': bp.goal,
        'deadline': bp.deadline,
        'created_date': bp.created_date,
        'creator': {'id': bp.creator_id},
        'wg_id': bp.wg_id,
        'users': [{'id': u.idUser, 'name': u.strUser} for u in bp.users],
        'costs': [
            {
                'id': c.idCost,
                'title': c.title,
                'description': c.description,
                'goal': c.goal,
                'paid': c.paid,
                'users': [{'id': u.idUser, 'name': u.strUser} for u in c.users]
            } for c in bp.costs
        ]
    }

@budget_planning_bp.route('/budgetplanning', methods=['POST'])
@token_required
def create_budget_planning():
    """
    Create a new budget planning
    ---
    tags:
      - BudgetPlanning
    security:
      - Bearer: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              wg_id:
                type: integer
              title:
                type: string
              description:
                type: string
              goal:
                type: number
              deadline:
                type: string
                format: date-time
    responses:
      201:
        description: Budget planning created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BudgetPlanning'
      403:
        description: Not authorized
    """
    data = request.get_json()
    wg_id = data['wg_id']
    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    new_bp = BudgetPlanning(
        title=data['title'],
        description=data.get('description'),
        goal=data.get('goal'),
        deadline=data.get('deadline'),
        creator_id=g.current_user.idUser,
        wg_id=wg_id
    )
    db.session.add(new_bp)
    db.session.commit()
    return jsonify(serialize_budgetplanning(new_bp)), 201

@budget_planning_bp.route('/budgetplanning/<int:budgetplanning_id>', methods=['DELETE'])
@token_required
def delete_budget_planning(budgetplanning_id):
    """
    Delete a budget planning
    ---
    tags:
      - BudgetPlanning
    security:
      - Bearer: []
    parameters:
      - name: budgetplanning_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Budget planning deleted successfully
      403:
        description: Not authorized
      404:
        description: Budget planning not found
    """
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if not bp:
        return jsonify({'message': 'Budget planning not found'}), 404
    if not (g.current_user.idUser == bp.creator_id or is_admin_of_wg(g.current_user, bp.wg_id)):
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(bp)
    db.session.commit()
    return jsonify({'message': 'Budget planning deleted successfully'}), 204

@budget_planning_bp.route('/budgetplanning/<int:budgetplanning_id>/add_cost', methods=['POST'])
@token_required
def add_cost(budgetplanning_id):
    """
    Add a cost to a budget planning
    ---
    tags:
      - BudgetPlanning
    security:
      - Bearer: []
    parameters:
      - name: budgetplanning_id
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
              user_ids:
                type: array
                items:
                  type: integer
    responses:
      201:
        description: Cost created
      403:
        description: Not authorized
      404:
        description: Budget planning not found
    """
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if not bp or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized or not found'}), 403
    data = request.get_json()
    users = User.query.filter(User.idUser.in_(data.get('user_ids', []))).all()
    new_cost = Cost(
        title=data['title'],
        description=data.get('description'),
        goal=data.get('goal'),
        budgetplanning_id=budgetplanning_id,
        users=users
    )
    db.session.add(new_cost)
    db.session.commit()
    return jsonify({'id': new_cost.idCost, 'title': new_cost.title}), 201

@budget_planning_bp.route('/budgetplanning/<int:budgetplanning_id>/check_cost', methods=['POST'])
@token_required
def check_cost(budgetplanning_id):
    """
    Update paid amount for a cost
    ---
    tags:
      - BudgetPlanning
    security:
      - Bearer: []
    parameters:
      - name: budgetplanning_id
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
              cost_id:
                type: integer
              paid:
                type: number
    responses:
      200:
        description: Cost updated successfully
      404:
        description: Cost not found or does not belong to this budget planning
    """
    data = request.get_json()
    cost = Cost.query.get(data['cost_id'])
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if not cost or cost.budgetplanning_id != budgetplanning_id or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Cost not found or not authorized'}), 404
    cost.paid = data.get('paid', cost.paid)
    db.session.commit()
    return jsonify({'message': 'Cost updated successfully', 'paid': cost.paid}), 200

@budget_planning_bp.route('/budgetplanning/<int:budgetplanning_id>', methods=['PUT'])
@token_required
def update_budget_planning(budgetplanning_id):
    """
    Update a budget planning
    ---
    tags:
      - BudgetPlanning
    security:
      - Bearer: []
    parameters:
      - name: budgetplanning_id
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
              deadline:
                type: string
                format: date-time
    responses:
      200:
        description: Budget planning updated successfully
      404:
        description: Budget planning not found
    """
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if not bp or not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized or not found'}), 404
    data = request.get_json()
    bp.title = data.get('title', bp.title)
    bp.description = data.get('description', bp.description)
    bp.goal = data.get('goal', bp.goal)
    bp.deadline = data.get('deadline', bp.deadline)
    db.session.commit()
    return jsonify(serialize_budgetplanning(bp)), 200
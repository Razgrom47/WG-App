from flask import Blueprint, request, jsonify, g
from extensions import db
from models import BudgetPlanning, Cost, WG, User
from decorators import token_required
from datetime import datetime

budget_planning_bp = Blueprint('budget_planning_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and (user in wg.admins or g.current_user == wg.creator)

def serialize_budgetplanning(bp):
    return {
        'id': bp.idBudgetPlanning,
        'title': bp.title,
        'description': bp.description,
        'goal': bp.goal,
        'deadline': bp.deadline.isoformat() if bp.deadline else None,
        'created_date': bp.created_date.isoformat() if bp.created_date else None,
        'creator': {'id': bp.creator_id, 'name': bp.creator.strUser if bp.creator else None},
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
    Create a new budget planning.
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
            required:
              - title
              - wg_id
            properties:
              title:
                type: string
              description:
                type: string
              goal:
                type: number
              deadline:
                type: string
                format: date
              wg_id:
                type: integer
    responses:
      201:
        description: Budget planning created successfully
    """
    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    goal = data.get('goal')
    deadline_str = data.get('deadline')
    wg_id = data.get('wg_id')

    if not all([title, wg_id]):
        return jsonify({'message': 'Missing required fields'}), 400

    # Check if the user is a member of the WG
    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized to create budget planning in this WG'}), 403

    deadline = None
    if deadline_str:
        try:
            deadline = datetime.strptime(deadline_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format for deadline. Use YYYY-MM-DD'}), 400

    new_budget_planning = BudgetPlanning(
        title=title,
        description=description,
        goal=goal,
        deadline=deadline,
        creator_id=g.current_user.idUser,
        wg_id=wg_id
    )

    db.session.add(new_budget_planning)
    db.session.commit()

    return jsonify(serialize_budgetplanning(new_budget_planning)), 201

@budget_planning_bp.route('/budgetplanning/<string:budgetplanning_id>', methods=['GET'])
@token_required
def get_budget_planning(budgetplanning_id):
    """
    Get a specific budget planning by ID
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
      200:
        description: Budget planning details
      403:
        description: Not authorized
      404:
        description: Budget planning not found
    """
    bp = BudgetPlanning.query.get(budgetplanning_id)
    if not bp:
        return jsonify({'message': 'Budget planning not found'}), 404
    
    if not is_user_of_wg(g.current_user, bp.wg_id):
        return jsonify({'message': 'Not authorized to view this budget planning'}), 403

    return jsonify(serialize_budgetplanning(bp)), 200

@budget_planning_bp.route('/budgetplanning/<string:budgetplanning_id>', methods=['PUT'])
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
    
    if 'title' in data:
        bp.title = data['title']
    if 'description' in data:
        bp.description = data['description']
    if 'goal' in data:
        bp.goal = data['goal']
    
    # Handle the deadline update
    if 'deadline' in data:
        deadline_str = data['deadline']
        if deadline_str:
            try:
                bp.deadline = datetime.strptime(deadline_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'message': 'Invalid date format for deadline. Use YYYY-MM-DD'}), 400
        else:
            bp.deadline = None

    db.session.commit()
    return jsonify({'message': 'Budget planning updated successfully'}), 200

@budget_planning_bp.route('/budgetplanning/<string:budgetplanning_id>', methods=['DELETE'])
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

@budget_planning_bp.route('/budgetplanning/<string:budgetplanning_id>/add_cost', methods=['POST'])
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

@budget_planning_bp.route('/budgetplanning/<string:budgetplanning_id>/check_cost', methods=['POST'])
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
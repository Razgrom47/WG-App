from flask import Blueprint, request, jsonify, g
from extensions import db
from models import ShoppingList, Item, User, WG
from decorators import token_required

shopping_list_bp = Blueprint('shopping_list_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and (user in wg.admins or g.current_user.idUser == wg.creator_id)

def serialize_shoppinglist(shoppinglist):
    return {
        'id': shoppinglist.idShoppingList,
        'title': shoppinglist.title,
        'description': shoppinglist.description,
        'date': shoppinglist.date,
        'creator': {'id': shoppinglist.creator_id, 'name': shoppinglist.creator.strUser if shoppinglist.creator else None},
        'wg_id': shoppinglist.wg_id,
        'items': [
            {
                'id': item.idItem,
                'title': item.title,
                'description': item.description,
                'is_checked': item.is_checked
            } for item in shoppinglist.items
        ]
    }

@shopping_list_bp.route('/shoppinglist', methods=['POST'])
@token_required
def create_shopping_list():
    """
    Create a new shopping list
    ---
    tags:
      - ShoppingList
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
    responses:
      201:
        description: Shopping list created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ShoppingList'
      403:
        description: Not authorized
    """
    data = request.get_json()
    wg_id = data['wg_id']
    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    new_list = ShoppingList(
        title=data['title'],
        description=data.get('description'),
        creator_id=g.current_user.idUser,
        wg_id=wg_id
    )
    db.session.add(new_list)
    db.session.commit()
    return jsonify(serialize_shoppinglist(new_list)), 201

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>', methods=['GET'])
@token_required
def get_shopping_list(shoppinglist_id):
    """
    Get a specific shopping list by ID
    ---
    tags:
      - ShoppingList
    security:
      - Bearer: []
    parameters:
      - name: shoppinglist_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Shopping list found
      403:
        description: Not authorized
      404:
        description: Shopping list not found
    """
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not shopping_list:
        return jsonify({'message': 'Shopping list not found'}), 404
    if not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    return jsonify(serialize_shoppinglist(shopping_list)), 200

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>', methods=['DELETE'])
@token_required
def delete_shopping_list(shoppinglist_id):
    """
    Delete a shopping list
    ---
    tags:
      - ShoppingList
    security:
      - Bearer: []
    parameters:
      - name: shoppinglist_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Shopping list deleted successfully
      403:
        description: Not authorized
      404:
        description: Shopping list not found
    """
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not shopping_list:
        return jsonify({'message': 'Shopping list not found'}), 404
    
    if shopping_list.creator_id != g.current_user.idUser and not is_admin_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized to delete this shopping list'}), 403
        
    db.session.delete(shopping_list)
    db.session.commit()
    return jsonify({'message': 'Shopping list deleted successfully'}), 204

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>', methods=['PUT'])
@token_required
def update_shopping_list(shoppinglist_id):
    """
    Update a shopping list
    ---
    tags:
      - ShoppingList
    security:
      - Bearer: []
    parameters:
      - name: shoppinglist_id
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
    responses:
      200:
        description: Shopping list updated
      403:
        description: Not authorized
    """
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    shopping_list.title = data.get('title', shopping_list.title)
    shopping_list.description = data.get('description', shopping_list.description)
    db.session.commit()
    return jsonify(serialize_shoppinglist(shopping_list)), 200

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>/check', methods=['PUT'])
@token_required
def check_shopping_list(shoppinglist_id):
    """
    Check/uncheck a shopping list
    ---
    tags:
      - ShoppingList
    security:
      - Bearer: []
    parameters:
      - name: shoppinglist_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Shopping list checked/unchecked
      403:
        description: Not authorized
      404:
        description: Shopping list not found
    """
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not shopping_list:
        return jsonify({'message': 'Shopping list not found'}), 404
    if not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    
    # Toggle the shopping list's checked status
    shopping_list.is_checked = not shopping_list.is_checked
    
    # If the shopping list is now checked, check all items
    if shopping_list.is_checked:
        for item in shopping_list.items:
            item.is_checked = True
    
    db.session.commit()
    return jsonify({'message': 'Shopping list checked successfully'}), 200

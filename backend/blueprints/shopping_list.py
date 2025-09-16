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
    return wg and (user in wg.admins or g.current_user == wg.creator)

def serialize_shoppinglist(shoppinglist):
    return {
        'id': shoppinglist.idShoppingList,
        'title': shoppinglist.title,
        'description': shoppinglist.description,
        'date': shoppinglist.date,
        'creator': {'id': shoppinglist.creator_id},
        'wg_id': shoppinglist.wg_id,
        'users': [{'id': u.idUser, 'name': u.strUser} for u in shoppinglist.users],
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
    if not (g.current_user.idUser == shopping_list.creator_id or is_admin_of_wg(g.current_user, shopping_list.wg_id)):
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(shopping_list)
    db.session.commit()
    return jsonify({'message': 'Shopping list deleted successfully'}), 204

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>/add_item', methods=['POST'])
@token_required
def add_item(shoppinglist_id):
    """
    Add an item to a shopping list
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
      201:
        description: Item created
      403:
        description: Not authorized
    """
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    new_item = Item(
        title=data['title'],
        description=data.get('description'),
        shoppinglist_id=shoppinglist_id
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({'id': new_item.idItem, 'title': new_item.title}), 201

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>/check_item', methods=['POST'])
@token_required
def check_item(shoppinglist_id):
    """
    Toggle check status of an item in a shopping list
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
              item_id:
                type: integer
    responses:
      200:
        description: Item check status updated
      404:
        description: Item not found or not authorized
    """
    data = request.get_json()
    item = Item.query.get(data['item_id'])
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not item or item.shoppinglist_id != shoppinglist_id or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Item not found or not authorized'}), 404
    item.is_checked = not item.is_checked
    db.session.commit()
    return jsonify({'id': item.idItem, 'is_checked': item.is_checked}), 200

@shopping_list_bp.route('/shoppinglist/<int:shoppinglist_id>/update_item', methods=['PUT'])
@token_required
def update_item_in_list(shoppinglist_id):
    """
    Update an item in a shopping list
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
              item_id:
                type: integer
              title:
                type: string
              description:
                type: string
    responses:
      200:
        description: Item updated
      404:
        description: Item not found or not authorized
    """
    data = request.get_json()
    item = Item.query.get(data['item_id'])
    shopping_list = ShoppingList.query.get(shoppinglist_id)
    if not item or item.shoppinglist_id != shoppinglist_id or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Item not found or not authorized'}), 404
    item.title = data.get('title', item.title)
    item.description = data.get('description', item.description)
    db.session.commit()
    return jsonify({'id': item.idItem, 'title': item.title, 'description': item.description}), 200

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
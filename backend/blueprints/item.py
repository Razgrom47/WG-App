from flask import Blueprint, request, jsonify, g
from extensions import db
from models import Item, ShoppingList, WG
from decorators import token_required

item_bp = Blueprint('item_bp', __name__)

def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users

def serialize_item(item):
    return {
        'id': item.idItem,
        'title': item.title,
        'description': item.description,
        'is_checked': item.is_checked,
        'shoppinglist_id': item.shoppinglist_id
    }

@item_bp.route('/item', methods=['POST'])
@token_required
def create_item():
    """
    Create a new item
    ---
    tags:
      - Item
    security:
      - Bearer: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - shoppinglist_id
              - title
            properties:
              shoppinglist_id:
                type: integer
                description: The ID of the parent Shopping List.
              title:
                type: string
                description: The title of the new item.
              description:
                type: string
                description: An optional description for the item.
    responses:
      201:
        description: Item created
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: integer
                  description: The unique identifier of the item.
                title:
                  type: string
                  description: The title of the item.
                description:
                  type: string
                  description: The description of the item.
                is_checked:
                  type: boolean
                  description: Whether the item has been marked as purchased.
                shoppinglist_id:
                  type: integer
                  description: The ID of the parent Shopping List.
      403:
        description: Not authorized (e.g., user is not part of the shopping list's workgroup)
    """
    data = request.get_json()
    shopping_list = ShoppingList.query.get(data['shoppinglist_id'])
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    new_item = Item(
        title=data['title'],
        description=data.get('description', ''),
        shoppinglist_id=data['shoppinglist_id']
    )
    shopping_list.is_checked = False
    db.session.add(new_item)
    db.session.commit()
    return jsonify(serialize_item(new_item)), 201

@item_bp.route('/item/<string:item_id>', methods=['PUT'])
@token_required
def update_item(item_id):
    """
    Update an item
    ---
    tags:
      - Item
    security:
      - Bearer: []
    parameters:
      - name: item_id
        in: path
        required: true
        schema:
          type: integer
          description: The ID of the item to update.
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
                description: The new title for the item.
              description:
                type: string
                description: The new description for the item.
              is_checked:
                type: boolean
                description: Whether the item is checked off (e.g., purchased).
            # Note: Fields are optional since it's an update (PUT/PATCH).
    responses:
      200:
        description: Item updated
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: integer
                  description: The unique identifier of the item.
                title:
                  type: string
                  description: The title of the item.
                description:
                  type: string
                  description: The description of the item.
                is_checked:
                  type: boolean
                  description: Whether the item has been marked as purchased.
                shoppinglist_id:
                  type: integer
                  description: The ID of the parent Shopping List.
      403:
        description: Not authorized (e.g., user is not part of the shopping list's workgroup)
      404:
        description: Item not found
    """
    item = Item.query.get_or_404(item_id)
    shopping_list = ShoppingList.query.get(item.shoppinglist_id)
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    item.title = data.get('title', item.title)
    item.description = data.get('description', item.description)
    item.is_checked = data.get('is_checked', item.is_checked)
    db.session.commit()
    return jsonify(serialize_item(item)), 200

@item_bp.route('/item/<string:item_id>', methods=['DELETE'])
@token_required
def delete_item(item_id):
    """
    Delete an item
    ---
    tags:
      - Item
    security:
      - Bearer: []
    parameters:
      - name: item_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      204:
        description: Item deleted successfully
      403:
        description: Not authorized
      404:
        description: Item not found
    """
    item = Item.query.get_or_404(item_id)
    shopping_list = ShoppingList.query.get(item.shoppinglist_id)
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted successfully'}), 204

@item_bp.route('/item/<string:item_id>/check', methods=['PUT'])
@token_required
def check_item(item_id):
    """
    Check/uncheck an item
    ---
    tags:
      - Item
    security:
      - Bearer: []
    parameters:
      - name: item_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: Item checked/unchecked
      403:
        description: Not authorized
      404:
        description: Item not found
    """
    item = Item.query.get_or_404(item_id)
    shopping_list = ShoppingList.query.get(item.shoppinglist_id)
    if not shopping_list or not is_user_of_wg(g.current_user, shopping_list.wg_id):
        return jsonify({'message': 'Not authorized'}), 403
    
    item.is_checked = not item.is_checked
    
    # Check if all items in the list are now checked
    all_items_checked = all(i.is_checked for i in shopping_list.items)
    shopping_list.is_checked = all_items_checked
    
    db.session.commit()
    return jsonify(serialize_item(item)), 200
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import WG, User
from decorators import token_required

wg_bp = Blueprint('wg_bp', __name__)


def is_user_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and user in wg.users


def is_admin_of_wg(user, wg_id):
    wg = WG.query.get(wg_id)
    return wg and (user in wg.admins or g.current_user == wg.creator)


def serialize_wg(wg):
    return {
        'id': wg.idWG,
        'title': wg.title,
        'address': wg.address,
        'etage': wg.etage,
        'description': wg.description,
        'is_public': wg.is_public,
        'creator': {'id': wg.creator.idUser, 'name': wg.creator.strUser},
        'users': [{'id': user.idUser, 'name': user.strUser} for user in wg.users],
        'admins': [{'id': admin.idUser, 'name': admin.strUser} for admin in wg.admins],
        'tasklists': [{'id': tasklist.idTaskList, 'title': tasklist.title} for tasklist in wg.tasklists],
        'shoppinglists': [{'id': shoppinglist.idShoppingList, 'title': shoppinglist.title} for shoppinglist in wg.shoppinglists],
        'budgetplannings': [{'id': budget.idBudgetPlanning, 'title': budget.title} for budget in wg.budgetplannings]
    }


@wg_bp.route('/wg', methods=['POST'])
@token_required
def create_wg():
    """
    Create a new WG
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - title
              - address
              - etage
            properties:
              title:
                type: string
                example: MyWG
              address:
                type: string
                example: Hauptstrasse 1
              etage:
                type: string
                example: 2
              description:
                type: string
                example: A nice shared apartment
    responses:
      201:
        description: WG created successfully
        content:
          application/json:
            example: {"id": 1}
      400:
        description: Missing required fields
      409:
        description: WG with same title or address/etage already exists
    """
    data = request.get_json()
    title = data.get('title')
    address = data.get('address')
    etage = data.get('etage')
    description = data.get('description', '')
    creator = g.current_user

    if not title or not address or not etage:
        return jsonify({'message': 'Missing required fields'}), 400

    # Check unique constraints
    if WG.query.filter_by(title=title).first():
        return jsonify({'message': 'Title already exists'}), 409
    if WG.query.filter_by(address=address, etage=etage).first():
        return jsonify({'message': 'WG with this address and etage already exists'}), 409

    new_wg = WG(
        title=title,
        address=address,
        etage=etage,
        description=description,
        creator=creator
    )
    new_wg.users.append(creator)
    new_wg.admins.append(creator)
    db.session.add(new_wg)
    db.session.commit()
    return jsonify({'title': new_wg.title,
                    'address': new_wg.address,
                    'etage': new_wg.etage,
                    'description': new_wg.description,
                    'creator': {'id': new_wg.creator.idUser, 'name': new_wg.creator.strUser}, }), 201


@wg_bp.route('/wg/<string:wg_id>', methods=['DELETE'])
@token_required
def delete_wg(wg_id):
    """
    Delete a WG
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID to delete
    responses:
      204:
        description: WG deleted successfully
      403:
        description: Not authorized
      404:
        description: WG not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    # Only creator or admin can delete
    if g.current_user not in wg.admins and g.current_user != wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    db.session.delete(wg)
    db.session.commit()
    return jsonify({'message': 'WG deleted successfully'}), 204


@wg_bp.route('/wg/<string:wg_id>/invite_by_username', methods=['POST'])
@token_required
def invite_user_by_username(wg_id):
    """
    Invite a user to WG by username
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
                example: 'testuser'
    responses:
      200:
        description: User invited successfully
        content:
          application/json:
            example: {"message": "User invited successfully"}
      403:
        description: Not authorized
      404:
        description: WG or user not found
      409:
        description: User already in WG
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    if g.current_user not in wg.admins and g.current_user is not wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    username = data.get('username')
    user = User.query.filter_by(strUser=username).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user in wg.users:
        return jsonify({'message': 'User already in WG'}), 409
    wg.users.append(user)
    db.session.commit()
    return jsonify({'message': 'User invited successfully'}), 200


@wg_bp.route('/wg/<string:wg_id>/kick', methods=['POST'])
@token_required
def kick_user(wg_id):
    """
    Kick a user from WG
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              user_id:
                type: integer
                example: 5
    responses:
      200:
        description: User kicked successfully
        content:
          application/json:
            example: {"message": "User kicked successfully"}
      403:
        description: Not authorized or cannot kick creator
      404:
        description: WG or user not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    if g.current_user not in wg.admins and g.current_user is not wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user or user not in wg.users:
        return jsonify({'message': 'User not in WG'}), 404
    if user == wg.creator:
        return jsonify({'message': 'Cannot kick creator'}), 403
    wg.users.remove(user)
    if user in wg.admins:
        wg.admins.remove(user)
    db.session.commit()
    return jsonify({'message': 'User kicked successfully'}), 200


@wg_bp.route('/wg/<string:wg_id>/admin', methods=['POST'])
@token_required
def toggle_user_admin(wg_id):
    """
    Toggle a user's admin status in a WG.
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              user_id:
                type: integer
                example: 5
    responses:
      200:
        description: Admin status toggled successfully
        content:
          application/json:
            example: {"message": "User made admin successfully"}
      403:
        description: Not authorized
      404:
        description: WG or user not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    if g.current_user not in wg.admins and g.current_user != wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user or user not in wg.users:
        return jsonify({'message': 'User not in WG'}), 404
    if user in wg.admins:
        wg.admins.remove(user)
        message = "User removed from admins successfully"
    else:
        wg.admins.append(user)
        message = "User made admin successfully"
    db.session.commit()
    return jsonify({'message': message}), 200


@wg_bp.route('/wg/my', methods=['GET'])
@token_required
def get_my_wgs():
    """
    Get all WGs of the current user
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    responses:
      200:
        description: List of user WGs with detailed information
        content:
          application/json:
            example: [
              {
                "id": 1,
                "title": "MyWG",
                "address": "Hauptstrasse 1",
                "etage": "2",
                "description": "A nice shared apartment",
                "creator": {"id": 1, "name": "creator1"},
                "users": [{"id": 2, "name": "user1"}, {"id": 3, "name": "user2"}],
                "admins": [{"id": 1, "name": "creator1"}],
                "tasklists": [{"id": 1, "title": "TaskList1"}],
                "shoppinglists": [{"id": 1, "title": "ShoppingList1"}],
                "budgetplannings": [{"id": 1, "title": "Budget1"}]
              }
            ]
    """
    user = g.current_user
    wgs = user.wgs  # Get all WGs the user is part of
    serialized_wgs = [serialize_wg(wg) for wg in wgs]
    return jsonify(serialized_wgs), 200


@wg_bp.route('/wg/<string:wg_id>', methods=['GET'])
@token_required
def get_wg_info(wg_id):
    """
    Get information about a WG
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID
    responses:
      200:
        description: WG info retrieved successfully
        content:
          application/json:
            example:
              {
                "wg": {
                  "title": "MyWG",
                  "address": "Hauptstrasse 1",
                  "etage": "2",
                  "description": "A nice flat",
                  "creator_id": 1,
                  "user_names": ["user1", "user2"],
                  "admin_names": ["admin1"]
                }
              }
      403:
        description: Not authorized
      404:
        description: WG not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    if g.current_user not in wg.users and g.current_user != wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    return jsonify(serialize_wg(wg)), 200


@wg_bp.route('/wg/<string:wg_id>', methods=['PUT'])
@token_required
def update_wg(wg_id):
    """
    Update a WG
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID to update
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              title:
                type: string
                example: New WG Title
              address:
                type: string
                example: Neue Strasse 2
              etage:
                type: string
                example: 3
              description:
                type: string
                example: Updated description
    responses:
      200:
        description: WG updated successfully
        content:
          application/json:
            example: {"message": "WG updated successfully"}
      400:
        description: Invalid input or missing required fields
      403:
        description: Not authorized
      404:
        description: WG not found
      409:
        description: WG with same title or address/etage already exists
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    # Only creator or admin can update
    if g.current_user not in wg.admins and g.current_user != wg.creator:
        return jsonify({'message': 'Not authorized'}), 403

    data = request.get_json()
    title = data.get('title')
    address = data.get('address')
    etage = data.get('etage')
    description = data.get('description')
    is_public = data.get('is_public')

    # Check for unique constraints if title or address/etage are being changed
    if title and title != wg.title:
        if WG.query.filter_by(title=title).first():
            return jsonify({'message': 'Title already exists'}), 409
        wg.title = title
    if address and etage and (address != wg.address or etage != wg.etage):
        if WG.query.filter_by(address=address, etage=etage).first():
            return jsonify({'message': 'WG with this address and etage already exists'}), 409
        wg.address = address
        wg.etage = etage

    if description is not None:
        wg.description = description

    if is_public is not None:
            wg.is_public = is_public

    db.session.commit()
    return jsonify({'message': 'WG updated successfully'}), 200


@wg_bp.route('/wg/<string:wg_id>/transfer_creator', methods=['POST'])
@token_required
def transfer_creator(wg_id):
    """
    Transfer creator status of a WG to another user by username
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: WG ID
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
                example: 'new_creator_user'
    responses:
      200:
        description: Creator status transferred successfully
        content:
          application/json:
            example: {"message": "Creator status transferred successfully"}
      400:
        description: Missing username or username is current creator
      403:
        description: Not authorized
      404:
        description: WG or new user not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404

    if g.current_user != wg.creator:
        return jsonify({'message': 'Not authorized to transfer creator status'}), 403

    data = request.get_json()
    new_creator_username = data.get('username')

    if not new_creator_username:
        return jsonify({'message': 'Missing username in request'}), 400

    new_creator = User.query.filter_by(strUser=new_creator_username).first()
    if not new_creator:
        return jsonify({'message': 'New creator user not found'}), 404

    if new_creator == g.current_user:
        return jsonify({'message': 'Cannot transfer creator status to yourself'}), 400

    if new_creator not in wg.users:
        return jsonify({'message': 'New creator must be a member of the shared apartment'}), 400

    # The current creator remains as an admin.
    if g.current_user not in wg.admins:
      wg.admins.append(g.current_user)

    # Transfer creator status
    wg.creator = new_creator
    if new_creator not in wg.admins:
      wg.admins.append(new_creator)

    db.session.commit()

    return jsonify({'message': 'Creator status transferred successfully'}), 200

@wg_bp.route('/wg/<string:wg_id>/tasklists', methods=['GET'])
@token_required
def get_tasklists_for_wg(wg_id):
    """
    Get all task lists for a specific WG.
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - name: wg_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: List of task lists retrieved successfully
      403:
        description: Not authorized
      404:
        description: WG not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404

    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    tasklists = [{'id': tl.idTaskList,
                  'title': tl.title,
                  'is_checked': tl.is_checked,
                  'date': tl.date,
                  'users': [{'id': u.idUser, 'name': u.strUser} for u in tl.users]
                  } for tl in wg.tasklists]
    return jsonify({'tasklists': tasklists}), 200

@wg_bp.route('/wg/<string:wg_id>/shoppinglists', methods=['GET'])
@token_required
def get_shoppinglists_for_wg(wg_id):
    """
    Get all shopping lists for a specific WG.
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - name: wg_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: List of shopping lists retrieved successfully
      403:
        description: Not authorized
      404:
        description: WG not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404

    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    shoppinglists = [{'id': sl.idShoppingList,
                      'title': sl.title,
                      'description': sl.description,
                      'is_checked': sl.is_checked,
                      'date': sl.date,
                      'creator': {'id': sl.creator_id, 'name': sl.creator.strUser if sl.creator else None}
                     } for sl in wg.shoppinglists]
    return jsonify({'shoppinglists': shoppinglists}), 200


@wg_bp.route('/wg/<string:wg_id>/budgetplanning', methods=['GET'])
@token_required
def get_budgetplannings_for_wg(wg_id):
    """
    Get all budget plannings for a specific WG.
    ---
    tags:
      - WG
    security:
      - BearerAuth: []
    parameters:
      - name: wg_id
        in: path
        required: true
        schema:
          type: integer
    responses:
      200:
        description: List of budget plannings retrieved successfully
      403:
        description: Not authorized
      404:
        description: WG not found
    """
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404

    if not is_user_of_wg(g.current_user, wg_id):
        return jsonify({'message': 'Not authorized'}), 403

    # Assuming a relationship 'budgetplannings' exists on the WG model
    budgetplannings = [{
        'id': bp.idBudgetPlanning,
        'title': bp.title,
        'description': bp.description,
        'goal': bp.goal,
        'deadline': bp.deadline,
        'created_date': bp.created_date,
        'creator': {'id': bp.creator_id, 'name': bp.creator.strUser if bp.creator else None}
    } for bp in wg.budgetplannings]
    return jsonify({'budgetplannings': budgetplannings}), 200
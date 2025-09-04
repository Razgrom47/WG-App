from flask import Blueprint, request, jsonify, g
from extensions import db
from models import WG, User
from decorators import token_required

wg_bp = Blueprint('wg_bp', __name__)

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
    return jsonify({'id': new_wg.idWG}), 201

@wg_bp.route('/wg/<int:wg_id>', methods=['DELETE'])
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

@wg_bp.route('/wg/<int:wg_id>/invite', methods=['POST'])
@token_required
def invite_user(wg_id):
    """
    Invite a user to WG
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
    if g.current_user not in wg.admins:
        return jsonify({'message': 'Not authorized'}), 403
    data = request.get_json()
    user_id = data.get('user_id')
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
    if user in wg.users:
        return jsonify({'message': 'User already in WG'}), 409
    wg.users.append(user)
    db.session.commit()
    return jsonify({'message': 'User invited successfully'}), 200

@wg_bp.route('/wg/<int:wg_id>/kick', methods=['POST'])
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
    if g.current_user not in wg.admins:
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

@wg_bp.route('/wg/<int:wg_id>/make_admin', methods=['POST'])
@token_required
def make_user_admin(wg_id):
    """
    Make a WG user an admin
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
        description: User made admin successfully
        content:
          application/json:
            example: {"message": "User made admin successfully"}
      403:
        description: Not authorized
      404:
        description: WG or user not found
      409:
        description: User already admin
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
        return jsonify({'message': 'User already admin'}), 409
    wg.admins.append(user)
    db.session.commit()
    return jsonify({'message': 'User made admin successfully'}), 200

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
        description: List of user WGs
        content:
          application/json:
            example: {"wg_ids": [1,2], "wg_titles": ["WG1", "WG2"]}
    """
    user = g.current_user
    wg_ids = [wg.idWG for wg in user.wgs]
    wg_titles = [wg.title for wg in user.wgs]
    return jsonify({'wg_ids': wg_ids, 'wg_titles':wg_titles}), 200

@wg_bp.route('/wg/<int:wg_id>', methods=['GET'])
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
    user = g.current_user
    wg = WG.query.get(wg_id)
    if not wg:
        return jsonify({'message': 'WG not found'}), 404
    if user not in wg.users and user != wg.creator:
        return jsonify({'message': 'Not authorized'}), 403
    wg_info = {
        'title': wg.title,
        'address': wg.address,
        'etage': wg.etage,
        'description': wg.description,
        'creator_id': wg.creator.strUser,
        'user_names': [u.strUser for u in wg.users if u not in wg.admins],
        'admin_names': [a.strUser for a in wg.admins if a != wg.creator]
    }
    return jsonify({'wg': wg_info}), 200

@wg_bp.route('/wg/<int:wg_id>', methods=['PUT'])
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

    db.session.commit()
    return jsonify({'message': 'WG updated successfully'}), 200
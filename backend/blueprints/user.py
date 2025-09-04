# blueprints/user.py
from flask import Blueprint, jsonify, request, current_app, g
from extensions import db
from decorators import token_required
from models import WG

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/user', methods=['GET'])
@token_required
def user():
    """
    Get the current user
    ---
    tags:
      - User
    security:
      - BearerAuth: []
    responses:
      200:
        description: Returns the current user
        examples:
          application/json: {"user": {"username": "testuser"}}
      404:
        description: User not found
    """
    user = g.current_user
    if user:
        return jsonify({'user': {'username': user.strUser}})
    return jsonify({'user': None}), 404

@user_bp.route('/user', methods=['PUT'])
@token_required
def update_user():
    """
    Update current user information
    ---
    tags:
      - User
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
                example: new_username
    responses:
      200:
        description: Successfully updated the user
        content:
          application/json:
            example: {"id": 1, "username": "new_username"}
      404:
        description: User not found
    """
    user = g.current_user
    if user:
        data = request.get_json()
        user.strUser = data.get('username', user.strUser)
        db.session.commit()
        return jsonify({'id': user.idUser, 'username': user.strUser})
    return jsonify({'user': None}), 404

@user_bp.route('/user', methods=['DELETE'])
@token_required
def delete_user():
    """
    Delete current user
    ---
    tags:
      - User
    security:
      - BearerAuth: []
    responses:
      204:
        description: User deleted successfully
      404:
        description: User not found
    """
    user = g.current_user
    if user:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 204
    return jsonify({'user': None}), 404

@user_bp.route('/user/join/<int:wg_id>', methods=['POST'])
@token_required
def join_wg(wg_id):
    """
    Join a WG (Wohngemeinschaft)
    ---
    tags:
      - User
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: The ID of the WG to join
    responses:
      200:
        description: User joined WG successfully
        content:
          application/json:
            example: {"message": "User joined WG successfully"}
      404:
        description: WG not found or user not available
    """
    user = g.current_user
    if user:
        wg = WG.query.get(wg_id)
        if wg:
            wg.users.append(user)
            db.session.commit()
            return jsonify({'message': 'User joined WG successfully'}), 200
        return jsonify({'message': 'WG not found'}), 404
    return jsonify({'user': None}), 404

@user_bp.route('/user/leave/<int:wg_id>', methods=['POST'])
@token_required
def leave_wg(wg_id):
    """
    Leave a WG (Wohngemeinschaft)
    ---
    tags:
      - User
    security:
      - BearerAuth: []
    parameters:
      - in: path
        name: wg_id
        required: true
        schema:
          type: integer
        description: The ID of the WG to leave
    responses:
      200:
        description: User left WG successfully
        content:
          application/json:
            example: {"message": "User left WG successfully"}
      404:
        description: User not in WG or WG not found
    """
    user = g.current_user
    if user:
        wg = WG.query.get(wg_id)
        if wg and user in wg.users:
            wg.users.remove(user)
            db.session.commit()
            return jsonify({'message': 'User left WG successfully'}), 200
        return jsonify({'message': 'User not in WG or WG not found'}), 404
    return jsonify({'user': None}), 404
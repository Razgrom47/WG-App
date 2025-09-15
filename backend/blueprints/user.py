# blueprints/user.py
from sqlite3 import IntegrityError
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
        return jsonify({'user': {'id':user.idUser, 'email':user.strEmail, 'username': user.strUser}})
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
              email:
                type: string
                example: new_email@example.com
    responses:
      200:
        description: Successfully updated the user
        content:
          application/json:
            example: {"id": 1, "username": "new_username", "email":"email@email.com"}
      400:
        description: Invalid request or duplicate values
      404:
        description: User not found
    """
    user = g.current_user
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid or missing JSON body"}), 400

    # Collect potential updates
    new_username = data.get("username")
    new_email = data.get("email")

    if not new_username and not new_email:
        return jsonify({"error": "No update fields provided"}), 400

    # Apply updates only if provided
    if new_username:
        user.strUser = new_username.strip()
    if new_email:
        user.strEmail = new_email.strip()

    try:
        db.session.commit()
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({"error": "Username or email already exists"}), 400

    return jsonify({
        "id": user.idUser,
        "username": user.strUser,
        "email": user.strEmail
    }), 200

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
      409:
        description: WG is not public or user is already a member
    """
    user = g.current_user
    if user:
        wg = WG.query.get(wg_id)
        if not wg:
            return jsonify({'message': 'WG not found'}), 404

        # Check if the user is already a member
        if user in wg.users:
            return jsonify({'message': 'User is already a member of this WG'}), 409

        # NEW: Check if the WG is public
        if not wg.is_public:
            return jsonify({'message': 'This WG is private and requires an invitation to join.'}), 409
        
        wg.users.append(user)
        db.session.commit()
        return jsonify({'message': 'User joined WG successfully'}), 200
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
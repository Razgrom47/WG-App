# blueprints/user.py
from datetime import datetime, timedelta
from sqlite3 import IntegrityError
from extensions import bcrypt
from flask import Blueprint, jsonify, request, current_app, g
import jwt
from extensions import db
from decorators import token_required
from models import WG, User

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
              new_password:
                type: string
                example: new_secret123
    responses:
      200:
        description: Successfully updated the user
        content:
          application/json:
            example: {
                "message": "Profile updated successfully",
                "user": {
                    "id": 1,
                    "username": "new_username",
                    "email": "new_email@example.com"
                },
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
      400:
        description: Invalid request or no data provided
        content:
          application/json:
            example: {"message": "No data provided for update"}
      404:
        description: User not found
        content:
          application/json:
            example: {"message": "User not found"}
      409:
        description: A user with the same username or email already exists
        content:
          application/json:
            example: {"message": "Username already exists"}
    """
    user = g.current_user
    if not user:
        return jsonify({'message': 'User not found'}), 404

    data = request.get_json()
    new_username = data.get('username')
    new_email = data.get('email')
    new_password = data.get('new_password') # NEW: Get new password

    if not new_username and not new_email and not new_password: # NEW: Check for new_password
        return jsonify({'message': 'No data provided for update'}), 400

    # Check for username and email uniqueness if they are being updated
    if new_username and new_username != user.strUser:
        if User.query.filter_by(strUser=new_username).first():
            return jsonify({'message': 'Username already exists'}), 409
        user.strUser = new_username
    
    if new_email and new_email != user.strEmail:
        if User.query.filter_by(strEmail=new_email).first():
            return jsonify({'message': 'Email already exists'}), 409
        user.strEmail = new_email

    # NEW: Handle password change
    if new_password:
        if len(new_password) < 8: # Add a simple check for password length
            return jsonify({'message': 'Password must be at least 8 characters long'}), 400
        user.strPassword = bcrypt.generate_password_hash(new_password).decode('utf-8')
    
    try:
        db.session.commit()
        # Create a new token with the updated user information
        token_payload = {
            'user_id': user.idUser,
            'username': user.strUser,
            'email': user.strEmail,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        new_token = jwt.encode(
            token_payload,
            current_app.config['SECRET_KEY'],
            algorithm='HS256'
        )
        # Return the new token and the updated user data
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {'id': user.idUser, 'email': user.strEmail, 'username': user.strUser},
            'token': new_token
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to update profile', 'error': str(e)}), 500



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
      403:
        description: Not authorized to leave or creator cannot leave
      404:
        description: WG or user not found
    """
    user = g.current_user
    if user:
        wg = WG.query.get(wg_id)
        if not wg:
            return jsonify({'message': 'WG not found'}), 404

        if user not in wg.users:
            return jsonify({'message': 'User is not in the WG'}), 403

        # Prevent creator from leaving
        if user == wg.creator:
            return jsonify({'message': 'Creator cannot leave the WG. Transfer creator status first.'}), 403

        # Remove user from the WG's user list
        wg.users.remove(user)

        # Remove user from the WG's admin list if they are an admin
        if user in wg.admins:
            wg.admins.remove(user)

        db.session.commit()
        return jsonify({'message': 'User left WG successfully'}), 200
    return jsonify({'user': None}), 404
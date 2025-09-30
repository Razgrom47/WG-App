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
        description: Returns the current user, including strHomePage
        examples:
          application/json: {"user": {"username": "testuser", "strHomePage": "/"}}
      404:
        description: User not found
    """
    user = g.current_user
    if user:
        return jsonify({'user': {'id':user.idUser, 'email':user.strEmail, 'username': user.strUser, 'strHomePage': user.strHomePage}})
    return jsonify({'user': None}), 404


@user_bp.route('/user', methods=['PUT'])
@token_required
def update_user():
    """
    Update current user information
    ---
    tags:\r\n      - User
    security:\r\n      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              username:
                type: string
              email:
                type: string
              new_password:
                type: string
              home_page_wg_id: # NEW field for setting home page
                type: string
                description: WG ID or '/' to set as home page
            
    responses:
      200:
        description: User updated successfully
      400:
        description: Invalid request data
    """
    data = request.get_json()
    user = g.current_user
    
    if not user:
        return jsonify({'message': 'User not found'}), 404

    # Update username if provided and different
    if 'username' in data and data['username'] != user.strUser:
        user.strUser = data['username']

    # Update email if provided and different
    if 'email' in data and data['email'] != user.strEmail:
        user.strEmail = data['email']

    # Handle new password
    if 'new_password' in data and data['new_password']:
        user.strPass = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')

    # NEW: Handle preferred home page update
    home_page_wg_id = data.get('home_page_wg_id')
    if home_page_wg_id is not None:
        if home_page_wg_id == '/':
            # Option 1: Explicitly set home page to root
            user.strHomePage = '/'
        else:
            # Option 2: Set home page to a WG
            # Check if the provided WG ID is one the user is currently in
            selected_wg = WG.query.get(home_page_wg_id)
            if selected_wg and user in selected_wg.users:
                user.strHomePage = f'/wg/{home_page_wg_id}'
            else:
                # Fallback if WG is not found or user is not a member
                user.strHomePage = '/'

    try:
        db.session.commit()
        # Return the updated user data including the new strHomePage
        return jsonify({'message': 'User updated successfully', 'user': {'id': user.idUser, 'email': user.strEmail, 'username': user.strUser, 'strHomePage': user.strHomePage}}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({'message': 'Email or username already in use'}), 400
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

@user_bp.route('/user/join/<string:wg_id>', methods=['POST'])
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
        user.strHomePage = f'/wg/{wg.idWG}'
        db.session.commit()
        return jsonify({'message': 'User joined WG successfully'}), 200
    return jsonify({'user': None}), 404


@user_bp.route('/user/leave_wg/<string:wg_id>', methods=['POST'])
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
          type: string
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

        # Remove user from the WG's admin list if they were an admin
        if user in wg.admins:
            wg.admins.remove(user)
        
        # NEW: If the user's home page was set to this WG, reset it to root
        if user.strHomePage == f'/wg/{wg_id}':
            user.strHomePage = '/'

        try:
            db.session.commit()
            return jsonify({'message': 'User left WG successfully'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': f'An error occurred: {str(e)}'}), 500
            
    return jsonify({'message': 'User not authenticated'}), 401
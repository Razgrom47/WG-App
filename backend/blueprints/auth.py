from flask import Blueprint, request, jsonify, current_app, session
from decorators import token_required
from models import User
from extensions import db, bcrypt
import jwt
from datetime import datetime, timedelta

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    ---
    tags:
      - Auth
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - username
              - password
            properties:
              username:
                type: string
                example: johndoe
              password:
                type: string
                example: secret123
    responses:
      200:
        description: Login successful, JWT returned
        content:
          application/json:
            example: {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."}
      401:
        description: Missing credentials
        content:
          application/json:
            example:
              message: "Missing credentials"
              WWW-Authenticate: 'Basic realm="Login required"'
      403:
        description: Invalid username or password
        content:
          application/json:
            example:
              message: "Unable to verify"
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing credentials', 
                        'WWW-Authenticate': 'Basic realm="Login required"'}), 401

    user = User.query.filter_by(strUser=data['username']).first()
    if not user or not bcrypt.check_password_hash(user.strPassword, data['password']):
    # if not user or not user.strPassword == data['password']:
        return jsonify({'message': 'Unable to verify'}), 403

    token = jwt.encode({
        'user': user.strUser,
        'exp': datetime.utcnow() + timedelta(minutes=10)
    }, current_app.config['SECRET_KEY'], algorithm="HS256")
    
    # (Optional) Set session variables if needed
    session['logged_in'] = True
    session['userID'] = user.idUser
    session['username'] = user.strUser

    return jsonify({'token': token})

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    User registration
    ---
    tags:
      - Auth
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - username
              - password
            properties:
              username:
                type: string
                example: johndoe
              password:
                type: string
                example: secret123
    responses:
      201:
        description: User registered successfully
        content:
          application/json:
            example: {"message": "User registered successfully"}
      400:
        description: Missing credentials
        content:
          application/json:
            example: {"message": "Missing credentials"}
      409:
        description: User already exists
        content:
          application/json:
            example: {"message": "User already exists"}
    """
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Missing credentials'}), 400

    existing_user = User.query.filter_by(strUser=data['username']).first()
    if existing_user:
        return jsonify({'message': 'User already exists'}), 409

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(strUser=data['username'], strPassword=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """
    User logout
    ---
    tags:
      - Auth
    security:
      - BearerAuth: []
    responses:
      200:
        description: Logout successful
        content:
          application/json:
            example: {"message": "Logout successful"}
    """
    # Logic to handle logout (e.g., invalidate token)
    return jsonify({'message': 'Logout successful'}), 200
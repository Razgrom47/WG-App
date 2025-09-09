from sqlite3 import IntegrityError
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
    User login (username or email)
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
              - identifier
              - password
            properties:
              identifier:
                type: string
                example: johndoe or johndoe@email.com
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
        description: Invalid credentials
        content:
          application/json:
            example:
              message: "Unable to verify"
    """
    data = request.get_json()
    if not data or not data.get("identifier") or not data.get("password"):
        return jsonify({
            "message": "Missing credentials",
            "WWW-Authenticate": 'Basic realm="Login required"'
        }), 401

    identifier = data["identifier"].strip()
    password = data["password"]

    # Try to match either username or email
    user = User.query.filter(
        (User.strUser == identifier) | (User.strEmail == identifier)
    ).first()

    if not user or not bcrypt.check_password_hash(user.strPassword, password):
        return jsonify({"message": "Unable to verify"}), 403

    token = jwt.encode({
        "user_id": user.idUser,
        "username": user.strUser,
        "email": user.strEmail,
        "exp": datetime.utcnow() + timedelta(minutes=10)
    }, current_app.config["SECRET_KEY"], algorithm="HS256")

    session["logged_in"] = True
    session["userID"] = user.idUser
    session["username"] = user.strUser

    return jsonify({"token": token}), 200


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
              - email
              - password
            properties:
              username:
                type: string
                example: johndoe
              email:
                type: string
                example: johndoe@email.com
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
        description: Username or email already exists
        content:
          application/json:
            example: {"message": "Username or email already exists"}
    """
    data = request.get_json()
    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Missing credentials"}), 400

    username = data["username"].strip()
    email = data["email"].strip().lower()
    password = data["password"]

    # Check duplicates explicitly
    if User.query.filter_by(strUser=username).first():
        return jsonify({"message": "Username already exists"}), 409
    if User.query.filter_by(strEmail=email).first():
        return jsonify({"message": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    new_user = User(
        strUser=username,
        strEmail=email,
        strPassword=hashed_password
    )

    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Username or email already exists"}), 409

    return jsonify({"message": "User registered successfully"}), 201


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
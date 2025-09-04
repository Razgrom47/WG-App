# decorators.py
from functools import wraps
from flask import request, jsonify, current_app, g
import jwt
from models import User  # ensure you import your User model

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header:
            parts = auth_header.split()
            token = parts[1] if len(parts) == 2 else parts[0]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 403
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            user = User.query.filter_by(strUser=data.get("user")).first()
            if not user:
                return jsonify({'message': 'User not found!'}), 404
            # Save the authenticated user to g
            g.current_user = user
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 403
        return f(*args, **kwargs)
    return decorated
from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
import datetime
from bson import ObjectId
from bson.json_util import dumps
import json
import db
import logging
from functools import wraps

auth_bp = Blueprint('auth', __name__)

# Configuration
SECRET_KEY = 'your-secret-key-here'  # In production, use environment variable
TOKEN_EXPIRY = 24 * 60 * 60  # 24 hours in seconds
DB_NAME = "airbnb"
USERS_COLLECTION = "users"


# Helper functions
def generate_token(user_id):
    """Generate a JWT token for the given user ID"""
    payload = {
        'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=TOKEN_EXPIRY),
        'iat': datetime.datetime.utcnow(),
        'sub': str(user_id)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


def token_required(f):
    """Decorator to ensure a valid token is provided with the request"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            user_id = payload['sub']

            # Fetch the user from database to verify they exist
            user = db.get_user_by_id(DB_NAME, USERS_COLLECTION, user_id)
            if not user:
                return jsonify({'message': 'Invalid token. User not found'}), 401

            # Add user to request context
            request.user = user

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Register a new user"""
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Check if email already exists
    existing_user = db.get_user_by_email(DB_NAME, USERS_COLLECTION, data['email'])
    if existing_user:
        return jsonify({'message': 'Email already registered'}), 409

    # Hash the password
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

    # Create user document
    user = {
        'name': data['name'],
        'email': data['email'],
        'password': hashed_password.decode('utf-8'),  # Store as string for MongoDB
        'role': 'user',  # Default role
        'joinDate': datetime.datetime.utcnow().isoformat(),
        'profileImage': data.get('profileImage', ''),
        'phone': data.get('phone', ''),
        'bio': data.get('bio', ''),
        'isHost': False,
        'savedListings': [],
        'notificationPreferences': [
            {'id': 1, 'title': 'Email Notifications',
             'description': 'Receive booking confirmations and updates via email', 'enabled': True},
            {'id': 2, 'title': 'SMS Notifications', 'description': 'Receive text messages for important updates',
             'enabled': False},
            {'id': 3, 'title': 'Marketing Emails', 'description': 'Receive deals, discounts, and travel inspiration',
             'enabled': True},
            {'id': 4, 'title': 'Reminder Notifications',
             'description': 'Get reminders about upcoming trips or hosting duties', 'enabled': True}
        ]
    }

    # Insert user document
    user_id = db.insert_one_into_collection(DB_NAME, USERS_COLLECTION, user)

    if not user_id:
        return jsonify({'message': 'Failed to create user'}), 500

    # Generate token
    token = generate_token(user_id)

    # Remove password from response
    user.pop('password', None)

    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user': {
            'id': user_id,
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate a user and return a token"""
    data = request.get_json()

    # Validate required fields
    required_fields = ['email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Find user by email
    user = db.get_user_by_email(DB_NAME, USERS_COLLECTION, data['email'])
    if not user:
        return jsonify({'message': 'Invalid email or password'}), 401

    # Verify password
    if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'message': 'Invalid email or password'}), 401

    # Generate token
    token = generate_token(str(user['_id']))

    # Remove password from response
    user.pop('password', None)

    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200


@auth_bp.route('/user', methods=['GET'])
@token_required
def get_user():
    """Get the current user's profile"""
    user = request.user
    user_copy = dict(user)  # Create a copy to avoid modifying the original

    # Convert ObjectId to string and remove password
    user_copy['id'] = str(user_copy['_id'])
    del user_copy['_id']
    user_copy.pop('password', None)

    return jsonify(user_copy), 200


@auth_bp.route('/change-password', methods=['PUT'])
@token_required
def change_password():
    """Change user's password"""
    data = request.get_json()

    # Validate required fields
    required_fields = ['currentPassword', 'newPassword']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    user = request.user

    # Verify current password
    if not bcrypt.checkpw(data['currentPassword'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'message': 'Current password is incorrect'}), 401

    # Hash the new password
    hashed_password = bcrypt.hashpw(data['newPassword'].encode('utf-8'), bcrypt.gensalt())

    # Update password in database
    result = db.update_user_password(DB_NAME, USERS_COLLECTION, str(user['_id']), hashed_password.decode('utf-8'))

    if not result:
        return jsonify({'message': 'Failed to update password'}), 500

    return jsonify({'message': 'Password updated successfully'}), 200


@auth_bp.route('/delete-account', methods=['POST'])
@token_required
def request_account_deletion():
    """Request account deletion"""
    user = request.user

    # In a real app, you might want to implement a more complex flow for account deletion
    # such as sending a confirmation email before actual deletion

    # For now, we'll just mark the account for deletion
    result = db.mark_user_for_deletion(DB_NAME, USERS_COLLECTION, str(user['_id']))

    if not result:
        return jsonify({'message': 'Failed to process deletion request'}), 500

    return jsonify(
        {'message': 'Account deletion request processed. You will receive an email with further instructions.'}), 200
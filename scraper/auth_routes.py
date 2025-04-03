from flask import Blueprint, request, jsonify, current_app, make_response
import bcrypt
import jwt
import datetime
from bson import ObjectId
from bson.json_util import dumps
import json
import logging
from functools import wraps
import db  # Import the db module with our fixed functions

auth_bp = Blueprint('auth', __name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

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


@auth_bp.route('/signup', methods=['POST', 'OPTIONS'])
def signup():
    """Register a new user - NO AUTHENTICATION REQUIRED"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return handle_preflight()

    logger.info("Signup request received")
    logger.debug(f"Headers: {dict(request.headers)}")

    try:
        # Check if Content-Type is application/json and get data
        if not request.is_json:
            logger.warning(f"Request is not JSON. Content-Type: {request.headers.get('Content-Type')}")
            try:
                data = request.get_json(force=True)
                logger.debug(f"Forced JSON parsing: {data}")
            except Exception as e:
                logger.error(f"Error parsing JSON: {str(e)}")
                return jsonify({'message': 'Invalid JSON data'}), 400
        else:
            data = request.get_json()

        logger.info(f"Received signup data for: {data.get('email', 'unknown')}")
        logger.debug(f"Full data: {data}")

        # Validate required fields
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if field not in data:
                logger.warning(f"Missing required field: {field}")
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Check if email already exists
        existing_user = db.get_user_by_email(DB_NAME, USERS_COLLECTION, data['email'])
        if existing_user:
            logger.warning(f"Email already registered: {data['email']}")
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
                {'id': 3, 'title': 'Marketing Emails',
                 'description': 'Receive deals, discounts, and travel inspiration',
                 'enabled': True},
                {'id': 4, 'title': 'Reminder Notifications',
                 'description': 'Get reminders about upcoming trips or hosting duties', 'enabled': True}
            ]
        }

        logger.info(f"Attempting to insert user: {user['name']}, {user['email']}")

        # Insert user document
        user_id = db.insert_one_into_collection(DB_NAME, USERS_COLLECTION, user)

        if not user_id:
            logger.error("Failed to create user in database")
            return jsonify({'message': 'Failed to create user in database'}), 500

        logger.info(f"User created successfully with ID: {user_id}")

        # Generate token
        token = generate_token(user_id)

        # Remove password from response
        user.pop('password', None)

        # Create response
        response_data = {
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'id': user_id,
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }

        # Create response with CORS headers
        response = make_response(jsonify(response_data), 201)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error in signup route: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """Authenticate a user and return a token - NO AUTHENTICATION REQUIRED"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return handle_preflight()

    logger.info("Login request received")

    try:
        data = request.get_json()
        logger.debug(f"Login attempt for email: {data.get('email', 'unknown')}")

        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                logger.warning(f"Missing required field: {field}")
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Find user by email
        user = db.get_user_by_email(DB_NAME, USERS_COLLECTION, data['email'])
        if not user:
            logger.warning(f"Invalid login attempt: user not found for {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401

        # Verify password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
            logger.warning(f"Invalid login attempt: incorrect password for {data['email']}")
            return jsonify({'message': 'Invalid email or password'}), 401

        logger.info(f"Successful login for {data['email']}")

        # Generate token
        token = generate_token(str(user['_id']))

        # Remove password from response
        user.pop('password', None)

        # Create response
        response_data = {
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': str(user['_id']),
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }

        # Create response with CORS headers
        response = make_response(jsonify(response_data), 200)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error in login route: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/user', methods=['GET', 'OPTIONS'])
@token_required  # This route DOES require authentication
def get_user():
    """Get the current user's profile"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        user = request.user
        user_copy = dict(user)  # Create a copy to avoid modifying the original

        # Convert ObjectId to string and remove password
        user_copy['id'] = str(user_copy['_id'])
        del user_copy['_id']
        user_copy.pop('password', None)

        logger.info(f"User profile retrieved for {user_copy['email']}")

        # Create response with CORS headers
        response = make_response(jsonify(user_copy), 200)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error in get_user route: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/change-password', methods=['PUT', 'OPTIONS'])
@token_required  # This route DOES require authentication
def change_password():
    """Change user's password"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        data = request.get_json()
        user = request.user
        logger.info(f"Password change attempt for {user['email']}")

        # Validate required fields
        required_fields = ['currentPassword', 'newPassword']
        for field in required_fields:
            if field not in data:
                logger.warning(f"Missing required field: {field}")
                return jsonify({'message': f'Missing required field: {field}'}), 400

        # Verify current password
        if not bcrypt.checkpw(data['currentPassword'].encode('utf-8'), user['password'].encode('utf-8')):
            logger.warning(f"Incorrect current password for {user['email']}")
            return jsonify({'message': 'Current password is incorrect'}), 401

        # Hash the new password
        hashed_password = bcrypt.hashpw(data['newPassword'].encode('utf-8'), bcrypt.gensalt())

        # Update password in database
        result = db.update_user_password(DB_NAME, USERS_COLLECTION, str(user['_id']), hashed_password.decode('utf-8'))

        if not result:
            logger.error(f"Failed to update password for {user['email']}")
            return jsonify({'message': 'Failed to update password'}), 500

        logger.info(f"Password updated successfully for {user['email']}")

        # Create response with CORS headers
        response = make_response(jsonify({'message': 'Password updated successfully'}), 200)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error in change_password route: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500


@auth_bp.route('/delete-account', methods=['POST', 'OPTIONS'])
@token_required  # This route DOES require authentication
def request_account_deletion():
    """Request account deletion"""
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        return handle_preflight()

    try:
        user = request.user
        logger.info(f"Account deletion request for {user['email']}")

        # In a real app, you might want to implement a more complex flow for account deletion
        # such as sending a confirmation email before actual deletion

        # For now, we'll just mark the account for deletion
        result = db.mark_user_for_deletion(DB_NAME, USERS_COLLECTION, str(user['_id']))

        if not result:
            logger.error(f"Failed to process deletion request for {user['email']}")
            return jsonify({'message': 'Failed to process deletion request'}), 500

        logger.info(f"Account deletion process initiated for {user['email']}")

        # Create response with CORS headers
        response = make_response(
            jsonify({
                        'message': 'Account deletion request processed. You will receive an email with further instructions.'}),
            200
        )
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', '*'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response

    except Exception as e:
        logger.error(f"Error in request_account_deletion route: {str(e)}")
        return jsonify({'message': f'Server error: {str(e)}'}), 500


def handle_preflight():
    """Handle OPTIONS preflight requests with proper CORS headers"""
    logger.debug("Handling preflight request")
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response
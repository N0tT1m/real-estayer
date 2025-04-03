from flask import Blueprint, request, jsonify
from bson import ObjectId
from auth_routes import token_required
from bson.json_util import dumps
import json
import db
import logging

user_bp = Blueprint('user', __name__)

# Constants
DB_NAME = "airbnb"
USERS_COLLECTION = "users"
LISTINGS_COLLECTION = "listings"
TRIPS_COLLECTION = "trips"
PAYMENT_METHODS_COLLECTION = "payment_methods"


@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """Get the current user's profile"""
    user = request.user
    user.pop('password', None)  # Remove password from response

    return jsonify(json.loads(dumps(user))), 200


@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """Update the current user's profile"""
    data = request.get_json()
    user = request.user

    # Fields that can be updated
    updatable_fields = ['name', 'phone', 'profileImage', 'bio']

    # Create update data with only allowed fields
    update_data = {}
    for field in updatable_fields:
        if field in data:
            update_data[field] = data[field]

    # Don't allow updating email through this endpoint (should have separate email change flow)
    if not update_data:
        return jsonify({'message': 'No valid fields to update'}), 400

    # Update user in database
    result = db.update_user(DB_NAME, USERS_COLLECTION, str(user['_id']), update_data)

    if not result:
        return jsonify({'message': 'Failed to update profile'}), 500

    # Get updated user
    updated_user = db.get_user_by_id(DB_NAME, USERS_COLLECTION, str(user['_id']))
    updated_user.pop('password', None)  # Remove password from response

    return jsonify({
        'message': 'Profile updated successfully',
        'user': json.loads(dumps(updated_user))
    }), 200


@user_bp.route('/saved-listings', methods=['GET'])
@token_required
def get_saved_listings():
    """Get user's saved listings"""
    user = request.user

    # Get saved listing IDs from user document
    saved_listing_ids = user.get('savedListings', [])

    # Get actual listings
    saved_listings = db.get_listings_by_ids(DB_NAME, LISTINGS_COLLECTION, saved_listing_ids)

    return jsonify(saved_listings), 200


@user_bp.route('/saved-listings/<listing_id>', methods=['POST'])
@token_required
def save_listing(listing_id):
    """Save a listing to user's favorites"""
    user = request.user

    # Check if listing exists
    listing = db.get_listing_by_id(DB_NAME, LISTINGS_COLLECTION, listing_id)
    if not listing:
        return jsonify({'message': 'Listing not found'}), 404

    # Add listing to saved listings if not already saved
    result = db.add_saved_listing(DB_NAME, USERS_COLLECTION, str(user['_id']), listing_id)

    if not result:
        return jsonify({'message': 'Failed to save listing'}), 500

    return jsonify({'message': 'Listing saved successfully'}), 200


@user_bp.route('/saved-listings/<listing_id>', methods=['DELETE'])
@token_required
def remove_saved_listing(listing_id):
    """Remove a listing from user's favorites"""
    user = request.user

    # Remove listing from saved listings
    result = db.remove_saved_listing(DB_NAME, USERS_COLLECTION, str(user['_id']), listing_id)

    if not result:
        return jsonify({'message': 'Failed to remove listing'}), 500

    return jsonify({'message': 'Listing removed successfully'}), 200


@user_bp.route('/trips', methods=['GET'])
@token_required
def get_trips():
    """Get user's trips"""
    user = request.user

    # Filter status if provided
    status = request.args.get('status')

    # Get trips from database
    trips = db.get_user_trips(DB_NAME, TRIPS_COLLECTION, str(user['_id']), status)

    return jsonify(trips), 200


@user_bp.route('/payment-methods', methods=['GET'])
@token_required
def get_payment_methods():
    """Get user's payment methods"""
    user = request.user

    # Get payment methods from database
    payment_methods = db.get_user_payment_methods(DB_NAME, PAYMENT_METHODS_COLLECTION, str(user['_id']))

    return jsonify(payment_methods), 200


@user_bp.route('/payment-methods', methods=['POST'])
@token_required
def add_payment_method():
    """Add a new payment method"""
    user = request.user
    data = request.get_json()

    # Validate required fields
    required_fields = ['type', 'cardNumber', 'expMonth', 'expYear']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # In a real app, you would validate the card details and process it through a payment gateway
    # Here we'll just store the last 4 digits for privacy and security

    # Check if this is the first payment method (to set as default)
    existing_methods = db.get_user_payment_methods(DB_NAME, PAYMENT_METHODS_COLLECTION, str(user['_id']))
    is_default = len(existing_methods) == 0

    # Create payment method document
    payment_method = {
        'userId': str(user['_id']),
        'type': data['type'],
        'last4': data['cardNumber'][-4:],  # Only store last 4 digits
        'expMonth': data['expMonth'],
        'expYear': data['expYear'],
        'isDefault': is_default,
        'createdAt': datetime.datetime.utcnow()
    }

    # Insert payment method
    payment_method_id = db.insert_one_into_collection(DB_NAME, PAYMENT_METHODS_COLLECTION, payment_method)

    if not payment_method_id:
        return jsonify({'message': 'Failed to add payment method'}), 500

    payment_method['id'] = payment_method_id

    return jsonify({
        'message': 'Payment method added successfully',
        'paymentMethod': payment_method
    }), 201


@user_bp.route('/payment-methods/<payment_method_id>/default', methods=['PUT'])
@token_required
def set_default_payment_method(payment_method_id):
    """Set a payment method as default"""
    user = request.user

    # Update payment method as default
    result = db.set_default_payment_method(DB_NAME, PAYMENT_METHODS_COLLECTION, str(user['_id']), payment_method_id)

    if not result:
        return jsonify({'message': 'Failed to set default payment method'}), 500

    return jsonify({'message': 'Default payment method updated successfully'}), 200


@user_bp.route('/payment-methods/<payment_method_id>', methods=['DELETE'])
@token_required
def remove_payment_method(payment_method_id):
    """Remove a payment method"""
    user = request.user

    # Check if payment method exists and belongs to user
    payment_method = db.get_payment_method_by_id(DB_NAME, PAYMENT_METHODS_COLLECTION, payment_method_id)

    if not payment_method or payment_method.get('userId') != str(user['_id']):
        return jsonify({'message': 'Payment method not found'}), 404

    # Check if trying to remove default payment method
    if payment_method.get('isDefault'):
        # Check if user has other payment methods
        other_methods = db.get_user_payment_methods(DB_NAME, PAYMENT_METHODS_COLLECTION, str(user['_id']))
        if len(other_methods) > 1:
            return jsonify(
                {'message': 'Cannot remove default payment method. Please set another method as default first.'}), 400

    # Remove payment method
    result = db.remove_payment_method(DB_NAME, PAYMENT_METHODS_COLLECTION, payment_method_id)

    if not result:
        return jsonify({'message': 'Failed to remove payment method'}), 500

    return jsonify({'message': 'Payment method removed successfully'}), 200


@user_bp.route('/notification-preferences', methods=['GET'])
@token_required
def get_notification_preferences():
    """Get user's notification preferences"""
    user = request.user

    # Get notification preferences from user document
    notification_preferences = user.get('notificationPreferences', [])

    return jsonify(notification_preferences), 200


@user_bp.route('/notification-preferences', methods=['PUT'])
@token_required
def update_notification_preferences():
    """Update user's notification preferences"""
    user = request.user
    data = request.get_json()

    if not isinstance(data, list):
        return jsonify({'message': 'Invalid data format. Expected array of notification preferences.'}), 400

    # Update notification preferences
    result = db.update_notification_preferences(DB_NAME, USERS_COLLECTION, str(user['_id']), data)

    if not result:
        return jsonify({'message': 'Failed to update notification preferences'}), 500

    return jsonify({
        'message': 'Notification preferences updated successfully',
        'preferences': data
    }), 200
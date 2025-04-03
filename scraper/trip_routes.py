from flask import Blueprint, request, jsonify
from bson import ObjectId
from functools import wraps
import jwt
import db
import logging
import datetime
import json
from bson.json_util import dumps

trip_bp = Blueprint('trip', __name__)

# Constants
DB_NAME = "airbnb"
TRIPS_COLLECTION = "trips"
LISTINGS_COLLECTION = "listings"
USERS_COLLECTION = "users"
ITINERARIES_COLLECTION = "itineraries"


# Token validation decorator (copied from auth_routes to avoid circular imports)
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Replace with your actual secret key
            SECRET_KEY = 'your-secret-key-here'
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


@trip_bp.route('/trips', methods=['GET'])
@token_required
def get_user_trips():
    """Get all trips for the current user"""
    user = request.user
    status = request.args.get('status')  # Filter by status if provided

    trips = db.get_user_trips(DB_NAME, TRIPS_COLLECTION, str(user['_id']), status)

    return jsonify(trips), 200


@trip_bp.route('/trips/<trip_id>', methods=['GET'])
@token_required
def get_trip(trip_id):
    """Get details of a specific trip"""
    user = request.user

    trip = db.get_trip_by_id(DB_NAME, TRIPS_COLLECTION, trip_id)

    if not trip:
        return jsonify({'message': 'Trip not found'}), 404

    # Ensure trip belongs to the current user
    if trip.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to trip'}), 403

    return jsonify(trip), 200


@trip_bp.route('/trips', methods=['POST'])
@token_required
def create_trip():
    """Create a new trip booking"""
    user = request.user
    data = request.get_json()

    # Validate required fields
    required_fields = ['listingId', 'checkIn', 'checkOut', 'guests', 'totalPrice']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Check if listing exists
    listing = db.get_listing_by_id(DB_NAME, LISTINGS_COLLECTION, data['listingId'])
    if not listing:
        return jsonify({'message': 'Listing not found'}), 404

    # Create trip document
    trip = {
        'userId': str(user['_id']),
        'listingId': data['listingId'],
        'listingTitle': listing.get('title', ''),
        'listingImage': listing.get('picture_url', ''),
        'location': listing.get('location', ''),
        'checkIn': data['checkIn'],
        'checkOut': data['checkOut'],
        'guests': data['guests'],
        'totalPrice': data['totalPrice'],
        'status': 'upcoming',  # Initial status
        'bookedAt': datetime.datetime.utcnow().isoformat(),
        'paymentMethodId': data.get('paymentMethodId'),
        'specialRequests': data.get('specialRequests', '')
    }

    # Insert trip document
    trip_id = db.insert_one_into_collection(DB_NAME, TRIPS_COLLECTION, trip)

    if not trip_id:
        return jsonify({'message': 'Failed to create trip'}), 500

    trip['id'] = trip_id

    return jsonify({
        'message': 'Trip booked successfully',
        'trip': trip
    }), 201


@trip_bp.route('/trips/<trip_id>/cancel', methods=['PUT'])
@token_required
def cancel_trip(trip_id):
    """Cancel a trip"""
    user = request.user

    # Get trip
    trip = db.get_trip_by_id(DB_NAME, TRIPS_COLLECTION, trip_id)

    if not trip:
        return jsonify({'message': 'Trip not found'}), 404

    # Ensure trip belongs to the current user
    if trip.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to trip'}), 403

    # Ensure trip is not already cancelled
    if trip.get('status') == 'cancelled':
        return jsonify({'message': 'Trip is already cancelled'}), 400

    # Ensure trip is not completed
    if trip.get('status') == 'completed':
        return jsonify({'message': 'Cannot cancel a completed trip'}), 400

    # Update trip status
    result = db.update_trip_status(DB_NAME, TRIPS_COLLECTION, trip_id, 'cancelled')

    if not result:
        return jsonify({'message': 'Failed to cancel trip'}), 500

    return jsonify({'message': 'Trip cancelled successfully'}), 200


@trip_bp.route('/itineraries', methods=['GET'])
@token_required
def get_user_itineraries():
    """Get all travel itineraries for the current user"""
    user = request.user

    itineraries = db.get_user_itineraries(DB_NAME, ITINERARIES_COLLECTION, str(user['_id']))

    return jsonify(itineraries), 200


@trip_bp.route('/itineraries/<itinerary_id>', methods=['GET'])
@token_required
def get_itinerary(itinerary_id):
    """Get details of a specific travel itinerary"""
    user = request.user

    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    return jsonify(itinerary), 200


@trip_bp.route('/itineraries', methods=['POST'])
@token_required
def create_itinerary():
    """Create a new travel itinerary"""
    user = request.user
    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'destination', 'startDate', 'endDate']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Create itinerary document
    itinerary = {
        'userId': str(user['_id']),
        'name': data['name'],
        'destination': data['destination'],
        'startDate': data['startDate'],
        'endDate': data['endDate'],
        'activities': data.get('activities', []),
        'accommodations': data.get('accommodations', []),
        'transportation': data.get('transportation', []),
        'totalBudget': data.get('totalBudget', 0),
        'notes': data.get('notes', ''),
        'createdAt': datetime.datetime.utcnow().isoformat(),
        'updatedAt': datetime.datetime.utcnow().isoformat()
    }

    # Insert itinerary document
    itinerary_id = db.insert_one_into_collection(DB_NAME, ITINERARIES_COLLECTION, itinerary)

    if not itinerary_id:
        return jsonify({'message': 'Failed to create itinerary'}), 500

    itinerary['id'] = itinerary_id

    return jsonify({
        'message': 'Itinerary created successfully',
        'itinerary': itinerary
    }), 201


@trip_bp.route('/itineraries/<itinerary_id>', methods=['PUT'])
@token_required
def update_itinerary(itinerary_id):
    """Update a travel itinerary"""
    user = request.user
    data = request.get_json()

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Fields that can be updated
    updatable_fields = ['name', 'destination', 'startDate', 'endDate', 'activities',
                        'accommodations', 'transportation', 'totalBudget', 'notes']

    # Create update data with only allowed fields
    update_data = {}
    for field in updatable_fields:
        if field in data:
            update_data[field] = data[field]

    # Add updatedAt timestamp
    update_data['updatedAt'] = datetime.datetime.utcnow().isoformat()

    if not update_data:
        return jsonify({'message': 'No valid fields to update'}), 400

    # Update itinerary in database
    result = db.update_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, update_data)

    if not result:
        return jsonify({'message': 'Failed to update itinerary'}), 500

    # Get updated itinerary
    updated_itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    return jsonify({
        'message': 'Itinerary updated successfully',
        'itinerary': updated_itinerary
    }), 200


@trip_bp.route('/itineraries/<itinerary_id>', methods=['DELETE'])
@token_required
def delete_itinerary(itinerary_id):
    """Delete a travel itinerary"""
    user = request.user

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Delete itinerary
    result = db.delete_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not result:
        return jsonify({'message': 'Failed to delete itinerary'}), 500

    return jsonify({'message': 'Itinerary deleted successfully'}), 200


@trip_bp.route('/itineraries/<itinerary_id>/activities', methods=['POST'])
@token_required
def add_activity(itinerary_id):
    """Add an activity to an itinerary"""
    user = request.user
    data = request.get_json()

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Validate required fields
    required_fields = ['name', 'date']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Create activity with ID
    activity = {
        'id': str(ObjectId()),  # Generate a new ID
        'name': data['name'],
        'date': data['date'],
        'time': data.get('time', ''),
        'location': data.get('location', ''),
        'cost': data.get('cost', 0),
        'notes': data.get('notes', ''),
        'booked': data.get('booked', False)
    }

    # Add activity to itinerary
    result = db.add_activity_to_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, activity)

    if not result:
        return jsonify({'message': 'Failed to add activity'}), 500

    return jsonify({
        'message': 'Activity added successfully',
        'activity': activity
    }), 201


@trip_bp.route('/itineraries/<itinerary_id>/activities/<activity_id>', methods=['PUT'])
@token_required
def update_activity(itinerary_id, activity_id):
    """Update an activity in an itinerary"""
    user = request.user
    data = request.get_json()

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Find activity in itinerary
    activities = itinerary.get('activities', [])
    activity_index = next((i for i, act in enumerate(activities) if act.get('id') == activity_id), None)

    if activity_index is None:
        return jsonify({'message': 'Activity not found in itinerary'}), 404

    # Fields that can be updated
    updatable_fields = ['name', 'date', 'time', 'location', 'cost', 'notes', 'booked']

    # Create update data with only allowed fields
    update_data = {}
    for field in updatable_fields:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return jsonify({'message': 'No valid fields to update'}), 400

    # Update activity
    result = db.update_activity_in_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, activity_id, update_data)

    if not result:
        return jsonify({'message': 'Failed to update activity'}), 500

    # Get updated itinerary
    updated_itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)
    updated_activity = next((act for act in updated_itinerary.get('activities', []) if act.get('id') == activity_id),
                            None)

    return jsonify({
        'message': 'Activity updated successfully',
        'activity': updated_activity
    }), 200


@trip_bp.route('/itineraries/<itinerary_id>/activities/<activity_id>', methods=['DELETE'])
@token_required
def delete_activity(itinerary_id, activity_id):
    """Delete an activity from an itinerary"""
    user = request.user

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Delete activity
    result = db.delete_activity_from_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, activity_id)

    if not result:
        return jsonify({'message': 'Failed to delete activity'}), 500

    return jsonify({'message': 'Activity deleted successfully'}), 200


@trip_bp.route('/itineraries/<itinerary_id>/accommodations', methods=['POST'])
@token_required
def add_accommodation(itinerary_id):
    """Add an accommodation to an itinerary"""
    user = request.user
    data = request.get_json()

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Validate required fields
    required_fields = ['name', 'checkIn', 'checkOut']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Create accommodation with ID
    accommodation = {
        'id': str(ObjectId()),  # Generate a new ID
        'name': data['name'],
        'checkIn': data['checkIn'],
        'checkOut': data['checkOut'],
        'location': data.get('location', ''),
        'cost': data.get('cost', 0),
        'confirmation': data.get('confirmation', ''),
        'notes': data.get('notes', '')
    }

    # Add accommodation to itinerary
    result = db.add_accommodation_to_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, accommodation)

    if not result:
        return jsonify({'message': 'Failed to add accommodation'}), 500

    return jsonify({
        'message': 'Accommodation added successfully',
        'accommodation': accommodation
    }), 201


@trip_bp.route('/itineraries/<itinerary_id>/transportation', methods=['POST'])
@token_required
def add_transportation(itinerary_id):
    """Add transportation to an itinerary"""
    user = request.user
    data = request.get_json()

    # Get itinerary
    itinerary = db.get_itinerary_by_id(DB_NAME, ITINERARIES_COLLECTION, itinerary_id)

    if not itinerary:
        return jsonify({'message': 'Itinerary not found'}), 404

    # Ensure itinerary belongs to the current user
    if itinerary.get('userId') != str(user['_id']):
        return jsonify({'message': 'Unauthorized access to itinerary'}), 403

    # Validate required fields
    required_fields = ['type', 'from', 'to', 'departureDate']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Create transportation with ID
    transportation = {
        'id': str(ObjectId()),  # Generate a new ID
        'type': data['type'],
        'from': data['from'],
        'to': data['to'],
        'departureDate': data['departureDate'],
        'departureTime': data.get('departureTime', ''),
        'arrivalDate': data.get('arrivalDate', data['departureDate']),
        'arrivalTime': data.get('arrivalTime', ''),
        'carrier': data.get('carrier', ''),
        'confirmation': data.get('confirmation', ''),
        'cost': data.get('cost', 0),
        'notes': data.get('notes', '')
    }

    # Add transportation to itinerary
    result = db.add_transportation_to_itinerary(DB_NAME, ITINERARIES_COLLECTION, itinerary_id, transportation)

    if not result:
        return jsonify({'message': 'Failed to add transportation'}), 500

    return jsonify({
        'message': 'Transportation added successfully',
        'transportation': transportation
    }), 201
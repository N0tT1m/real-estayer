from flask import Blueprint, request, jsonify
from bson import ObjectId
from auth_routes import token_required
from bson.json_util import dumps
import json
import db
import logging
import datetime

review_bp = Blueprint('review', __name__)

# Constants
DB_NAME = "airbnb"
REVIEWS_COLLECTION = "reviews"
LISTINGS_COLLECTION = "listings"
TRIPS_COLLECTION = "trips"


@review_bp.route('/listings/<listing_id>/reviews', methods=['GET'])
def get_listing_reviews(listing_id):
    """Get all reviews for a specific listing"""
    # Check if listing exists
    listing = db.get_listing_by_id(DB_NAME, LISTINGS_COLLECTION, listing_id)
    if not listing:
        return jsonify({'message': 'Listing not found'}), 404

    # Query parameters for pagination and filtering
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    rating = int(request.args.get('rating', 0))  # 0 means all ratings

    # Get reviews
    reviews = db.get_listing_reviews(DB_NAME, REVIEWS_COLLECTION, listing_id, page, per_page, rating)

    # Get review stats
    stats = db.get_listing_review_stats(DB_NAME, REVIEWS_COLLECTION, listing_id)

    return jsonify({
        'reviews': reviews['reviews'],
        'totalCount': reviews['totalCount'],
        'pageCount': reviews['pageCount'],
        'stats': stats
    }), 200


@review_bp.route('/listings/<listing_id>/reviews', methods=['POST'])
@token_required
def create_review(listing_id):
    """Create a new review for a listing"""
    user = request.user
    data = request.get_json()

    # Check if listing exists
    listing = db.get_listing_by_id(DB_NAME, LISTINGS_COLLECTION, listing_id)
    if not listing:
        return jsonify({'message': 'Listing not found'}), 404

    # Validate required fields
    required_fields = ['rating', 'comment']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400

    # Check if rating is valid (1-5)
    if not 1 <= data['rating'] <= 5:
        return jsonify({'message': 'Rating must be between 1 and 5'}), 400

    # Check if user has stayed at this listing (has a completed trip)
    has_stayed = db.has_user_stayed_at_listing(DB_NAME, TRIPS_COLLECTION, str(user['_id']), listing_id)

    if not has_stayed:
        return jsonify({'message': 'You must have completed a stay at this listing to leave a review'}), 403

    # Check if user has already reviewed this listing
    existing_review = db.get_user_review_for_listing(DB_NAME, REVIEWS_COLLECTION, str(user['_id']), listing_id)

    if existing_review:
        return jsonify({'message': 'You have already reviewed this listing'}), 409

    # Validate category ratings if provided
    categories = data.get('categories', {})
    for key in categories:
        if not 1 <= categories[key] <= 5:
            return jsonify({'message': f'Rating for {key} must be between 1 and 5'}), 400

    # Set default category ratings if not provided
    default_rating = data['rating']
    default_categories = {
        'cleanliness': default_rating,
        'accuracy': default_rating,
        'communication': default_rating,
        'location': default_rating,
        'checkin': default_rating,
        'value': default_rating
    }

    # Merge provided categories with defaults
    for key in default_categories:
        if key not in categories:
            categories[key] = default_categories[key]

    # Create review document
    review = {
        'listingId': listing_id,
        'userId': str(user['_id']),
        'userName': user['name'],
        'userImage': user.get('profileImage', ''),
        'rating': data['rating'],
        'comment': data['comment'],
        'date': datetime.datetime.utcnow().isoformat(),
        'helpfulCount': 0,
        'photos': data.get('photos', []),
        'categories': categories
    }

    # Insert review
    review_id = db.insert_one_into_collection(DB_NAME, REVIEWS_COLLECTION, review)

    if not review_id:
        return jsonify({'message': 'Failed to create review'}), 500

    # Update listing with new review count and average rating
    db.update_listing_review_stats(DB_NAME, LISTINGS_COLLECTION, listing_id)

    review['id'] = review_id

    return jsonify({
        'message': 'Review created successfully',
        'review': review
    }), 201


@review_bp.route('/reviews/<review_id>/helpful', methods=['POST'])
@token_required
def mark_review_helpful(review_id):
    """Mark a review as helpful"""
    # Get review
    review = db.get_review_by_id(DB_NAME, REVIEWS_COLLECTION, review_id)

    if not review:
        return jsonify({'message': 'Review not found'}), 404

    # Update helpful count
    result = db.increment_review_helpful_count(DB_NAME, REVIEWS_COLLECTION, review_id)

    if not result:
        return jsonify({'message': 'Failed to mark review as helpful'}), 500

    return jsonify({'message': 'Review marked as helpful'}), 200


@review_bp.route('/reviews/<review_id>/report', methods=['POST'])
@token_required
def report_review(review_id):
    """Report a review"""
    user = request.user
    data = request.get_json()

    # Get review
    review = db.get_review_by_id(DB_NAME, REVIEWS_COLLECTION, review_id)

    if not review:
        return jsonify({'message': 'Review not found'}), 404

    # Validate reason
    reason = data.get('reason', '')
    if not reason:
        return jsonify({'message': 'Reason for report is required'}), 400

    # Create report
    report = {
        'reviewId': review_id,
        'userId': str(user['_id']),
        'reason': reason,
        'additionalInfo': data.get('additionalInfo', ''),
        'date': datetime.datetime.utcnow().isoformat(),
        'status': 'pending'  # Initial status
    }

    # Insert report
    report_id = db.insert_one_into_collection(DB_NAME, 'review_reports', report)

    if not report_id:
        return jsonify({'message': 'Failed to report review'}), 500

    return jsonify({'message': 'Review reported successfully'}), 200


@review_bp.route('/listings/<listing_id>/host-response/<review_id>', methods=['POST'])
@token_required
def add_host_response(listing_id, review_id):
    """Add a host response to a review"""
    user = request.user
    data = request.get_json()

    # Check if listing exists and belongs to the current user (host)
    listing = db.get_listing_by_id(DB_NAME, LISTINGS_COLLECTION, listing_id)

    if not listing:
        return jsonify({'message': 'Listing not found'}), 404

    # In a real app, you would check if the current user is the host of the listing
    # For now, we'll simulate this check
    is_host = True  # Replace with actual check

    if not is_host:
        return jsonify({'message': 'Only the host can respond to reviews'}), 403

    # Check if review exists and belongs to the listing
    review = db.get_review_by_id(DB_NAME, REVIEWS_COLLECTION, review_id)

    if not review or review.get('listingId') != listing_id:
        return jsonify({'message': 'Review not found'}), 404

    # Check if response text is provided
    response_text = data.get('text')
    if not response_text:
        return jsonify({'message': 'Response text is required'}), 400

    # Check if review already has a response
    if 'response' in review:
        return jsonify({'message': 'This review already has a response'}), 409

    # Create response
    response = {
        'text': response_text,
        'date': datetime.datetime.utcnow().isoformat()
    }

    # Add response to review
    result = db.add_response_to_review(DB_NAME, REVIEWS_COLLECTION, review_id, response)

    if not result:
        return jsonify({'message': 'Failed to add response'}), 500

    return jsonify({
        'message': 'Response added successfully',
        'response': response
    }), 201


@review_bp.route('/user/reviews', methods=['GET'])
@token_required
def get_user_reviews():
    """Get reviews written by the current user"""
    user = request.user

    reviews = db.get_reviews_by_user(DB_NAME, REVIEWS_COLLECTION, str(user['_id']))

    return jsonify(reviews), 200


@review_bp.route('/host/reviews', methods=['GET'])
@token_required
def get_host_reviews():
    """Get reviews for listings hosted by the current user"""
    user = request.user

    # In a real app, you would first get all listings hosted by the user
    # For now, we'll simulate this
    host_listings = []  # Replace with actual listings

    if not host_listings:
        return jsonify({'message': 'You have no listings or are not a host'}), 404

    listing_ids = [listing['id'] for listing in host_listings]

    reviews = db.get_reviews_for_listings(DB_NAME, REVIEWS_COLLECTION, listing_ids)

    return jsonify(reviews), 200
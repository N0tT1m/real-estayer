from pymongo import MongoClient, UpdateOne, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, OperationFailure
from bson import ObjectId
import logging
import datetime
import math

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# These functions extend the db.py file to support the new functionality

def get_user_by_email(db_name, collection_name, email):
    """Get a user by email"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        user = collection.find_one({'email': email})
        return user
    except Exception as e:
        logging.error(f"An error occurred while fetching user by email: {e}")
        return None
    finally:
        db_manager.close_connection()


def get_reviews_for_listings(db_name, collection_name, listing_ids):
    """Get reviews for a list of listings"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        reviews = list(collection.find({'listingId': {'$in': listing_ids}}).sort('date', DESCENDING))

        # Convert ObjectIds to strings
        for review in reviews:
            review['id'] = str(review['_id'])
            del review['_id']

        return reviews
    except Exception as e:
        logging.error(f"An error occurred while fetching reviews for listings: {e}")
        return []
    finally:
        db_manager.close_connection()


def update_listing_review_stats(db_name, collection_name, listing_id):
    """Update a listing's review count and average rating"""
    from db import db_manager

    # Get review stats first
    stats = get_listing_review_stats(db_name, "reviews", listing_id)

    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(listing_id)},
            {'$set': {
                'reviewCount': stats['totalReviews'],
                'averageRating': stats['averageRating'],
                'categoryRatings': stats['categoryAverages']
            }}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating listing review stats: {e}")
        return False
    finally:
        db_manager.close_connection()


def count_documents(db_name, collection_name, query=None):
    """Count documents in a collection with an optional query"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        return collection.count_documents(query or {})
    except Exception as e:
        logging.error(f"An error occurred while counting documents: {e}")
        return 0
    finally:
        db_manager.close_connection()


def get_listings_with_pagination(db_name, collection_name, query=None, skip=0, limit=20):
    """Get listings with pagination"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        cursor = collection.find(query or {}).skip(skip).limit(limit)

        # Convert MongoDB documents to JSON-serializable format
        results = []
        for doc in cursor:
            doc['id'] = str(doc['_id'])
            del doc['_id']
            results.append(doc)

        return results
    except Exception as e:
        logging.error(f"An error occurred while fetching listings with pagination: {e}")
        return []
    finally:
        db_manager.close_connection()


def get_user_by_id(db_name, collection_name, user_id):
    """Get a user by ID"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        user = collection.find_one({'_id': ObjectId(user_id)})
        return user
    except Exception as e:
        logging.error(f"An error occurred while fetching user by ID: {e}")
        return None
    finally:
        db_manager.close_connection()


def insert_one_into_collection(db_name, collection_name, document):
    """Insert a single document into a collection"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.insert_one(document)
        return str(result.inserted_id)
    except Exception as e:
        logging.error(f"An error occurred while inserting document: {e}")
        return None
    finally:
        db_manager.close_connection()


def update_user(db_name, collection_name, user_id, update_data):
    """Update a user document"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating user: {e}")
        return False
    finally:
        db_manager.close_connection()


def update_user_password(db_name, collection_name, user_id, new_password):
    """Update a user's password"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'password': new_password}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating user password: {e}")
        return False
    finally:
        db_manager.close_connection()


def mark_user_for_deletion(db_name, collection_name, user_id):
    """Mark a user for deletion"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'markedForDeletion': True,
                'deletionRequestDate': datetime.datetime.utcnow().isoformat()
            }}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while marking user for deletion: {e}")
        return False
    finally:
        db_manager.close_connection()


def add_saved_listing(db_name, collection_name, user_id, listing_id):
    """Add a listing to a user's saved listings"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$addToSet': {'savedListings': listing_id}}
        )
        return True  # Return true even if listing was already saved
    except Exception as e:
        logging.error(f"An error occurred while adding saved listing: {e}")
        return False
    finally:
        db_manager.close_connection()


def remove_saved_listing(db_name, collection_name, user_id, listing_id):
    """Remove a listing from a user's saved listings"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$pull': {'savedListings': listing_id}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while removing saved listing: {e}")
        return False
    finally:
        db_manager.close_connection()


def get_listings_by_ids(db_name, collection_name, listing_ids):
    """Get listings by their IDs"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        listings = list(collection.find({'_id': {'$in': [ObjectId(id) for id in listing_ids]}}))

        # Convert ObjectIds to strings
        for listing in listings:
            listing['id'] = str(listing['_id'])
            del listing['_id']

        return listings
    except Exception as e:
        logging.error(f"An error occurred while fetching listings by IDs: {e}")
        return []
    finally:
        db_manager.close_connection()


def get_user_trips(db_name, collection_name, user_id, status=None):
    """Get trips for a user, optionally filtered by status"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        query = {'userId': user_id}
        if status:
            query['status'] = status

        trips = list(collection.find(query).sort('bookedAt', DESCENDING))

        # Convert ObjectIds to strings
        for trip in trips:
            trip['id'] = str(trip['_id'])
            del trip['_id']

        return trips
    except Exception as e:
        logging.error(f"An error occurred while fetching user trips: {e}")
        return []
    finally:
        db_manager.close_connection()


def get_trip_by_id(db_name, collection_name, trip_id):
    """Get a trip by ID"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        trip = collection.find_one({'_id': ObjectId(trip_id)})

        if trip:
            trip['id'] = str(trip['_id'])
            del trip['_id']

        return trip
    except Exception as e:
        logging.error(f"An error occurred while fetching trip by ID: {e}")
        return None
    finally:
        db_manager.close_connection()


def update_trip_status(db_name, collection_name, trip_id, status):
    """Update a trip's status"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(trip_id)},
            {'$set': {'status': status}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating trip status: {e}")
        return False
    finally:
        db_manager.close_connection()


def get_user_payment_methods(db_name, collection_name, user_id):
    """Get payment methods for a user"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        payment_methods = list(collection.find({'userId': user_id}))

        # Convert ObjectIds to strings
        for method in payment_methods:
            method['id'] = str(method['_id'])
            del method['_id']

        return payment_methods
    except Exception as e:
        logging.error(f"An error occurred while fetching user payment methods: {e}")
        return []
    finally:
        db_manager.close_connection()


def get_payment_method_by_id(db_name, collection_name, payment_method_id):
    """Get a payment method by ID"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        payment_method = collection.find_one({'_id': ObjectId(payment_method_id)})

        if payment_method:
            payment_method['id'] = str(payment_method['_id'])
            del payment_method['_id']

        return payment_method
    except Exception as e:
        logging.error(f"An error occurred while fetching payment method by ID: {e}")
        return None
    finally:
        db_manager.close_connection()


def set_default_payment_method(db_name, collection_name, user_id, payment_method_id):
    """Set a payment method as default for a user"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # First, unset default for all payment methods
        collection.update_many(
            {'userId': user_id},
            {'$set': {'isDefault': False}}
        )

        # Then set the specified payment method as default
        result = collection.update_one(
            {'_id': ObjectId(payment_method_id), 'userId': user_id},
            {'$set': {'isDefault': True}}
        )

        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while setting default payment method: {e}")
        return False
    finally:
        db_manager.close_connection()


def remove_payment_method(db_name, collection_name, payment_method_id):
    """Remove a payment method"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.delete_one({'_id': ObjectId(payment_method_id)})
        return result.deleted_count > 0
    except Exception as e:
        logging.error(f"An error occurred while removing payment method: {e}")
        return False
    finally:
        db_manager.close_connection()


def update_notification_preferences(db_name, collection_name, user_id, preferences):
    """Update a user's notification preferences"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'notificationPreferences': preferences}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating notification preferences: {e}")
        return False
    finally:
        db_manager.close_connection()


def get_user_itineraries(db_name, collection_name, user_id):
    """Get all itineraries for a user"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        itineraries = list(collection.find({'userId': user_id}).sort('createdAt', DESCENDING))

        # Convert ObjectIds to strings
        for itinerary in itineraries:
            itinerary['id'] = str(itinerary['_id'])
            del itinerary['_id']

        return itineraries
    except Exception as e:
        logging.error(f"An error occurred while fetching user itineraries: {e}")
        return []
    finally:
        db_manager.close_connection()


def get_itinerary_by_id(db_name, collection_name, itinerary_id):
    """Get an itinerary by ID"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        itinerary = collection.find_one({'_id': ObjectId(itinerary_id)})

        if itinerary:
            itinerary['id'] = str(itinerary['_id'])
            del itinerary['_id']

        return itinerary
    except Exception as e:
        logging.error(f"An error occurred while fetching itinerary by ID: {e}")
        return None
    finally:
        db_manager.close_connection()


def update_itinerary(db_name, collection_name, itinerary_id, update_data):
    """Update an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {'$set': update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def delete_itinerary(db_name, collection_name, itinerary_id):
    """Delete an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.delete_one({'_id': ObjectId(itinerary_id)})
        return result.deleted_count > 0
    except Exception as e:
        logging.error(f"An error occurred while deleting itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def add_activity_to_itinerary(db_name, collection_name, itinerary_id, activity):
    """Add an activity to an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$push': {'activities': activity},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while adding activity to itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def update_activity_in_itinerary(db_name, collection_name, itinerary_id, activity_id, update_data):
    """Update an activity in an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # Build update operations for each field
        update_operations = {}
        for key, value in update_data.items():
            update_operations[f'activities.$.{key}'] = value

        # Add updatedAt timestamp
        update_operations['updatedAt'] = datetime.datetime.utcnow().isoformat()

        result = collection.update_one(
            {
                '_id': ObjectId(itinerary_id),
                'activities.id': activity_id
            },
            {'$set': update_operations}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating activity in itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def delete_activity_from_itinerary(db_name, collection_name, itinerary_id, activity_id):
    """Delete an activity from an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$pull': {'activities': {'id': activity_id}},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while deleting activity from itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def add_accommodation_to_itinerary(db_name, collection_name, itinerary_id, accommodation):
    """Add an accommodation to an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$push': {'accommodations': accommodation},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while adding accommodation to itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def add_transportation_to_itinerary(db_name, collection_name, itinerary_id, transportation):
    """Add transportation to an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$push': {'transportation': transportation},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while adding transportation to itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def update_accommodation_in_itinerary(db_name, collection_name, itinerary_id, accommodation_id, update_data):
    """Update an accommodation in an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # Build update operations for each field
        update_operations = {}
        for key, value in update_data.items():
            update_operations[f'accommodations.$.{key}'] = value

        # Add updatedAt timestamp
        update_operations['updatedAt'] = datetime.datetime.utcnow().isoformat()

        result = collection.update_one(
            {
                '_id': ObjectId(itinerary_id),
                'accommodations.id': accommodation_id
            },
            {'$set': update_operations}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating accommodation in itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def delete_accommodation_from_itinerary(db_name, collection_name, itinerary_id, accommodation_id):
    """Delete an accommodation from an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$pull': {'accommodations': {'id': accommodation_id}},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while deleting accommodation from itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def update_transportation_in_itinerary(db_name, collection_name, itinerary_id, transportation_id, update_data):
    """Update transportation in an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # Build update operations for each field
        update_operations = {}
        for key, value in update_data.items():
            update_operations[f'transportation.$.{key}'] = value

        # Add updatedAt timestamp
        update_operations['updatedAt'] = datetime.datetime.utcnow().isoformat()

        result = collection.update_one(
            {
                '_id': ObjectId(itinerary_id),
                'transportation.id': transportation_id
            },
            {'$set': update_operations}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while updating transportation in itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def delete_transportation_from_itinerary(db_name, collection_name, itinerary_id, transportation_id):
    """Delete transportation from an itinerary"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(itinerary_id)},
            {
                '$pull': {'transportation': {'id': transportation_id}},
                '$set': {'updatedAt': datetime.datetime.utcnow().isoformat()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while deleting transportation from itinerary: {e}")
        return False
    finally:
        db_manager.close_connection()


def has_user_stayed_at_listing(db_name, collection_name, user_id, listing_id):
    """Check if a user has stayed at a listing (completed trip)"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        count = collection.count_documents({
            'userId': user_id,
            'listingId': listing_id,
            'status': 'completed'
        })
        return count > 0
    except Exception as e:
        logging.error(f"An error occurred while checking if user stayed at listing: {e}")
        return False
    finally:
        db_manager.close_connection()


def get_user_review_for_listing(db_name, collection_name, user_id, listing_id):
    """Get a user's review for a specific listing"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        review = collection.find_one({
            'userId': user_id,
            'listingId': listing_id
        })

        if review:
            review['id'] = str(review['_id'])
            del review['_id']

        return review
    except Exception as e:
        logging.error(f"An error occurred while fetching user review for listing: {e}")
        return None
    finally:
        db_manager.close_connection()


def get_listing_reviews(db_name, collection_name, listing_id, page=1, per_page=10, rating=0):
    """Get reviews for a specific listing with pagination and rating filter"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # Build query
        query = {'listingId': listing_id}
        if rating > 0:
            query['rating'] = rating

        # Count total matching reviews
        total_count = collection.count_documents(query)

        # Calculate pagination values
        skip = (page - 1) * per_page
        page_count = math.ceil(total_count / per_page)

        # Get reviews for current page
        reviews = list(collection.find(query)
                       .sort('date', DESCENDING)
                       .skip(skip)
                       .limit(per_page))

        # Convert ObjectIds to strings
        for review in reviews:
            review['id'] = str(review['_id'])
            del review['_id']

        return {
            'reviews': reviews,
            'totalCount': total_count,
            'pageCount': page_count
        }
    except Exception as e:
        logging.error(f"An error occurred while fetching listing reviews: {e}")
        return {'reviews': [], 'totalCount': 0, 'pageCount': 0}
    finally:
        db_manager.close_connection()


def get_listing_review_stats(db_name, collection_name, listing_id):
    """Get review statistics for a listing"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)

        # Get count of reviews by rating
        rating_counts = {}
        for rating in range(1, 6):
            count = collection.count_documents({'listingId': listing_id, 'rating': rating})
            rating_counts[str(rating)] = count

        # Get average rating
        pipeline = [
            {'$match': {'listingId': listing_id}},
            {'$group': {
                '_id': None,
                'averageRating': {'$avg': '$rating'},
                'count': {'$sum': 1}
            }}
        ]

        result = list(collection.aggregate(pipeline))

        if result:
            average_rating = result[0]['averageRating']
            total_reviews = result[0]['count']
        else:
            average_rating = 0
            total_reviews = 0

        # Get category averages
        category_pipeline = [
            {'$match': {'listingId': listing_id}},
            {'$group': {
                '_id': None,
                'averageCleanliness': {'$avg': '$categories.cleanliness'},
                'averageAccuracy': {'$avg': '$categories.accuracy'},
                'averageCommunication': {'$avg': '$categories.communication'},
                'averageLocation': {'$avg': '$categories.location'},
                'averageCheckin': {'$avg': '$categories.checkin'},
                'averageValue': {'$avg': '$categories.value'}
            }}
        ]

        category_result = list(collection.aggregate(category_pipeline))

        category_averages = {}
        if category_result:
            for key, value in category_result[0].items():
                if key != '_id':
                    # Convert key from camelCase to the category name
                    category = key.replace('average', '').lower()
                    category_averages[category] = value

        return {
            'averageRating': average_rating,
            'totalReviews': total_reviews,
            'ratingCounts': rating_counts,
            'categoryAverages': category_averages
        }
    except Exception as e:
        logging.error(f"An error occurred while fetching listing review stats: {e}")
        return {
            'averageRating': 0,
            'totalReviews': 0,
            'ratingCounts': {},
            'categoryAverages': {}
        }
    finally:
        db_manager.close_connection()


def get_review_by_id(db_name, collection_name, review_id):
    """Get a review by ID"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        review = collection.find_one({'_id': ObjectId(review_id)})

        if review:
            review['id'] = str(review['_id'])
            del review['_id']

        return review
    except Exception as e:
        logging.error(f"An error occurred while fetching review by ID: {e}")
        return None
    finally:
        db_manager.close_connection()


def increment_review_helpful_count(db_name, collection_name, review_id):
    """Increment the helpful count for a review"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(review_id)},
            {'$inc': {'helpfulCount': 1}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while incrementing review helpful count: {e}")
        return False
    finally:
        db_manager.close_connection()


def add_response_to_review(db_name, collection_name, review_id, response):
    """Add a host response to a review"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        result = collection.update_one(
            {'_id': ObjectId(review_id)},
            {'$set': {'response': response}}
        )
        return result.modified_count > 0
    except Exception as e:
        logging.error(f"An error occurred while adding response to review: {e}")
        return False
    finally:
        db_manager.close_connection()


def get_reviews_by_user(db_name, collection_name, user_id):
    """Get reviews written by a user"""
    from db import db_manager
    try:
        db_manager.connect()
        collection = db_manager.get_collection(db_name, collection_name)
        reviews = list(collection.find({'userId': user_id}).sort('date', DESCENDING))

        # Convert ObjectIds to strings
        for review in reviews:
            review['id'] = str(review['_id'])
            del review['_id']

        return reviews
    except Exception as e:
        logging.error(f"An error occurred while fetching reviews by user: {e}")
        return []
    finally:
        db_manager.close_connection()
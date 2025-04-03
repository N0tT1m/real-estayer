import pymongo
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
client = pymongo.MongoClient(MONGO_URI)


def get_collection(db_name, collection_name):
    """Get a MongoDB collection"""
    try:
        db = client[db_name]
        collection = db[collection_name]
        return collection
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {str(e)}")
        return None


def get_listings(db_name, collection_name, query={}, limit=0):
    """Get listings with optional filtering and limit"""
    try:
        collection = get_collection(db_name, collection_name)
        if limit > 0:
            return list(collection.find(query).limit(limit))
        return list(collection.find(query))
    except Exception as e:
        logger.error(f"Error getting listings: {str(e)}")
        return []


def get_listing_by_id(db_name, collection_name, listing_id):
    """Get a single listing by ID"""
    try:
        collection = get_collection(db_name, collection_name)
        if ObjectId.is_valid(listing_id):
            return collection.find_one({"_id": ObjectId(listing_id)})
        else:
            return collection.find_one({"id": listing_id})
    except Exception as e:
        logger.error(f"Error getting listing by ID: {str(e)}")
        return None


def insert_many_into_collection(db_name, collection_name, items):
    """Insert multiple items into a collection"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.insert_many(items)
        return result.inserted_ids
    except Exception as e:
        logger.error(f"Error inserting many into collection: {str(e)}")
        return []


def insert_one_into_collection(db_name, collection_name, item):
    """Insert one item into a collection and return the ID"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.insert_one(item)
        return str(result.inserted_id)
    except Exception as e:
        logger.error(f"Error inserting into collection: {str(e)}")
        return None


def get_user_by_email(db_name, collection_name, email):
    """Get a user by email"""
    try:
        collection = get_collection(db_name, collection_name)
        return collection.find_one({"email": email})
    except Exception as e:
        logger.error(f"Error getting user by email: {str(e)}")
        return None


def get_user_by_id(db_name, collection_name, user_id):
    """Get a user by ID"""
    try:
        collection = get_collection(db_name, collection_name)
        if ObjectId.is_valid(user_id):
            return collection.find_one({"_id": ObjectId(user_id)})
        else:
            return collection.find_one({"id": user_id})
    except Exception as e:
        logger.error(f"Error getting user by ID: {str(e)}")
        return None


def update_user(db_name, collection_name, user_id, update_data):
    """Update a user's profile"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return False


def update_user_password(db_name, collection_name, user_id, hashed_password):
    """Update a user's password"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_password}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error updating user password: {str(e)}")
        return False


def mark_user_for_deletion(db_name, collection_name, user_id):
    """Mark a user for deletion"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"pendingDeletion": True}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error marking user for deletion: {str(e)}")
        return False


def get_user_trips(db_name, collection_name, user_id, status=None):
    """Get trips for a user with optional status filter"""
    try:
        collection = get_collection(db_name, collection_name)
        query = {"userId": user_id}
        if status:
            query["status"] = status
        return list(collection.find(query))
    except Exception as e:
        logger.error(f"Error getting user trips: {str(e)}")
        return []


def get_user_payment_methods(db_name, collection_name, user_id):
    """Get payment methods for a user"""
    try:
        collection = get_collection(db_name, collection_name)
        return list(collection.find({"userId": user_id}))
    except Exception as e:
        logger.error(f"Error getting user payment methods: {str(e)}")
        return []


def add_saved_listing(db_name, collection_name, user_id, listing_id):
    """Add a listing to user's saved listings"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$addToSet": {"savedListings": listing_id}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error adding saved listing: {str(e)}")
        return False


def remove_saved_listing(db_name, collection_name, user_id, listing_id):
    """Remove a listing from user's saved listings"""
    try:
        collection = get_collection(db_name, collection_name)
        result = collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$pull": {"savedListings": listing_id}}
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error removing saved listing: {str(e)}")
        return False


def get_filters(db_name, collection_name, query={}, limit=10):
    """Get distinct filters available based on query"""
    try:
        collection = get_collection(db_name, collection_name)
        features = collection.distinct("features", query)
        regions = collection.distinct("region", query)
        countries = collection.distinct("country", query)

        return {
            "features": features,
            "regions": regions,
            "countries": countries
        }
    except Exception as e:
        logger.error(f"Error getting filters: {str(e)}")
        return {
            "features": [],
            "regions": [],
            "countries": []
        }
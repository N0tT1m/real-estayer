import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException
import db
import logging
from flask import Flask, request, jsonify
from bson.json_util import dumps
import json
from flask_cors import CORS
import re
import os
from waitress import serve
from config import config

# Import new routes
from auth_routes import auth_bp
from user_routes import user_bp
from trip_routes import trip_bp
from review_routes import review_bp

# Import database extensions
import db_extensions

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'app.log')),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# List of Canadian provinces and territories
CANADIAN_PROVINCES = [
    # "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    # "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    # "Quebec", "Saskatchewan", "Yukon"
]

# List of US states
US_STATES = [
    # "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida",
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow specific origins
CORS(app,
     resources={r"/*": {"origins": ["http://localhost:6969", "http://localhost:4200"]}},
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Origin",
                    "Access-Control-Allow-Headers", "Access-Control-Allow-Methods"])

# Instead of using flask_cors, let's manually handle CORS
@app.after_request
def add_cors_headers(response):
    # Set a SINGLE Access-Control-Allow-Origin header
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:6969')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

# Handle OPTIONS requests globally
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = make_response()
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:6969')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response

# Now import blueprints AFTER setting up CORS handlers
from auth_routes import auth_bp

# Import database extensions and other modules
import db_extensions

# Database configuration
DB_NAME = "airbnb"
COLLECTION_NAME = "listings"

# Now import blueprints but don't register them yet
from auth_routes import auth_bp
from user_routes import user_bp
from trip_routes import trip_bp
from review_routes import review_bp


# Create a global before_request handler for JWT verification
# We'll attach this to specific blueprints that need authentication
def jwt_required_except(exempt_endpoints=[]):
    def decorator(bp):
        @bp.before_request
        def verify_jwt():
            # Skip JWT verification for exempted endpoints or OPTIONS requests
            if request.endpoint in exempt_endpoints or request.method == 'OPTIONS':
                logger.debug(f"Skipping JWT verification for {request.endpoint}")
                return None

            logger.debug(f"Verifying JWT for {request.endpoint}")

            # Get the token from Authorization header
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.warning("No valid Authorization header found")
                return jsonify({'message': 'Token is missing'}), 401

            token = auth_header.split(' ')[1]

            # Token validation would normally go here
            # For now, just log that we would validate it
            logger.debug(f"Would validate token: {token[:10]}...")

            # In a real app, you would validate the token and set user info
            # For this example, we're just demonstrating the pattern

            return None  # Continue with the request

        return bp

    return decorator


# Add explicit exemptions for auth endpoints that shouldn't require auth
auth_exempt_endpoints = ['auth.signup', 'auth.login']
jwt_required_except(auth_exempt_endpoints)(auth_bp)

# Apply JWT verification to other blueprints that need authentication
jwt_required_except([])(user_bp)  # No exemptions for user routes
jwt_required_except([])(trip_bp)  # No exemptions for trip routes
jwt_required_except([])(review_bp)  # No exemptions for review routes

# Now register all blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(user_bp, url_prefix='/user')
app.register_blueprint(trip_bp, url_prefix='/trips')
app.register_blueprint(review_bp, url_prefix='/reviews')


# Your existing helper functions
def initialize_browser():
    browser = webdriver.Chrome()
    return browser


def wait_for_elements(browser, by, value, timeout=10):
    return WebDriverWait(browser, timeout).until(
        EC.presence_of_all_elements_located((by, value))
    )


def get_text_or_empty(browser, by, value):
    try:
        element = WebDriverWait(browser, 10).until(
            EC.presence_of_element_located((by, value))
        )
        return element.text
    except (TimeoutException, NoSuchElementException):
        return ""


def get_price(browser, by, value):
    try:
        elements = WebDriverWait(browser, 10).until(
            EC.presence_of_all_elements_located((by, value))
        )

        for element in elements:
            if '$' in element.text:
                return element.text.strip()

        return ""  # Return empty string if no element with '$' is found
    except (TimeoutException, NoSuchElementException):
        logging.error(f"Error finding price elements: {by}, {value}")
        return ""


def get_attribute_or_empty(browser, by, value, attribute):
    try:
        element = WebDriverWait(browser, 10).until(
            EC.presence_of_element_located((by, value))
        )
        return element.get_attribute(attribute)
    except (TimeoutException, NoSuchElementException):
        return ""


def get_place_urls(browser, location):
    urls = set()
    base_url = f'https://www.airbnb.com/s/{location}/homes?tab_id=home_tab&refinement_paths%5B%5D=%2Fhomes&flexible_trip_lengths%5B%5D=one_week&monthly_start_date=2024-12-01&monthly_length=12&monthly_end_date=2026-12-01&price_filter_input_type=0&channel=EXPLORE&date_picker_type=flexible_dates&source=structured_search_input_header&adults=3&search_type=autocomplete_click&query={location}'
    browser.get(base_url)

    while True:
        try:
            places_to_stay = wait_for_elements(browser, By.CLASS_NAME, "atm_7l_1j28jx2")
            for place in places_to_stay:
                url = place.get_attribute('href')
                if url:
                    urls.add(url)

            logging.info(f"Found {len(urls)} unique places so far")
        except Exception as e:
            logging.error(f"Failed to get a single place to stay")

            try:
                places_to_stay = wait_for_elements(browser, By.CLASS_NAME, "lr88w8j")
                for place in places_to_stay:
                    url = place.get_attribute('href')
                    if url:
                        urls.add(url)

                logging.info(f"Found {len(urls)} unique places so far")

            except Exception as e:
                logging.error(f"Failed to get multiple places to stay")
        try:
            next_button = WebDriverWait(browser, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//a[@aria-label='Next']"))
            )
            next_button.click()
            time.sleep(5)
        except (TimeoutException, NoSuchElementException):
            logging.info("Reached the last page or no more results")
            break

    return list(urls)


def close_modal(browser):
    try:
        close_button = WebDriverWait(browser, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//button[@aria-label='Close']"))
        )
        close_button.click()
        time.sleep(1)
        logging.info("Successfully closed modal")
    except (TimeoutException, NoSuchElementException):
        logging.info("No modal found to close")


def click_show_all_amenities(browser):
    try:
        # Close any open modals first
        close_modal(browser)

        # Wait for the button to be clickable
        button = WebDriverWait(browser, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Show all') and contains(., 'amenities')]"))
        )
        # Scroll the button into view
        browser.execute_script("arguments[0].scrollIntoView(true);", button)
        # Wait a bit for any animations to finish
        time.sleep(1)
        # Try to click the button using JavaScript
        browser.execute_script("arguments[0].click();", button)
        # Wait for the modal to appear
        WebDriverWait(browser, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "twad414"))
        )
        logging.info("Successfully clicked 'Show all amenities' button")
        return True
    except (TimeoutException, NoSuchElementException, ElementClickInterceptedException) as e:
        logging.warning(f"Failed to click 'Show all amenities' button: {e}")
        return False


def scrape_features(browser):
    # Try to click the "Show all amenities" button
    if click_show_all_amenities(browser):
        # If successful, scrape features from the modal
        return [feature.text for feature in browser.find_elements(By.CLASS_NAME, "twad414")]
    else:
        # If unsuccessful, try to scrape features from the main page
        return [feature.text for feature in
                browser.find_elements(By.XPATH, "//div[contains(@class, 'amenities')]//div[contains(@class, 'title')]")]


def scrape_house_details(browser):
    logging.info(f"Scraped the details about the AirBnB.")
    return [details.text for details in browser.find_elements(By.CLASS_NAME, "l7n4lsf")]


def scrape_place_details(browser, url):
    browser.get(url)
    time.sleep(5)  # Wait for page to load

    place = {"url": url, "title": get_text_or_empty(browser, By.TAG_NAME, "h1"),
             "picture_url": get_attribute_or_empty(browser, By.CLASS_NAME, "i1ezuexe", "src"),
             "description": get_text_or_empty(browser, By.CLASS_NAME, "l1h825yc"),
             "price": get_price(browser, By.CLASS_NAME, "_j1kt73"),
             "rating": get_text_or_empty(browser, By.CLASS_NAME, "r1dxllyb"),
             "location": get_text_or_empty(browser, By.CLASS_NAME, "s1qk96pm"),  # _152qbzi
             "features": scrape_features(browser),
             "house_details": scrape_house_details(browser)}

    # Scrape the features

    logging.info(f"Scraped details for: {place['title']}")
    return place


def scrape_region(browser, region, country):
    logging.info(f"Scraping listings for {region}, {country}")
    place_urls = get_place_urls(browser, f"{region}, {country}")
    region_listings = []
    for url in place_urls:
        details = scrape_place_details(browser, url)
        details['region'] = region
        details['country'] = country
        region_listings.append(details)

    # Write the listings for this region to the database
    inserted_ids = db.insert_many_into_collection(DB_NAME, COLLECTION_NAME, region_listings)
    logging.info(f"Inserted {len(inserted_ids)} listings for {region}, {country}")

    return len(inserted_ids)


# Route handlers
@app.route('/scrape-north-america', methods=['GET'])
def scrape_north_america():
    browser = initialize_browser()
    try:
        total_listings = 0
        canada_listings = 0
        us_listings = 0

        # Scrape Canadian provinces
        for province in CANADIAN_PROVINCES:
            canada_listings += scrape_region(browser, province, "Canada")
            total_listings += canada_listings

        # Scrape US states
        for state in US_STATES:
            us_listings += scrape_region(browser, state, "USA")
            total_listings += us_listings

        return jsonify({
            "message": "Scraping completed",
            "total_listings": total_listings,
            "canada_listings": canada_listings,
            "us_listings": us_listings,
        })
    except Exception as e:
        logger.error(f"An error occurred while scraping: {e}")
        return jsonify({"error": "Failed to scrape listings"}), 500
    finally:
        browser.quit()


@app.route('/scrape-city-data', methods=['GET'])
def get_city_data():
    city = request.args.get('city')
    if not city:
        return jsonify({"error": "City parameter is required"}), 400

    browser = initialize_browser()
    try:
        place_urls = get_place_urls(browser, city)
        place_details = []
        for url in place_urls:
            logging.info(f"Getting details for: {url}")

            details = scrape_place_details(browser, url)
            place_details.append(details)

        inserted_ids = db.insert_many_into_collection(DB_NAME, COLLECTION_NAME, place_details)

        return jsonify({
            "city": city,
            "places": json.loads(dumps(place_details)),
            "inserted_ids": inserted_ids
        })
    finally:
        browser.quit()


# Route handlers with fixes
@app.route('/get-listings', methods=['GET'])
def get_listings():
    city = request.args.get('city')
    limit = int(request.args.get('limit', 0))

    query = {}
    if city:
        query["location"] = {"$regex": city, "$options": "i"}

    try:
        # Get listings from database
        listings = db.get_listings(DB_NAME, COLLECTION_NAME, query, limit)

        # Convert to JSON using bson dumps to handle ObjectId correctly
        listings_json = json.loads(dumps(listings))

        return jsonify(listings_json)
    except Exception as e:
        logger.error(f"An error occurred while fetching listings: {e}")
        return jsonify({"error": "Failed to fetch listings"}), 500


@app.route('/filters', methods=['GET'])
def get_filters():
    search_term = request.args.get('search', '')
    features = request.args.get('features', '').split(',') if request.args.get('features') else []
    limit = int(request.args.get('limit', 10))

    query = {}
    if search_term:
        query["location"] = {"$regex": search_term, "$options": "i"}
    if features:
        query["features"] = {"$all": features}

    try:
        filters_result = db.get_filters(DB_NAME, COLLECTION_NAME, query, limit)
        # Convert to JSON properly
        filters_json = json.loads(dumps(filters_result))
        return jsonify(filters_json)
    except Exception as e:
        logger.error(f"An error occurred while fetching filters: {e}")
        return jsonify({"error": "Failed to fetch filters"}), 500


@app.route('/get-listing/<listing_id>', methods=['GET'])
def get_listing(listing_id):
    try:
        listing = db.get_listing_by_id(DB_NAME, COLLECTION_NAME, listing_id)
        if listing:
            # Convert to JSON properly
            listing_json = json.loads(dumps(listing))
            return jsonify(listing_json)
        else:
            return jsonify({"error": "Listing not found"}), 404
    except Exception as e:
        logger.error(f"An error occurred while fetching the listing: {e}")
        return jsonify({"error": "Failed to fetch the listing"}), 500


# Enhanced search API
@app.route('/search', methods=['GET'])
def search_listings():
    # Extract search parameters
    location = request.args.get('location', '')
    check_in = request.args.get('checkIn', '')
    check_out = request.args.get('checkOut', '')
    guests = request.args.get('guests', '')
    price_min = request.args.get('priceMin', '')
    price_max = request.args.get('priceMax', '')
    property_type = request.args.getlist('propertyType')
    amenities = request.args.getlist('amenities')
    limit = request.args.get('limit', '')

    # Parse numeric parameters
    try:
        guests = int(guests) if guests else None
        price_min = float(price_min) if price_min else None
        price_max = float(price_max) if price_max else None
        limit_num = int(limit) if limit else None
    except ValueError:
        return jsonify({"error": "Invalid numeric parameter"}), 400

    # Build query
    query = {}
    if location:
        query["location"] = {"$regex": location, "$options": "i"}

    # Price filter
    if price_min is not None or price_max is not None:
        query["price"] = {}
        if price_min is not None:
            query["price"]["$gte"] = price_min
        if price_max is not None:
            query["price"]["$lte"] = price_max

    # Property type filter
    if property_type:
        query["property_type"] = {"$in": property_type}

    # Amenities filter
    if amenities:
        query["features"] = {"$all": amenities}

    # Pagination parameters
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('pageSize', 20))

    try:
        # If db_extensions is causing issues, use the regular db module
        # Get total count - simple approach
        collection = db.get_collection(DB_NAME, COLLECTION_NAME)
        total_count = collection.count_documents(query)

        # Calculate pagination
        skip = (page - 1) * per_page
        per_page_limit = limit_num if limit_num and limit_num < per_page else per_page
        total_pages = (total_count + per_page_limit - 1) // per_page_limit

        # Get listings with pagination
        cursor = collection.find(query).skip(skip).limit(per_page_limit)
        listings = list(cursor)

        # Format response - use dumps to handle ObjectId serialization
        response = {
            "listings": json.loads(dumps(listings)),
            "totalCount": total_count,
            "pageCount": total_pages,
            "currentPage": page
        }

        return jsonify(response)
    except Exception as e:
        logger.error(f"An error occurred during search: {e}")
        return jsonify({"error": f"Failed to perform search: {str(e)}"}), 500

# Add an info endpoint to check configuration
@app.route('/info', methods=['GET'])
def get_info():
    if config.ENV == 'development':
        return jsonify({
            "environment": config.ENV,
            "host": config.HOST,
            "port": config.PORT,
            "cors_origins": config.CORS_ORIGINS
        })
    return jsonify({
        "environment": config.ENV,
        "status": "running"
    })


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "environment": config.ENV
    }), 200


if __name__ == "__main__":
    logger.info(f"Starting {config.ENV} server on {config.HOST}:{config.PORT}")
    logger.info(f"CORS origins: {config.CORS_ORIGINS}")

    if config.ENV == 'development':
        # Use Flask's development server
        app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
    else:
        # Use waitress for production
        serve(app, host=config.HOST, port=config.PORT, threads=6)
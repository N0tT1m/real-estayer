import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string[];
  amenities?: string[];
  rooms?: number;
  bathrooms?: number;
  instantBook?: boolean;
  superhost?: boolean;
  category?: string;
}

export interface SearchResults {
  listings: any[];
  totalCount: number;
  pageCount: number;
  suggestions?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  search(filters: SearchFilters, page: number = 1, pageSize: number = 20): Observable<SearchResults> {
    // Build query parameters
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    // Add filters to parameters
    if (filters.location) {
      params = params.set('location', filters.location);
    }

    if (filters.checkIn) {
      params = params.set('checkIn', filters.checkIn);
    }

    if (filters.checkOut) {
      params = params.set('checkOut', filters.checkOut);
    }

    if (filters.guests) {
      params = params.set('guests', filters.guests.toString());
    }

    if (filters.priceMin !== undefined) {
      params = params.set('priceMin', filters.priceMin.toString());
    }

    if (filters.priceMax !== undefined) {
      params = params.set('priceMax', filters.priceMax.toString());
    }

    if (filters.propertyType && filters.propertyType.length) {
      filters.propertyType.forEach(type => {
        params = params.append('propertyType', type);
      });
    }

    if (filters.amenities && filters.amenities.length) {
      filters.amenities.forEach(amenity => {
        params = params.append('amenities', amenity);
      });
    }

    if (filters.rooms !== undefined) {
      params = params.set('rooms', filters.rooms.toString());
    }

    if (filters.bathrooms !== undefined) {
      params = params.set('bathrooms', filters.bathrooms.toString());
    }

    if (filters.instantBook !== undefined) {
      params = params.set('instantBook', filters.instantBook.toString());
    }

    if (filters.superhost !== undefined) {
      params = params.set('superhost', filters.superhost.toString());
    }

    if (filters.category) {
      params = params.set('category', filters.category);
    }

    // In a real application, this would be an API call
    // return this.http.get<SearchResults>(`${this.apiUrl}/search`, { params })
    //  .pipe(catchError(this.handleError));

    // For development, return mock data
    return of(this.getMockSearchResults(filters)).pipe(
      map(results => ({
        ...results,
        listings: results.listings.slice((page - 1) * pageSize, page * pageSize)
      }))
    );
  }

  getSuggestions(query: string): Observable<string[]> {
    // In a real application, this would be an API call
    // return this.http.get<string[]>(`${this.apiUrl}/suggestions`, {
    //   params: new HttpParams().set('q', query)
    // }).pipe(catchError(this.handleError));

    // For development, return mock suggestions
    if (!query) return of([]);

    const allSuggestions = [
      'New York', 'New Orleans', 'Los Angeles', 'San Francisco', 'Miami',
      'Chicago', 'Seattle', 'Boston', 'Denver', 'Austin',
      'Paris', 'London', 'Rome', 'Barcelona', 'Tokyo',
      'Beach getaway', 'Mountain retreat', 'City break', 'Countryside escape'
    ];

    const filteredSuggestions = allSuggestions.filter(
      suggestion => suggestion.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    return of(filteredSuggestions);
  }

  getPopularSearches(): Observable<string[]> {
    // In a real application, this would be an API call
    // return this.http.get<string[]>(`${this.apiUrl}/popular-searches`)
    //  .pipe(catchError(this.handleError));

    // For development, return mock data
    return of([
      'Beach houses', 'Mountain cabins', 'Lakefront rentals',
      'City apartments', 'Unique stays', 'Pet-friendly'
    ]);
  }

  saveSearchHistory(query: string): Observable<any> {
    // In a real application, this would be an API call
    // return this.http.post<any>(`${this.apiUrl}/search-history`, { query })
    //  .pipe(catchError(this.handleError));

    // For development, just return success
    console.log('Search saved:', query);
    return of({ success: true });
  }

  getSearchHistory(): Observable<string[]> {
    // In a real application, this would be an API call
    // return this.http.get<string[]>(`${this.apiUrl}/search-history`)
    //  .pipe(catchError(this.handleError));

    // For development, return mock data
    return of([
      'Beach houses in Florida',
      'Mountain retreats for 4 guests',
      'Paris apartments with balcony',
      'Pet-friendly cabins in Colorado'
    ]);
  }

  clearSearchHistory(): Observable<any> {
    // In a real application, this would be an API call
    // return this.http.delete<any>(`${this.apiUrl}/search-history`)
    //  .pipe(catchError(this.handleError));

    // For development, just return success
    console.log('Search history cleared');
    return of({ success: true });
  }

  // Helper method to handle errors
  private handleError(error: any) {
    console.error('An error occurred:', error);
    return of({ listings: [], totalCount: 0, pageCount: 0 });
  }

  // Mock data for development purposes
  private getMockSearchResults(filters: SearchFilters): SearchResults {
    // Generate mock listings based on filters
    const mockListings = Array(50).fill(0).map((_, i) => {
      const isSuperhost = Math.random() > 0.7;
      const instantBook = Math.random() > 0.5;

      // Generate random price within filter range or default range
      const minPrice = filters.priceMin || 50;
      const maxPrice = filters.priceMax || 500;
      const price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;

      // Generate random number of rooms and bathrooms
      const rooms = Math.floor(Math.random() * 5) + 1;
      const bathrooms = Math.floor(Math.random() * 3) + 1;

      // Generate random property type
      const propertyTypes = ['Apartment', 'House', 'Villa', 'Condo', 'Cabin', 'Cottage'];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];

      // Generate random amenities
      const allAmenities = [
        'Wi-Fi', 'Air conditioning', 'Kitchen', 'Washer', 'Dryer', 'Pool',
        'Hot tub', 'Free parking', 'Gym', 'TV', 'Heating', 'Elevator',
        'Pets allowed', 'Smoking allowed', 'Wheelchair accessible'
      ];
      const amenitiesCount = Math.floor(Math.random() * 8) + 3; // 3-10 amenities
      const amenities = [...allAmenities].sort(() => 0.5 - Math.random()).slice(0, amenitiesCount);

      // Generate random location
      const locations = [
        'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL',
        'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Austin, TX',
        'Denver, CO', 'New Orleans, LA', 'Paris, France', 'London, UK'
      ];
      const location = filters.location || locations[Math.floor(Math.random() * locations.length)];

      // Generate rating
      const rating = (Math.random() * 2 + 3).toFixed(2); // 3.00-5.00

      return {
        id: `listing-${i + 1}`,
        title: `${propertyType} in ${location.split(',')[0]}`,
        description: `Beautiful ${rooms} bedroom ${propertyType.toLowerCase()} in ${location} with amazing views.`,
        price: price,
        priceUnit: 'night',
        location: location,
        image: `assets/listing-${(i % 10) + 1}.jpg`,
        images: Array(5).fill(0).map((_, j) => `assets/listing-${(i % 10) + 1}-${j + 1}.jpg`),
        rooms: rooms,
        bathrooms: bathrooms,
        maxGuests: rooms * 2,
        propertyType: propertyType,
        amenities: amenities,
        isSuperhost: isSuperhost,
        instantBook: instantBook,
        rating: parseFloat(rating),
        reviewCount: Math.floor(Math.random() * 100) + 5,
        coordinates: {
          lat: (Math.random() * 180) - 90,
          lng: (Math.random() * 360) - 180
        }
      };
    });

    // Apply filters
    let filteredListings = [...mockListings];

    if (filters.location) {
      filteredListings = filteredListings.filter(listing =>
        listing.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters.guests) {
      filteredListings = filteredListings.filter(listing =>
        listing.maxGuests >= filters.guests!
      );
    }

    if (filters.priceMin !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.price >= filters.priceMin!
      );
    }

    if (filters.priceMax !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.price <= filters.priceMax!
      );
    }

    if (filters.propertyType && filters.propertyType.length) {
      filteredListings = filteredListings.filter(listing =>
        filters.propertyType!.includes(listing.propertyType)
      );
    }

    if (filters.rooms !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.rooms >= filters.rooms!
      );
    }

    if (filters.bathrooms !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.bathrooms >= filters.bathrooms!
      );
    }

    if (filters.instantBook !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.instantBook === filters.instantBook
      );
    }

    if (filters.superhost !== undefined) {
      filteredListings = filteredListings.filter(listing =>
        listing.isSuperhost === filters.superhost
      );
    }

    if (filters.amenities && filters.amenities.length) {
      filteredListings = filteredListings.filter(listing =>
        filters.amenities!.every(amenity =>
          listing.amenities.includes(amenity)
        )
      );
    }

    return {
      listings: filteredListings,
      totalCount: filteredListings.length,
      pageCount: Math.ceil(filteredListings.length / 20),
      suggestions: this.getLocationSuggestions(filters.location || '')
    };
  }

  private getLocationSuggestions(query: string): string[] {
    if (!query) return [];

    const locations = [
      'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Miami, FL',
      'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Austin, TX',
      'Denver, CO', 'New Orleans, LA', 'Paris, France', 'London, UK'
    ];

    return locations
      .filter(location => location.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  }
}

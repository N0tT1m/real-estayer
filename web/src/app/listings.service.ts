import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Listing interface
export interface Listing {
  id?: string;
  title: string;
  location: string;
  price: string;
  rating?: number;  // Changed to number to match component interface
  reviewCount?: number;
  picture_url?: string;
  description?: string;
  country?: string;
  region?: string;
  features?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  hostName?: string;
}

// Search options interface
export interface SearchOptions {
  q?: string;  // Added 'q' property to match usage in component
  location?: string;
  category?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  minPrice?: number;
  maxPrice?: number;
}

// Response interface for paginated results
export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  pageCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = 'api/listings';

  constructor(private http: HttpClient) { }

  // Get list of featured or recommended listings
  getFeaturedListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.apiUrl}/featured`).pipe(
      catchError(this.handleError<Listing[]>('getFeaturedListings', []))
    );
  }

  // Get a single listing by ID
  getListing(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError<Listing>('getListing'))
    );
  }

  // Get listings with optional search term and limit
  getListings(searchTerm: string, limit?: number): Observable<Listing[]> {
    let url = `${this.apiUrl}`;
    if (searchTerm) {
      url += `/search?q=${encodeURIComponent(searchTerm)}`;
    }
    if (limit) {
      url += `${searchTerm ? '&' : '?'}limit=${limit}`;
    }

    return this.http.get<Listing[]>(url).pipe(
      catchError(this.handleError<Listing[]>('getListings', []))
    );
  }

  // Search listings with various filters
  searchListings(options: SearchOptions): Observable<ListingsResponse> {
    // Convert options object to query parameters
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        params.append(key, value.toString());
      }
    });

    return this.http.get<ListingsResponse>(`${this.apiUrl}/search?${params.toString()}`).pipe(
      catchError(this.handleError<ListingsResponse>('searchListings', {
        listings: [],
        total: 0,
        page: 1,
        pageCount: 0
      }))
    );
  }

  // Get listings by category
  getListingsByCategory(category: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.apiUrl}/category/${category}`).pipe(
      catchError(this.handleError<Listing[]>('getListingsByCategory', []))
    );
  }

  // Get listings by location
  getListingsByLocation(location: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.apiUrl}/location/${location}`).pipe(
      catchError(this.handleError<Listing[]>('getListingsByLocation', []))
    );
  }

  // Error handling function
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Return a safe result (empty array or object) to keep the application running
      return of(result as T);
    };
  }
}

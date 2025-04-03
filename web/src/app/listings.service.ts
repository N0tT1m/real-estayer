// src/app/listings.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

export interface Listing {
  _id: string;
  url: string;
  title: string;
  picture_url: string;
  description: string;
  price: string;
  rating: string;
  location: string;
  features: string[];
  house_details: string[];
  region?: string;
  country?: string;
  state?: string;
  province?: string;
}

export interface SearchResponse {
  listings: Listing[];
  totalCount: number;
  pageCount: number;
  currentPage: number;
}

export interface SearchOptions {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string[];
  amenities?: string[];
  page?: number;
  pageSize?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Fixed error handler that returns an Observable
  private handleError(error: any) {
    console.error('API error in listing service', error);
    return throwError(() => error);
  }

  getListings(searchTerm?: string, limit?: number): Observable<any> {
    let params = new HttpParams();

    if (searchTerm) {
      params = params.set('city', searchTerm);
    }

    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http.get(`${this.apiUrl}/get-listings`, { params })
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  scrapeNorthAmerica(): Observable<any> {
    return this.http.get(`${this.apiUrl}/scrape-north-america`)
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  scrapeCity(city: string): Observable<any> {
    let params = new HttpParams().set('city', city);

    return this.http.get(`${this.apiUrl}/scrape-city-data`, { params })
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  searchListings(options: SearchOptions): Observable<SearchResponse> {
    let params = new HttpParams();

    // Add string parameters
    if (options.location) params = params.set('location', options.location);
    if (options.checkIn) params = params.set('checkIn', options.checkIn);
    if (options.checkOut) params = params.set('checkOut', options.checkOut);

    // Add number parameters
    if (options.guests) params = params.set('guests', options.guests.toString());
    if (options.priceMin) params = params.set('priceMin', options.priceMin.toString());
    if (options.priceMax) params = params.set('priceMax', options.priceMax.toString());
    if (options.page) params = params.set('page', options.page.toString());
    if (options.pageSize) params = params.set('pageSize', options.pageSize.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());

    // Handle array parameters
    if (options.propertyType && options.propertyType.length > 0) {
      options.propertyType.forEach((type: string) => {
        params = params.append('propertyType', type);
      });
    }

    if (options.amenities && options.amenities.length > 0) {
      options.amenities.forEach((amenity: string) => {
        params = params.append('amenities', amenity);
      });
    }

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params })
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }

  getListingById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-listing/${id}`)
      .pipe(
        catchError((error) => this.handleError(error))
      );
  }
}

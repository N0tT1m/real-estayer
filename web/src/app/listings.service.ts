// src/services/listing.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getListings(searchTerm?: string, limit?: number): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
    };

    const options = {
      headers: headers,
      rejectUnauthorized: false,
    };

    let url = `${this.apiUrl}/get-listings`;
    const params: string[] = [];

    if (searchTerm) {
      params.push(`city=${encodeURIComponent(searchTerm)}`);
    }

    if (limit) {
      params.push(`limit=${limit}`);
    }

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get(url, options);
  }

  scrapeNorthAmerica(): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
    };

    const options = {
      headers: headers,
      rejectUnauthorized: false,
    };

    return this.http.get(`${this.apiUrl}/scrape-north-america`, options);
  }

  scrapeCity(city: string): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
    };

    const options = {
      headers: headers,
      rejectUnauthorized: false,
    };

    return this.http.get(`${this.apiUrl}/scrape-city-data?city=${encodeURIComponent(city)}`, options);
  }

  searchListings(params: any): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
    };

    const options = {
      headers: headers,
      rejectUnauthorized: false,
      params: params
    };

    return this.http.get(`${this.apiUrl}/search`, options);
  }

  getListingById(id: string): Observable<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE',
    };

    const options = {
      headers: headers,
      rejectUnauthorized: false,
    };

    return this.http.get(`${this.apiUrl}/get-listing/${id}`, options);
  }
}

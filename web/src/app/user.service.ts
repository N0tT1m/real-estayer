import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Interface for saved listings
export interface SavedListing {
  id: string;
  title: string;
  image: string;
  location: string;
  price: string;
  rating?: number;    // Added to match template usage
}

// Interface for trip information
export interface Trip {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  totalPrice: string;
}

// Interface for user profile updates
export interface ProfileUpdateRequest {
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
}

// Interface for notification options
export interface NotificationOption {
  id: number;
  title: string;
  description: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'api/user'; // Base API URL for user-related endpoints

  constructor(private http: HttpClient) { }

  // Get user profile information
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      catchError(this.handleError('getProfile', {}))
    );
  }

  // Update user profile information
  updateProfile(profileData: ProfileUpdateRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile`, profileData).pipe(
      catchError(this.handleError('updateProfile', {}))
    );
  }

  // Get user's trips
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.apiUrl}/trips`).pipe(
      catchError(this.handleError('getTrips', []))
    );
  }

  // Get user's saved listings
  getSavedListings(): Observable<SavedListing[]> {
    return this.http.get<SavedListing[]>(`${this.apiUrl}/saved`).pipe(
      catchError(this.handleError('getSavedListings', []))
    );
  }

  // Save an experience/listing
  saveExperience(id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/saved`, { listingId: id }).pipe(
      catchError(this.handleError('saveExperience', {}))
    );
  }

  // Unsave an experience/listing
  unsaveExperience(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/saved/${id}`).pipe(
      catchError(this.handleError('unsaveExperience', {}))
    );
  }

  // Change user password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(this.handleError('changePassword', {}))
    );
  }

  // Get user's payment methods
  getPaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payment-methods`).pipe(
      catchError(this.handleError('getPaymentMethods', []))
    );
  }

  // Set default payment method
  setDefaultPaymentMethod(paymentId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/payment-methods/${paymentId}/default`, {}).pipe(
      catchError(this.handleError('setDefaultPaymentMethod', {}))
    );
  }

  // Remove a payment method
  removePaymentMethod(paymentId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/payment-methods/${paymentId}`).pipe(
      catchError(this.handleError('removePaymentMethod', {}))
    );
  }

  // Update notification preferences
  updateNotificationPreferences(options: NotificationOption[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications`, { options }).pipe(
      catchError(this.handleError('updateNotificationPreferences', {}))
    );
  }

  // Request account deletion
  requestAccountDeletion(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/deletion-request`, {}).pipe(
      catchError(this.handleError('requestAccountDeletion', {}))
    );
  }

  // Error handling function
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Return a safe result (empty object/array) to keep the application running
      return of(result as T);
    };
  }
}

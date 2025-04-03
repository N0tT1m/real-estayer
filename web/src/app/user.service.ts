import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  joinDate: string;
  isHost: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
}

interface NotificationPreference {
  id: number;
  title: string;
  description: string;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5000/api/users';  // Adjust to your backend URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get the current user's profile
  getProfile(): Observable<UserProfile> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    return of(this.getMockUserProfile()).pipe(
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.get<UserProfile>(`${this.apiUrl}/profile`)
    //   .pipe(catchError(this.handleError));
  }

  // Update the user's profile
  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock updated data
    return of({
      ...this.getMockUserProfile(),
      ...profile
    }).pipe(
      tap(() => console.log('Profile updated')),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profile)
    //   .pipe(catchError(this.handleError));
  }

  // Get user's saved listings
  getSavedListings(): Observable<any[]> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    return of(this.getMockSavedListings()).pipe(
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.get<any[]>(`${this.apiUrl}/saved-listings`)
    //   .pipe(catchError(this.handleError));
  }

  // Get user's trips/bookings
  getTrips(): Observable<any[]> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    return of(this.getMockTrips()).pipe(
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.get<any[]>(`${this.apiUrl}/trips`)
    //   .pipe(catchError(this.handleError));
  }

  // Get user's payment methods
  getPaymentMethods(): Observable<PaymentMethod[]> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    return of(this.getMockPaymentMethods()).pipe(
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.get<PaymentMethod[]>(`${this.apiUrl}/payment-methods`)
    //   .pipe(catchError(this.handleError));
  }

  // Add a new payment method
  addPaymentMethod(paymentMethod: any): Observable<PaymentMethod> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    const newPaymentMethod: PaymentMethod = {
      id: 'pm_' + Math.random().toString(36).substr(2, 9),
      type: paymentMethod.type,
      last4: paymentMethod.cardNumber.substr(-4),
      expMonth: paymentMethod.expMonth,
      expYear: paymentMethod.expYear,
      isDefault: this.getMockPaymentMethods().length === 0 ? true : false
    };

    return of(newPaymentMethod).pipe(
      tap(() => console.log('Payment method added')),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.post<PaymentMethod>(`${this.apiUrl}/payment-methods`, paymentMethod)
    //   .pipe(catchError(this.handleError));
  }

  // Set default payment method
  setDefaultPaymentMethod(paymentMethodId: string): Observable<any> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return success response
    return of({ success: true }).pipe(
      tap(() => console.log(`Payment method ${paymentMethodId} set as default`)),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.put<any>(`${this.apiUrl}/payment-methods/${paymentMethodId}/set-default`, {})
    //   .pipe(catchError(this.handleError));
  }

  // Remove a payment method
  removePaymentMethod(paymentMethodId: string): Observable<any> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return success response
    return of({ success: true }).pipe(
      tap(() => console.log(`Payment method ${paymentMethodId} removed`)),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.delete<any>(`${this.apiUrl}/payment-methods/${paymentMethodId}`)
    //   .pipe(catchError(this.handleError));
  }

  // Get notification preferences
  getNotificationPreferences(): Observable<NotificationPreference[]> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return mock data
    return of(this.getMockNotificationPreferences()).pipe(
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.get<NotificationPreference[]>(`${this.apiUrl}/notification-preferences`)
    //   .pipe(catchError(this.handleError));
  }

  // Update notification preferences
  updateNotificationPreferences(preferences: NotificationPreference[]): Observable<NotificationPreference[]> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return updated preferences
    return of(preferences).pipe(
      tap(() => console.log('Notification preferences updated')),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.put<NotificationPreference[]>(`${this.apiUrl}/notification-preferences`, preferences)
    //   .pipe(catchError(this.handleError));
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return success response
    return of({ success: true }).pipe(
      tap(() => console.log('Password changed')),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.put<any>(`${this.apiUrl}/change-password`, { currentPassword, newPassword })
    //   .pipe(catchError(this.handleError));
  }

  // Request account deletion
  requestAccountDeletion(): Observable<any> {
    // Check if auth token exists
    if (!this.authService.token) {
      return throwError('User not authenticated');
    }

    // In a real app, this would be an API call
    // For now, return success response
    return of({ success: true }).pipe(
      tap(() => console.log('Account deletion requested')),
      catchError(this.handleError)
    );

    // Real implementation would be:
    // return this.http.post<any>(`${this.apiUrl}/delete-account-request`, {})
    //   .pipe(catchError(this.handleError));
  }

  // Helper method to handle errors
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (typeof error === 'string') {
      // Error message as string
      errorMessage = error;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(errorMessage);
  }

  // Mock data for development purposes
  private getMockUserProfile(): UserProfile {
    return {
      id: 'user123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '555-123-4567',
      profileImage: 'assets/sample-user.jpg',
      bio: 'Travel enthusiast and adventure seeker. Love exploring new places and meeting locals.',
      joinDate: '2023-01-15',
      isHost: true
    };
  }

  private getMockSavedListings(): any[] {
    return [
      {
        id: '201',
        title: 'Luxury Apartment with Ocean View',
        image: 'assets/saved-1.jpg',
        location: 'Miami, FL',
        price: '$199/night'
      },
      {
        id: '202',
        title: 'Cozy Cottage in the Woods',
        image: 'assets/saved-2.jpg',
        location: 'Portland, OR',
        price: '$120/night'
      }
    ];
  }

  private getMockTrips(): any[] {
    return [
      {
        id: '1',
        listingId: '101',
        listingTitle: 'Beachfront Villa',
        listingImage: 'assets/listing-1.jpg',
        location: 'Malibu, CA',
        checkIn: '2025-05-10',
        checkOut: '2025-05-15',
        guests: 2,
        status: 'upcoming',
        totalPrice: '$1,250'
      },
      {
        id: '2',
        listingId: '102',
        listingTitle: 'Mountain Cabin',
        listingImage: 'assets/listing-2.jpg',
        location: 'Aspen, CO',
        checkIn: '2024-12-15',
        checkOut: '2024-12-22',
        guests: 4,
        status: 'completed',
        totalPrice: '$1,890'
      },
      {
        id: '3',
        listingId: '103',
        listingTitle: 'Downtown Loft',
        listingImage: 'assets/listing-3.jpg',
        location: 'New York, NY',
        checkIn: '2024-09-05',
        checkOut: '2024-09-08',
        guests: 2,
        status: 'cancelled',
        totalPrice: '$680'
      }
    ];
  }

  private getMockPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'pm_1',
        type: 'Visa',
        last4: '4242',
        expMonth: '12',
        expYear: '2025',
        isDefault: true
      },
      {
        id: 'pm_2',
        type: 'Mastercard',
        last4: '5555',
        expMonth: '08',
        expYear: '2026',
        isDefault: false
      }
    ];
  }

  private getMockNotificationPreferences(): NotificationPreference[] {
    return [
      { id: 1, title: 'Email Notifications', description: 'Receive booking confirmations and updates via email', enabled: true },
      { id: 2, title: 'SMS Notifications', description: 'Receive text messages for important updates', enabled: false },
      { id: 3, title: 'Marketing Emails', description: 'Receive deals, discounts, and travel inspiration', enabled: true },
      { id: 4, title: 'Reminder Notifications', description: 'Get reminders about upcoming trips or hosting duties', enabled: true }
    ];
  }
}

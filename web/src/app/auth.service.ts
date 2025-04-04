import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  phone?: string;
  bio?: string;
  isHost?: boolean;
  isCreator?: boolean;
  joinDate?: Date;
  expiryDate?: string;
  expMonth?: string;
  expYear?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Use the appropriate URL based on your setup
  private apiUrl = 'http://localhost:5000/auth'; // Direct URL
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const userData = localStorage.getItem('userData');
    const token = localStorage.getItem('token');

    if (userData && token) {
      const user = JSON.parse(userData);
      this.currentUserSubject.next(user);

      // Check token expiration
      const tokenExpiration = localStorage.getItem('tokenExpiration');
      if (tokenExpiration) {
        const expirationDate = new Date(tokenExpiration);
        this.autoLogout(expirationDate.getTime() - new Date().getTime());
      }
    }
  }

  login(email: string, password: string): Observable<any> {
    console.log('Login attempt for:', email);

    // Standard headers for JSON API
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    // Make the API call
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      { email, password },
      { headers }
    ).pipe(
      tap(response => {
        console.log('Login successful:', response);
        this.handleAuthentication(response);
      }),
      catchError(error => {
        console.error('Login error:', error);
        return this.handleError(error);
      })
    );
  }

  signup(name: string, email: string, password: string): Observable<any> {
    console.log('Attempting to sign up:', { name, email });

    // Standard headers for JSON API
    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    console.log('Sending signup request to:', `${this.apiUrl}/signup`);
    console.log('With data:', { name, email, password: '********' });

    return this.http.post<AuthResponse>(
      `${this.apiUrl}/signup`,
      { name, email, password },
      { headers }
    ).pipe(
      tap(response => {
        console.log('Signup successful:', response);
        this.handleAuthentication(response);
      }),
      catchError(error => {
        console.error('Signup error:', error);
        console.error('Error details:', error.message, error.status, error.statusText);
        if (error.error) {
          console.error('Server response:', error.error);
        }
        return this.handleError(error);
      })
    );
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiration');

    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    this.router.navigate(['/']);
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return localStorage.getItem('token');
  }

  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  // Add JWT token to requests that need authentication
  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    if (token) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Example of an authenticated request
  getUserProfile(): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/user`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Update user details after profile changes
  updateUserDetails(user: User): void {
    // Update stored user data
    localStorage.setItem('userData', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private handleAuthentication(response: AuthResponse) {
    // Set expiration to 1 hour from now
    const expirationDate = new Date(new Date().getTime() + 3600 * 1000);

    localStorage.setItem('userData', JSON.stringify(response.user));
    localStorage.setItem('token', response.token);
    localStorage.setItem('tokenExpiration', expirationDate.toISOString());

    this.currentUserSubject.next(response.user);
    this.autoLogout(3600 * 1000);
  }

  private handleError(error: any) {
    console.error('API error in auth service', error);

    let errorMessage = 'An unknown error occurred!';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please check your connection.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied. You may not have permission to perform this action.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    }

    return throwError(() => errorMessage);
  }
}

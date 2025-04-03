// src/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/auth';
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
    // For development without a backend, use mock data
    if (email === 'demo@example.com' && password === 'password') {
      const mockUser = {
        id: 'user-1',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'user'
      };

      const mockResponse = {
        message: 'Login successful',
        token: 'mock-jwt-token',
        user: mockUser
      };

      this.handleAuthentication(mockResponse);
      return of(mockResponse);
    }

    // If not using mock data, make actual API call
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => this.handleAuthentication(response)),
        catchError(this.handleError)
      );
  }

  signup(name: string, email: string, password: string): Observable<any> {
    // For development without a backend, use mock data
    if (email.includes('@example.com')) {
      const mockUser = {
        id: 'user-' + Math.floor(Math.random() * 1000),
        name,
        email,
        role: 'user'
      };

      const mockResponse = {
        message: 'User registered successfully',
        token: 'mock-jwt-token',
        user: mockUser
      };

      this.handleAuthentication(mockResponse);
      return of(mockResponse);
    }

    // If not using mock data, make actual API call
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, { name, email, password })
      .pipe(
        tap(response => this.handleAuthentication(response)),
        catchError(this.handleError)
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
    let errorMessage = 'An unknown error occurred!';

    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => errorMessage);
  }
}

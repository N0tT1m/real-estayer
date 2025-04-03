import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get the auth token
    const token = this.authService.token;

    // Clone the request and add the token if available
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Handle the request and catch any errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle authentication errors (401)
        if (error.status === 401) {
          // The token might be expired, so log the user out
          this.authService.logout();
          this.router.navigate(['/login']);
        }

        // Handle forbidden errors (403)
        if (error.status === 403) {
          this.router.navigate(['/']); // Navigate to home or a forbidden page
        }

        // Handle server errors
        if (error.status >= 500) {
          console.error('Server error:', error);
        }

        // Forward the error
        return throwError(() => error);
      })
    );
  }
}

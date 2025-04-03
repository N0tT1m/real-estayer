import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      // Check if the route requires admin role
      const requiresAdmin = route.data['requiresAdmin'] === true;

      if (requiresAdmin && !this.authService.isAdmin()) {
        // If user is not an admin but route requires admin access
        this.router.navigate(['/']);
        return false;
      }

      return true;
    }

    // Store the attempted URL for redirecting after login
    localStorage.setItem('returnUrl', state.url);

    // Navigate to login page
    this.router.navigate(['/login']);
    return false;
  }
}

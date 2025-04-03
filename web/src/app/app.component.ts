import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgIf } from "@angular/common";
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgIf],
  template: `
    <div class="app-container">
      <header class="site-header">
        <nav class="nav-bar">
          <div class="nav-container">
            <a routerLink="/" class="nav-logo">
              <span class="logo-icon">🏡</span> RealEstayer
            </a>

            <div class="nav-search">
              <div class="search-input-container">
                <input
                  type="text"
                  placeholder="Search destinations..."
                  class="nav-search-input"
                  [routerLink]="['/listings']"
                  [queryParams]="{search: searchQuery}"
                  (keyup.enter)="navigateToSearch()">
                <button class="search-button" (click)="navigateToSearch()">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                  </svg>
                </button>
              </div>
            </div>

            <ul class="nav-links">
              <li><a routerLink="/home" routerLinkActive="active">Home</a></li>
              <li><a routerLink="/listings" routerLinkActive="active">Listings</a></li>
              <li><a routerLink="/destinations" routerLinkActive="active">Destinations</a></li>
              <li><a routerLink="/planner" routerLinkActive="active">Trip Planner</a></li>
            </ul>

            <div class="nav-auth">
              <ng-container *ngIf="!isAuthenticated; else loggedIn">
                <a routerLink="/login" class="nav-login">Login</a>
                <a routerLink="/signup" class="nav-signup">Sign Up</a>
              </ng-container>

              <ng-template #loggedIn>
                <div class="user-menu-container">
                  <button class="user-menu-trigger" (click)="toggleUserMenu()">
                    <img [src]="userProfileImage || 'assets/default-user.png'" alt="User" class="user-avatar">
                    <span class="user-name">{{ userName }}</span>
                    <svg viewBox="0 0 24 24" width="18" height="18" [class.open]="isUserMenuOpen">
                      <path d="M7 10l5 5 5-5z"/>
                    </svg>
                  </button>

                  <div class="user-dropdown" *ngIf="isUserMenuOpen">
                    <a routerLink="/profile" class="dropdown-item">My Profile</a>
                    <a routerLink="/planner" class="dropdown-item">My Trips</a>
                    <a routerLink="/listings?saved=true" class="dropdown-item">Saved Places</a>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item logout" (click)="logout()">Logout</button>
                  </div>
                </div>
              </ng-template>
            </div>
          </div>
        </nav>
      </header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'RealEstayer';
  searchQuery: string = '';
  isUserMenuOpen: boolean = false;
  isAuthenticated: boolean = false;
  userName: string = '';
  userProfileImage: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.isAuthenticated = !!user;
      if (user) {
        this.userName = user.name;
        this.userProfileImage = ''; // Would be set from user profile
      }
    });

    // Close user menu when clicking outside
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-menu-container') && this.isUserMenuOpen) {
        this.isUserMenuOpen = false;
      }
    });
  }

  toggleUserMenu(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.authService.logout();
    this.isUserMenuOpen = false;
  }

  navigateToSearch() {
    // This would use Router for navigation with the search query
    // implemented in your actual application
    console.log('Searching for:', this.searchQuery);
  }
}

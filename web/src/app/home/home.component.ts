import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { NgFor, NgIf, AsyncPipe, NgClass } from '@angular/common';
import { ListingService } from '../listings.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, AsyncPipe, NgClass, FormsModule],
  template: `
    <!-- Hero Section with a new theme and identity -->
    <div class="home-container">
      <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>Wander Wisely with TravelNest</h1>
          <p>Discover adventures, not just accommodations</p>

          <div class="search-container">
            <form [formGroup]="searchForm" (ngSubmit)="onSearch()">
              <div class="search-fields">
                <div class="search-field">
                  <label for="location">Discover</label>
                  <input type="text" id="location" formControlName="location" placeholder="Where to?">
                </div>

                <div class="search-field">
                  <label for="checkIn">Arrive</label>
                  <input type="date" id="checkIn" formControlName="checkIn">
                </div>

                <div class="search-field">
                  <label for="checkOut">Depart</label>
                  <input type="date" id="checkOut" formControlName="checkOut">
                </div>

                <div class="search-field">
                  <label for="guests">Travelers</label>
                  <select id="guests" formControlName="guests">
                    <option value="1">Solo traveler</option>
                    <option value="2">Duo</option>
                    <option value="3">Small group (3)</option>
                    <option value="4">Group (4)</option>
                    <option value="5">Large group (5+)</option>
                  </select>
                </div>
              </div>

              <button type="submit" class="search-button">
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                Discover
              </button>
            </form>
          </div>
        </div>
      </section>

      <!-- Reimagined Services Tabs -->
      <section class="services-tabs">
        <div class="tabs-container">
          <div class="tab" [ngClass]="{'active': activeTab === 'experiences'}" (click)="setActiveTab('experiences')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"/>
            </svg>
            <span>Experiences</span>
          </div>

          <div class="tab" [ngClass]="{'active': activeTab === 'journeys'}" (click)="setActiveTab('journeys')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M2.5 19h19v2h-19v-2zm19.57-9.36c-.21-.8-1.04-1.28-1.84-1.06L14.92 10l-6.9-6.43-1.93.51 4.14 7.17-4.97 1.33-1.97-1.54-1.45.39 2.59 4.49s7.12-1.9 16.57-4.43c.81-.23 1.28-1.05 1.07-1.85z"/>
            </svg>
            <span>Journeys</span>
          </div>

          <div class="tab" [ngClass]="{'active': activeTab === 'transport'}" (click)="setActiveTab('transport')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            <span>Transport</span>
          </div>

          <div class="tab" [ngClass]="{'active': activeTab === 'adventures'}" (click)="setActiveTab('adventures')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
            </svg>
            <span>Adventures</span>
          </div>
        </div>
      </section>

      <!-- Featured Destinations with new language -->
      <section class="featured-destinations">
        <h2>Discover Hidden Gems</h2>
        <p>Explore unique locations curated by travel enthusiasts</p>
        <div class="destinations-grid">
          <div class="destination-card" *ngFor="let destination of featuredDestinations" (click)="exploreDestination(destination.name)">
            <div class="destination-image">
              <img [src]="destination.image" [alt]="destination.name">
              <div class="destination-overlay">
                <h3>{{ destination.name }}</h3>
                <p>{{ destination.propertyCount }}+ unique experiences</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works with a distinct approach -->
      <section class="how-it-works">
        <h2>How TravelNest Works</h2>
        <div class="steps-container">
          <div class="step">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z"/>
              </svg>
            </div>
            <h3>Discover</h3>
            <p>Find authentic experiences, guided adventures, and local stays</p>
          </div>

          <div class="step">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/>
              </svg>
            </div>
            <h3>Personalize</h3>
            <p>Create a customized journey that matches your travel style</p>
          </div>

          <div class="step">
            <div class="step-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path d="M19 1H5c-1.1 0-1.99.9-1.99 2L3 15.93c0 .69.35 1.3.88 1.66L12 23l8.11-5.41c.53-.36.88-.97.88-1.66L21 3c0-1.1-.9-2-2-2zm-9 15l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z"/>
              </svg>
            </div>
            <h3>Experience</h3>
            <p>Immerse yourself in authentic adventures with local connections</p>
          </div>
        </div>
      </section>

      <!-- Recent Listings with updated terminology -->
      <section class="featured-listings">
        <h2>Trending Experiences</h2>
        <p>Hand-selected adventures you won't find elsewhere</p>

        <div class="listings-grid" *ngIf="!loading">
          <div class="listing-card" *ngFor="let listing of featuredListings">
            <div class="listing-image">
              <img [src]="listing.picture_url || 'assets/images/placeholder.jpg'" [alt]="listing.title">
              <div class="listing-rating" *ngIf="listing.rating">
                <span class="rating-icon">★</span>
                <span class="rating-value">{{ listing.rating }}</span>
              </div>
              <div class="listing-badge">
                <span class="badge-text">TravelNest Verified</span>
              </div>
            </div>
            <div class="listing-details">
              <h3>{{ listing.title }}</h3>
              <p class="listing-location">{{ listing.location }}</p>
              <p class="listing-price">{{ listing.price }} / night</p>
              <button class="view-details-button" (click)="viewListing(listing._id)">View Adventure</button>
            </div>
          </div>
        </div>

        <div class="loading-indicator" *ngIf="loading">
          <div class="spinner"></div>
          <p>Finding perfect adventures for you...</p>
        </div>
      </section>

      <!-- Travel Planning with TravelNest specific approach -->
      <section class="travel-planning">
        <div class="planning-content">
          <h2>Your Journey, Your Way</h2>
          <p>TravelNest helps you craft memorable journeys with local expertise</p>
          <ul class="planning-features">
            <li>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Discover authentic experiences from local experts</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Connect with global adventure curators</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Navigate seamlessly with our transport network</span>
            </li>
            <li>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <span>Build custom adventure itineraries</span>
            </li>
          </ul>
          <button class="planning-button" (click)="navigateToPlanner()">Start Your Journey</button>
        </div>
        <div class="planning-image">
          <img src="assets/images/travel-planning.jpg" alt="Journey Planning">
        </div>
      </section>

      <!-- Updated Travel Categories -->
      <section class="top-experiences">
        <h2>Adventure Styles</h2>
        <div class="categories-grid">
          <div class="category-card" (click)="filterByCategory('coastal')">
            <div class="category-image">
              <img src="assets/images/beach.jpg" alt="Coastal Escapes">
            </div>
            <h3>Coastal Escapes</h3>
            <p>Beyond ordinary beaches</p>
          </div>

          <div class="category-card" (click)="filterByCategory('alpine')">
            <div class="category-image">
              <img src="assets/images/mountain.jpg" alt="Alpine Expeditions">
            </div>
            <h3>Alpine Expeditions</h3>
            <p>Conquer heights and vistas</p>
          </div>

          <div class="category-card" (click)="filterByCategory('urban')">
            <div class="category-image">
              <img src="assets/images/city.jpg" alt="Urban Discoveries">
            </div>
            <h3>Urban Discoveries</h3>
            <p>Authentic local experiences</p>
          </div>

          <div class="category-card" (click)="filterByCategory('rural')">
            <div class="category-image">
              <img src="assets/images/countryside.jpg" alt="Rural Immersions">
            </div>
            <h3>Rural Immersions</h3>
            <p>Connect with landscapes</p>
          </div>
        </div>
      </section>

      <!-- App Download revised for TravelNest -->
      <section class="app-download">
        <div class="app-content">
          <h2>TravelNest At Your Fingertips</h2>
          <p>Download our app to discover, plan and share adventures anywhere</p>
          <div class="app-buttons">
            <a href="#" class="app-button">
              <img src="assets/images/app-store.svg" alt="App Store">
              <span>App Store</span>
            </a>
            <a href="#" class="app-button">
              <img src="assets/images/google-play.svg" alt="Google Play">
              <span>Google Play</span>
            </a>
          </div>
        </div>
        <div class="app-image">
          <img src="assets/images/app-mockup.png" alt="TravelNest Mobile App">
        </div>
      </section>

      <!-- Newsletter with TravelNest identity -->
      <section class="newsletter">
        <div class="newsletter-content">
          <h2>Join the Adventure Community</h2>
          <p>Subscribe for insider travel discoveries and expedition planning tips</p>
          <form class="newsletter-form" (ngSubmit)="subscribeNewsletter()">
            <input type="email" placeholder="Your email address" [(ngModel)]="newsletterEmail" name="email">
            <button type="submit">Join the Journey</button>
          </form>
        </div>
      </section>
    </div>

    <!-- Modified Footer -->
    <footer>
      <div class="container">
        <div class="footer-nav">
          <!-- Explore Section -->
          <div class="footer-section">
            <h2>Discover</h2>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/all-experiences">All Experiences</a></li>
              <li><a href="/destinations">Destinations</a></li>
              <li><a href="/journey-planner">Journey Planner</a></li>
            </ul>
          </div>

          <!-- Host Section now "Create" -->
          <div class="footer-section">
            <h2>Create</h2>
            <ul>
              <li><a href="/become-creator">Become a Creator</a></li>
              <li><a href="/creator-resources">Creator Resources</a></li>
              <li><a href="/community-forum">Community Forum</a></li>
              <li><a href="/creator-standards">Creator Standards</a></li>
            </ul>
          </div>

          <!-- Support Section -->
          <div class="footer-section">
            <h2>Support</h2>
            <ul>
              <li><a href="/help-center">Help Center</a></li>
              <li><a href="/safety-information">Safety Information</a></li>
              <li><a href="/cancellation-options">Cancellation Options</a></li>
              <li><a href="/contact-us">Contact Us</a></li>
            </ul>
          </div>

          <!-- Legal Section -->
          <div class="footer-section">
            <h2>Legal</h2>
            <ul>
              <li><a href="/terms">Terms of Service</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/cookies">Cookie Policy</a></li>
              <li><a href="/sitemap">Site Map</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <div class="currency-selector">
            <select>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
              <option value="JPY">¥ JPY</option>
              <option value="AUD">$ AUD</option>
              <option value="CAD">$ CAD</option>
            </select>
          </div>

          <p class="copyright">© 2025 TravelNest. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  searchForm = new FormGroup({
    location: new FormControl(''),
    checkIn: new FormControl(''),
    checkOut: new FormControl(''),
    guests: new FormControl('2')
  });

  loading = false;
  featuredListings: any[] = [];
  newsletterEmail = '';
  activeTab = 'stays'; // Default tab

  featuredDestinations = [
    { name: 'New York', image: 'assets/images/newyork.jpg', propertyCount: 1245 },
    { name: 'Los Angeles', image: 'assets/images/losangeles.jpg', propertyCount: 978 },
    { name: 'Miami', image: 'assets/images/miami.jpg', propertyCount: 865 },
    { name: 'Chicago', image: 'assets/images/chicago.jpg', propertyCount: 723 },
    { name: 'San Francisco', image: 'assets/images/sanfrancisco.jpg', propertyCount: 689 },
    { name: 'Las Vegas', image: 'assets/images/lasvegas.jpg', propertyCount: 542 }
  ];

  constructor(
    private router: Router,
    private listingService: ListingService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadFeaturedListings();
    this.setDefaultDates();
  }

  setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    this.searchForm.patchValue({
      checkIn: this.formatDate(tomorrow),
      checkOut: this.formatDate(nextWeek)
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadFeaturedListings() {
    this.loading = true;
    this.listingService.getListings('', 6)
      .subscribe({
        next: (data) => {
          this.featuredListings = data;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading featured listings:', error);
          this.loading = false;
          // Fallback to sample data if API fails
          this.loadSampleListings();
        }
      });
  }

  loadSampleListings() {
    this.featuredListings = [
      {
        _id: '1',
        title: 'Luxury Beachfront Villa',
        location: 'Malibu, California',
        price: '$450',
        rating: '4.9',
        picture_url: 'assets/images/listing1.jpg'
      },
      {
        _id: '2',
        title: 'Modern Downtown Apartment',
        location: 'Manhattan, New York',
        price: '$210',
        rating: '4.7',
        picture_url: 'assets/images/listing2.jpg'
      },
      {
        _id: '3',
        title: 'Rustic Mountain Cabin',
        location: 'Aspen, Colorado',
        price: '$275',
        rating: '4.8',
        picture_url: 'assets/images/listing3.jpg'
      },
      {
        _id: '4',
        title: 'Charming Historic Townhouse',
        location: 'Charleston, South Carolina',
        price: '$190',
        rating: '4.6',
        picture_url: 'assets/images/listing4.jpg'
      },
      {
        _id: '5',
        title: 'Lakefront Retreat',
        location: 'Lake Tahoe, Nevada',
        price: '$320',
        rating: '4.9',
        picture_url: 'assets/images/listing5.jpg'
      },
      {
        _id: '6',
        title: 'Urban Loft with City Views',
        location: 'Chicago, Illinois',
        price: '$175',
        rating: '4.7',
        picture_url: 'assets/images/listing6.jpg'
      }
    ];
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  onSearch() {
    const searchParams = this.searchForm.value;
    this.router.navigate(['/listings'], {
      queryParams: {
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests
      }
    });
  }

  filterByCategory(category: string) {
    this.router.navigate(['/listings'], {
      queryParams: { category: category }
    });
  }

  exploreDestination(destination: string) {
    this.router.navigate(['/listings'], {
      queryParams: { location: destination }
    });
  }

  viewListing(id: string) {
    this.router.navigate(['/listing', id]);
  }

  navigateToPlanner() {
    this.router.navigate(['/planner']);
  }

  subscribeNewsletter() {
    // Here you would typically call an API to subscribe the email
    if (this.newsletterEmail) {
      alert(`Thank you for subscribing with ${this.newsletterEmail}!`);
      this.newsletterEmail = '';
    }
  }
}

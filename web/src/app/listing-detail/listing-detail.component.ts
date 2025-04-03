import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CityDataService } from '../city-data.service';
import { NgIf, NgFor, AsyncPipe, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ReviewsComponent } from '../reviews/reviews.component';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, DatePipe, HttpClientModule, FormsModule, ReviewsComponent],
  providers: [CityDataService],
  template: `
    <div class="listing-detail-container" *ngIf="listing">
      <div class="listing-header">
        <h1 class="listing-title">{{ listing.title }}</h1>
        <div class="listing-location">
          <span class="location-text">{{ listing.location }}</span>
          <div class="listing-rating" *ngIf="listing.rating">
            <span class="star-icon">★</span>
            <span class="rating-value">{{ listing.rating }}</span>
          </div>
        </div>
      </div>

      <div class="listing-gallery">
        <img [src]="listing.picture_url" alt="{{ listing.title }}" class="main-image">
      </div>

      <div class="listing-details-grid">
        <div class="listing-main-info">
          <div class="details-tabs">
            <div class="tab-header">
              <button
                class="tab-button"
                [class.active]="activeTab === 'details'"
                (click)="activeTab = 'details'">
                Details
              </button>
              <button
                class="tab-button"
                [class.active]="activeTab === 'reviews'"
                (click)="activeTab = 'reviews'">
                Reviews
              </button>
            </div>

            <div class="tab-content">
              <div class="details-content" *ngIf="activeTab === 'details'">
                <div class="detail-section">
                  <h3>Description</h3>
                  <p>{{ listing.description }}</p>
                </div>

                <div class="detail-section" *ngIf="listing.features?.length">
                  <h3>Amenities</h3>
                  <ul class="amenities-list">
                    <li *ngFor="let feature of listing.features">{{ feature }}</li>
                  </ul>
                </div>
              </div>

              <div class="reviews-content" *ngIf="activeTab === 'reviews'">
                <app-reviews [listingId]="listingId"></app-reviews>
              </div>
            </div>
          </div>
        </div>

        <div class="booking-sidebar">
          <div class="price-card">
            <h2 class="price">{{ listing.price }}</h2>
            <div class="booking-form">
              <div class="date-pickers">
                <div class="date-range">
                  <label>Check-in</label>
                  <input type="date" [(ngModel)]="checkInDate" class="date-input">
                </div>
                <div class="date-range">
                  <label>Check-out</label>
                  <input type="date" [(ngModel)]="checkOutDate" class="date-input">
                </div>
              </div>

              <div class="guests-selector">
                <label>Guests</label>
                <select [(ngModel)]="guestCount" class="guest-input">
                  <option *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]" [value]="i">{{ i }} guest{{ i > 1 ? 's' : '' }}</option>
                </select>
              </div>

              <button class="reserve-button" (click)="bookNow()">Reserve</button>

              <div class="pricing-details">
                <div class="price-row">
                  <span>{{ listing.price }} x {{ nightsStay }} nights</span>
                  <span>{{ totalNightPrice }}</span>
                </div>
                <div class="price-row">
                  <span>Cleaning fee</span>
                  <span>{{ cleaningFee }}</span>
                </div>
                <div class="price-row">
                  <span>Service fee</span>
                  <span>{{ serviceFee }}</span>
                </div>
                <div class="price-row total">
                  <span>Total</span>
                  <span>{{ totalPrice }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-container" *ngIf="!listing">
      <div class="loading-spinner"></div>
      <p>Loading listing details...</p>
    </div>
  `,
  styleUrls: ['./listing-detail.component.sass', '../app.component.sass']
})
export class ListingDetailComponent implements OnInit {
  listingId: string = '';
  listing: any = null;
  checkInDate: string = '';
  checkOutDate: string = '';
  guestCount: number = 1;
  activeTab: 'details' | 'reviews' = 'details';

  constructor(
    private route: ActivatedRoute,
    private cityDataService: CityDataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.listingId = params.get('id') || '';
      if (this.listingId) {
        this.loadListingDetails();
      }
    });

    // Set default dates (today and tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    this.checkInDate = today.toISOString().split('T')[0];
    this.checkOutDate = tomorrow.toISOString().split('T')[0];
  }

  loadListingDetails() {
    this.cityDataService.getListingById(this.listingId).subscribe({
      next: (data) => {
        this.listing = data;
      },
      error: (error) => {
        console.error('Error loading listing details:', error);
      }
    });
  }

  get nightsStay(): number {
    if (!this.checkInDate || !this.checkOutDate) return 1;

    const checkIn = new Date(this.checkInDate);
    const checkOut = new Date(this.checkOutDate);
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 1;
  }

  get basePrice(): number {
    if (!this.listing || !this.listing.price) return 0;

    // Extract numeric price from string like "$150 per night"
    const priceMatch = this.listing.price.match(/\$?(\d+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  get totalNightPrice(): string {
    const total = this.basePrice * this.nightsStay;
    return `$${total}`;
  }

  get cleaningFee(): string {
    // Sample cleaning fee
    return '$50';
  }

  get serviceFee(): string {
    // Sample service fee calculation (10% of total night price)
    const fee = Math.round(this.basePrice * this.nightsStay * 0.1);
    return `$${fee}`;
  }

  get totalPrice(): string {
    const nightsTotal = this.basePrice * this.nightsStay;
    const cleaningFeeAmount = 50;
    const serviceFeeAmount = Math.round(nightsTotal * 0.1);

    const total = nightsTotal + cleaningFeeAmount + serviceFeeAmount;
    return `$${total}`;
  }

  bookNow() {
    // Booking logic would go here
    alert(`Booking request submitted for ${this.nightsStay} nights (${this.checkInDate} to ${this.checkOutDate}) with ${this.guestCount} guests. Total: ${this.totalPrice}`);
  }
}

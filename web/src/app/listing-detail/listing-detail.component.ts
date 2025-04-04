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
    <div class="adventure-detail-container" *ngIf="adventure">
      <div class="adventure-header">
        <h1 class="adventure-title">{{ adventure.title }}</h1>
        <div class="adventure-location">
          <span class="location-text">{{ adventure.location }}</span>
          <div class="adventure-rating" *ngIf="adventure.rating">
            <span class="star-icon">★</span>
            <span class="rating-value">{{ adventure.rating }}</span>
          </div>
        </div>
      </div>

      <!-- Rest of your template stays the same -->
    </div>

    <div class="loading-container" *ngIf="!adventure">
      <div class="loading-spinner"></div>
      <p>Finding your amazing experience...</p>
    </div>
  `,
  styleUrls: ['./listing-detail.component.sass', '../app.component.sass']
})
export class ListingDetailComponent implements OnInit {
  listingId: string = '';
  adventure: any = null; // Changed from 'listing' to 'adventure'
  checkInDate: string = '';
  checkOutDate: string = '';
  travelerCount: number = 1; // Changed from 'guestCount'
  activeTab: 'details' | 'reviews' = 'details';

  // Add additional properties for the template
  experienceFee: string = '$25';
  serviceFee: string = '$15';
  nightsStay: number = 1;
  totalNightPrice: string = '$0';
  totalPrice: string = '$0';
  adventureId: string = '';
  similarAdventures: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private cityDataService: CityDataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.listingId = params.get('id') || '';
      this.adventureId = this.listingId; // Set adventureId same as listingId
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

    // Initialize similar adventures
    this.similarAdventures = [
      {
        id: '1',
        title: 'Mountain Hiking Adventure',
        location: 'Alps, Switzerland',
        image: 'assets/images/adventure-1.jpg',
        price: '$79 per person',
        rating: 4.8,
        reviewCount: 42
      },
      {
        id: '2',
        title: 'Coastal Kayaking Tour',
        location: 'Dubrovnik, Croatia',
        image: 'assets/images/adventure-2.jpg',
        price: '$65 per person',
        rating: 4.6,
        reviewCount: 28
      },
      {
        id: '3',
        title: 'Cultural Walking Tour',
        location: 'Kyoto, Japan',
        image: 'assets/images/adventure-3.jpg',
        price: '$45 per person',
        rating: 4.9,
        reviewCount: 53
      }
    ];
  }

  loadListingDetails() {
    this.cityDataService.getListingById(this.listingId).subscribe({
      next: (data) => {
        this.adventure = data; // Store as adventure instead of listing
        this.updatePricingDetails(); // Calculate pricing after getting listing data
      },
      error: (error) => {
        console.error('Error loading listing details:', error);
      }
    });
  }

  get basePrice(): number {
    if (!this.adventure || !this.adventure.price) return 0;

    // Extract numeric price from string like "$150 per night"
    const priceMatch = this.adventure.price.match(/\$?(\d+)/);
    return priceMatch ? parseFloat(priceMatch[1]) : 0;
  }

  updatePricingDetails() {
    const nightsTotal = this.basePrice * this.nightsStay;
    this.totalNightPrice = `$${nightsTotal}`;

    const cleaningFeeAmount = 25; // Experience fee
    const serviceFeeAmount = Math.round(nightsTotal * 0.1);
    this.experienceFee = `$${cleaningFeeAmount}`;
    this.serviceFee = `$${serviceFeeAmount}`;

    const total = nightsTotal + cleaningFeeAmount + serviceFeeAmount;
    this.totalPrice = `$${total}`;
  }

  bookNow() {
    // Booking logic would go here
    alert(`Booking request submitted for ${this.nightsStay} nights (${this.checkInDate} to ${this.checkOutDate}) with ${this.travelerCount} travelers. Total: ${this.totalPrice}`);
  }
}

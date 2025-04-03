import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { UserService } from '../user.service';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';

interface Trip {
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

interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  guestName: string;
  guestEmail: string;
}

interface SavedListing {
  id: string;
  title: string;
  image: string;
  location: string;
  price: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, MatTabsModule, DatePipe, NgClass, RouterLink],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <div class="user-info">
          <img [src]="profileImage || 'assets/default-user.png'" alt="Profile picture" class="profile-picture">
          <div class="user-details">
            <h1>{{ user?.name }}</h1>
            <p>Member since {{ user?.joinDate | date:'mediumDate' }}</p>
            <div class="user-stats">
              <div class="stat">
                <span class="stat-value">{{ tripsCount }}</span>
                <span class="stat-label">Trips</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ listingsCount }}</span>
                <span class="stat-label">Listings</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ savedCount }}</span>
                <span class="stat-label">Saved</span>
              </div>
            </div>
          </div>
        </div>
        <button class="edit-profile-button" (click)="showEditProfile = !showEditProfile">
          {{ showEditProfile ? 'Cancel' : 'Edit Profile' }}
        </button>
      </div>

      <div class="edit-profile-form" *ngIf="showEditProfile">
        <h2>Edit Profile</h2>
        <form [formGroup]="profileForm" (ngSubmit)="onProfileSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label for="name">Full Name</label>
              <input type="text" id="name" formControlName="name" class="form-control">
              <div class="error-message" *ngIf="submitted && pf['name'].errors">
                <div *ngIf="pf['name'].errors['required']">Name is required</div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" formControlName="email" class="form-control">
              <div class="error-message" *ngIf="submitted && pf['email'].errors">
                <div *ngIf="pf['email'].errors['required']">Email is required</div>
                <div *ngIf="pf['email'].errors['email']">Please enter a valid email</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="phone">Phone Number</label>
              <input type="tel" id="phone" formControlName="phone" class="form-control">
            </div>

            <div class="form-group">
              <label for="profileImage">Profile Picture URL</label>
              <input type="text" id="profileImage" formControlName="profileImage" class="form-control">
            </div>
          </div>

          <div class="form-group full-width">
            <label for="bio">Bio</label>
            <textarea id="bio" formControlName="bio" class="form-control textarea"></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-button" [disabled]="loading">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <mat-tab-group>
        <mat-tab label="Trips">
          <div class="tabs-content">
            <div class="filter-buttons">
              <button
                class="filter-button"
                [class.active]="tripFilter === 'all'"
                (click)="tripFilter = 'all'">
                All
              </button>
              <button
                class="filter-button"
                [class.active]="tripFilter === 'upcoming'"
                (click)="tripFilter = 'upcoming'">
                Upcoming
              </button>
              <button
                class="filter-button"
                [class.active]="tripFilter === 'completed'"
                (click)="tripFilter = 'completed'">
                Completed
              </button>
              <button
                class="filter-button"
                [class.active]="tripFilter === 'cancelled'"
                (click)="tripFilter = 'cancelled'">
                Cancelled
              </button>
            </div>

            <div class="trips-list" *ngIf="filteredTrips.length; else noTrips">
              <div class="trip-card" *ngFor="let trip of filteredTrips">
                <img [src]="trip.listingImage" alt="{{ trip.listingTitle }}" class="trip-image">
                <div class="trip-details">
                  <h3>{{ trip.listingTitle }}</h3>
                  <p class="trip-location">{{ trip.location }}</p>
                  <p class="trip-dates">{{ trip.checkIn | date:'mediumDate' }} - {{ trip.checkOut | date:'mediumDate' }}</p>
                  <p class="trip-guests">{{ trip.guests }} {{ trip.guests > 1 ? 'guests' : 'guest' }}</p>
                  <p class="trip-price">{{ trip.totalPrice }}</p>
                  <div class="trip-status" [class]="trip.status">{{ trip.status }}</div>
                  <div class="trip-actions">
                    <button class="trip-button view">View Details</button>
                    <button
                      class="trip-button cancel"
                      *ngIf="trip.status === 'upcoming'"
                      (click)="cancelTrip(trip.id)">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <ng-template #noTrips>
              <div class="no-results">
                <p>You don't have any {{ tripFilter !== 'all' ? tripFilter : '' }} trips.</p>
                <button routerLink="/listings" class="action-button">Find a place to stay</button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="Saved">
          <div class="tabs-content">
            <div class="saved-listings" *ngIf="savedListings.length; else noSaved">
              <div class="listing-card" *ngFor="let listing of savedListings">
                <div class="card-actions">
                  <button class="remove-saved" (click)="removeSaved(listing.id)">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                <img [src]="listing.image" alt="{{ listing.title }}" class="listing-image">
                <div class="listing-details">
                  <h3>{{ listing.title }}</h3>
                  <p class="listing-location">{{ listing.location }}</p>
                  <p class="listing-price">{{ listing.price }}</p>
                  <a [routerLink]="['/listings', listing.id]" class="view-listing">View Details</a>
                </div>
              </div>
            </div>

            <ng-template #noSaved>
              <div class="no-results">
                <p>You haven't saved any listings yet.</p>
                <button routerLink="/listings" class="action-button">Explore listings</button>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="My Listings" *ngIf="isHost">
          <div class="tabs-content">
            <div class="my-listings-header">
              <h2>My Properties</h2>
              <button routerLink="/host/new-listing" class="action-button">Add New Property</button>
            </div>

            <div class="filter-buttons">
              <button
                class="filter-button"
                [class.active]="bookingFilter === 'all'"
                (click)="bookingFilter = 'all'">
                All Bookings
              </button>
              <button
                class="filter-button"
                [class.active]="bookingFilter === 'confirmed'"
                (click)="bookingFilter = 'confirmed'">
                Confirmed
              </button>
              <button
                class="filter-button"
                [class.active]="bookingFilter === 'pending'"
                (click)="bookingFilter = 'pending'">
                Pending
              </button>
            </div>

            <div class="bookings-list" *ngIf="filteredBookings.length; else noBookings">
              <div class="booking-card" *ngFor="let booking of filteredBookings">
                <img [src]="booking.listingImage" alt="{{ booking.listingTitle }}" class="booking-image">
                <div class="booking-details">
                  <h3>{{ booking.listingTitle }}</h3>
                  <p class="booking-dates">{{ booking.checkIn | date:'mediumDate' }} - {{ booking.checkOut | date:'mediumDate' }}</p>
                  <p class="booking-guest">{{ booking.guestName }} ({{ booking.guests }} {{ booking.guests > 1 ? 'guests' : 'guest' }})</p>
                  <p class="booking-contact">{{ booking.guestEmail }}</p>
                  <div class="booking-status" [class]="booking.status">{{ booking.status }}</div>
                  <div class="booking-actions" *ngIf="booking.status === 'pending'">
                    <button class="booking-button approve" (click)="approveBooking(booking.id)">Approve</button>
                    <button class="booking-button reject" (click)="rejectBooking(booking.id)">Decline</button>
                  </div>
                </div>
              </div>
            </div>

            <ng-template #noBookings>
              <div class="no-results" *ngIf="isHost">
                <p>You don't have any {{ bookingFilter !== 'all' ? bookingFilter : '' }} bookings.</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab label="Account Settings">
          <div class="tabs-content">
            <div class="settings-section">
              <h2>Change Password</h2>
              <form [formGroup]="passwordForm" (ngSubmit)="onPasswordSubmit()">
                <div class="form-group">
                  <label for="currentPassword">Current Password</label>
                  <input type="password" id="currentPassword" formControlName="currentPassword" class="form-control">
                  <div class="error-message" *ngIf="passwordSubmitted && passwordF['currentPassword'].errors">
                    <div *ngIf="passwordF['currentPassword'].errors['required']">Current password is required</div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="newPassword">New Password</label>
                  <input type="password" id="newPassword" formControlName="newPassword" class="form-control">
                  <div class="error-message" *ngIf="passwordSubmitted && passwordF['newPassword'].errors">
                    <div *ngIf="passwordF['newPassword'].errors['required']">New password is required</div>
                    <div *ngIf="passwordF['newPassword'].errors['minlength']">Password must be at least 6 characters</div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="confirmPassword">Confirm Password</label>
                  <input type="password" id="confirmPassword" formControlName="confirmPassword" class="form-control">
                  <div class="error-message" *ngIf="passwordSubmitted && passwordF['confirmPassword'].errors">
                    <div *ngIf="passwordF['confirmPassword'].errors['required']">Please confirm your password</div>
                    <div *ngIf="passwordF['confirmPassword'].errors['mustMatch']">Passwords must match</div>
                  </div>
                </div>

                <div class="form-actions">
                  <button type="submit" class="save-button" [disabled]="passwordLoading">
                    {{ passwordLoading ? 'Updating...' : 'Update Password' }}
                  </button>
                </div>
              </form>
            </div>

            <div class="settings-section">
              <h2>Payment Methods</h2>
              <div class="payment-methods">
                <div class="payment-card" *ngFor="let card of paymentMethods">
                  <div class="card-info">
                    <div class="card-type" [class]="card.type.toLowerCase()">{{ card.type }}</div>
                    <div class="card-number">•••• •••• •••• {{ card.last4 }}</div>
                    <div class="card-expiry">Expires {{ card.expMonth }}/{{ card.expYear }}</div>
                  </div>
                  <div class="card-actions">
                    <button class="card-button default" *ngIf="!card.isDefault" (click)="setDefaultPayment(card.id)">
                      Make Default
                    </button>
                    <div class="default-badge" *ngIf="card.isDefault">Default</div>
                    <button class="card-button remove" (click)="removePaymentMethod(card.id)">Remove</button>
                  </div>
                </div>

                <button class="add-payment-button">Add Payment Method</button>
              </div>
            </div>

            <div class="settings-section">
              <h2>Notification Preferences</h2>
              <div class="notification-settings">
                <div class="notification-option" *ngFor="let option of notificationOptions">
                  <div class="option-info">
                    <h3>{{ option.title }}</h3>
                    <p>{{ option.description }}</p>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [checked]="option.enabled" (change)="toggleNotification(option.id)">
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <button class="save-preferences-button" (click)="saveNotificationPreferences()">Save Preferences</button>
            </div>

            <div class="settings-section danger-zone">
              <h2>Danger Zone</h2>
              <button class="danger-button" (click)="confirmDeleteAccount()">Delete Account</button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['user-profile.component.sass', '../app.component.sass']
})
export class UserProfileComponent implements OnInit {
  // User data
  user: any = null;
  profileImage: string = '';
  isHost: boolean = false;

  // Form states
  showEditProfile: boolean = false;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  submitted: boolean = false;
  passwordSubmitted: boolean = false;
  loading: boolean = false;
  passwordLoading: boolean = false;

  // Trip data
  trips: Trip[] = [];
  tripFilter: 'all' | 'upcoming' | 'completed' | 'cancelled' = 'all';

  // Saved listings
  savedListings: SavedListing[] = [];

  // Host data
  bookings: Booking[] = [];
  bookingFilter: 'all' | 'confirmed' | 'pending' = 'all';

  // Payment methods
  paymentMethods: any[] = [];

  // Notification settings
  notificationOptions = [
    { id: 1, title: 'Email Notifications', description: 'Receive booking confirmations and updates via email', enabled: true },
    { id: 2, title: 'SMS Notifications', description: 'Receive text messages for important updates', enabled: false },
    { id: 3, title: 'Marketing Emails', description: 'Receive deals, discounts, and travel inspiration', enabled: true },
    { id: 4, title: 'Reminder Notifications', description: 'Get reminders about upcoming trips or hosting duties', enabled: true }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.profileForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      profileImage: [''],
      bio: ['']
    });

    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.mustMatch('newPassword', 'confirmPassword')
    });
  }

  ngOnInit() {
    // Get current user
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.user = {
          ...user,
          joinDate: new Date('2023-01-15') // Example data
        };

        // Load user profile data
        this.loadUserProfile();

        // Check if user is a host
        this.checkIfHost();

        // Load user's trips
        this.loadTrips();

        // Load saved listings
        this.loadSavedListings();

        // If user is host, load bookings
        if (this.isHost) {
          this.loadBookings();
        }

        // Load payment methods
        this.loadPaymentMethods();
      }
    });
  }

  // Convenience getters for form fields
  get pf() { return this.profileForm.controls; }
  get passwordF() { return this.passwordForm.controls; }

  // Form validation
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  // Load user profile data
  loadUserProfile() {
    // In a real app, you would get this from your user service
    this.profileImage = 'assets/sample-user.jpg';

    // Populate form with user data
    this.profileForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: '555-123-4567', // Example data
      profileImage: this.profileImage,
      bio: 'Travel enthusiast and adventure seeker. Love exploring new places and meeting locals.' // Example data
    });
  }

  // Check if user is a host
  checkIfHost() {
    // This would be a service call in a real app
    this.isHost = true; // Example data
  }

  // Load user trips
  loadTrips() {
    // This would be a service call in a real app
    this.trips = [
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

  // Load saved listings
  loadSavedListings() {
    // This would be a service call in a real app
    this.savedListings = [
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

  // Load bookings (for hosts)
  loadBookings() {
    // This would be a service call in a real app
    this.bookings = [
      {
        id: '301',
        listingId: '401',
        listingTitle: 'Beach House',
        listingImage: 'assets/booking-1.jpg',
        checkIn: '2025-06-10',
        checkOut: '2025-06-15',
        guests: 3,
        status: 'confirmed',
        guestName: 'John Smith',
        guestEmail: 'john.smith@example.com'
      },
      {
        id: '302',
        listingId: '401',
        listingTitle: 'Beach House',
        listingImage: 'assets/booking-1.jpg',
        checkIn: '2025-07-01',
        checkOut: '2025-07-05',
        guests: 2,
        status: 'pending',
        guestName: 'Emma Johnson',
        guestEmail: 'emma.j@example.com'
      }
    ];
  }

  // Load payment methods
  loadPaymentMethods() {
    // This would be a service call in a real app
    this.paymentMethods = [
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

  // Form submissions
  onProfileSubmit() {
    this.submitted = true;

    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;

    // In a real app, you would call your user service here
    setTimeout(() => {
      // Update user data
      this.user.name = this.pf['name'].value;
      this.user.email = this.pf['email'].value;
      this.profileImage = this.pf['profileImage'].value;

      this.loading = false;
      this.showEditProfile = false;

      // Show success message
      alert('Profile updated successfully!');
    }, 1000);
  }

  onPasswordSubmit() {
    this.passwordSubmitted = true;

    if (this.passwordForm.invalid) {
      return;
    }

    this.passwordLoading = true;

    // In a real app, you would call your auth service here
    setTimeout(() => {
      this.passwordLoading = false;
      this.passwordForm.reset();
      this.passwordSubmitted = false;

      // Show success message
      alert('Password updated successfully!');
    }, 1000);
  }

  // Trip management
  get filteredTrips() {
    if (this.tripFilter === 'all') {
      return this.trips;
    }
    return this.trips.filter(trip => trip.status === this.tripFilter);
  }

  cancelTrip(tripId: string) {
    if (confirm('Are you sure you want to cancel this trip?')) {
      // In a real app, you would call your trip service here
      const tripIndex = this.trips.findIndex(t => t.id === tripId);
      if (tripIndex > -1) {
        this.trips[tripIndex].status = 'cancelled';
      }
    }
  }

  // Saved listings management
  removeSaved(listingId: string) {
    if (confirm('Remove this listing from your saved list?')) {
      // In a real app, you would call your listings service here
      this.savedListings = this.savedListings.filter(listing => listing.id !== listingId);
    }
  }

  // Booking management (for hosts)
  get filteredBookings() {
    if (this.bookingFilter === 'all') {
      return this.bookings;
    }
    return this.bookings.filter(booking => booking.status === this.bookingFilter);
  }

  approveBooking(bookingId: string) {
    // In a real app, you would call your booking service here
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex > -1) {
      this.bookings[bookingIndex].status = 'confirmed';
    }
  }

  rejectBooking(bookingId: string) {
    if (confirm('Are you sure you want to decline this booking?')) {
      // In a real app, you would call your booking service here
      const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex > -1) {
        this.bookings[bookingIndex].status = 'cancelled';
      }
    }
  }

  // Payment methods
  setDefaultPayment(paymentId: string) {
    // In a real app, you would call your payment service here
    this.paymentMethods.forEach(payment => {
      payment.isDefault = payment.id === paymentId;
    });
  }

  removePaymentMethod(paymentId: string) {
    if (confirm('Are you sure you want to remove this payment method?')) {
      // Check if trying to remove default payment method
      const isDefault = this.paymentMethods.find(p => p.id === paymentId)?.isDefault;
      if (isDefault) {
        alert('You cannot remove your default payment method. Please set another payment method as default first.');
        return;
      }

      // In a real app, you would call your payment service here
      this.paymentMethods = this.paymentMethods.filter(payment => payment.id !== paymentId);
    }
  }

  // Notification preferences
  toggleNotification(optionId: number) {
    const optionIndex = this.notificationOptions.findIndex(option => option.id === optionId);
    if (optionIndex > -1) {
      this.notificationOptions[optionIndex].enabled = !this.notificationOptions[optionIndex].enabled;
    }
  }

  saveNotificationPreferences() {
    // In a real app, you would call your user preferences service here
    alert('Notification preferences saved!');
  }

  // Account deletion
  confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('All your data, including trips, bookings, and saved listings will be permanently deleted. Proceed?')) {
        // In a real app, you would call your auth service here
        alert('Account deletion requested. You will receive an email with further instructions.');
      }
    }
  }

  // Stats getters
  get tripsCount() {
    return this.trips.length;
  }

  get listingsCount() {
    // In a real app, this would come from your service
    return this.isHost ? 2 : 0; // Example data
  }

  get savedCount() {
    return this.savedListings.length;
  }
}

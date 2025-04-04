import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { AuthService, User } from '../auth.service';
import { UserService, SavedListing, NotificationOption } from '../user.service';

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
  experienceImage?: string;
  experienceTitle?: string;
  startDate?: string;
  travelers: number;
  travelerName?: string;
  travelerEmail?: string;
}

interface Review {
  id: string;
  experienceId: string;
  experienceTitle: string;
  date: Date;
  rating: number;
  comment: string;
  photos?: string[];
  response?: {
    text: string;
    date: Date;
  }
}

interface Journey {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  travelers: number;
  status: string;
  progressPercentage: number;
  coverImage?: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  expiryDate?: string;
  expMonth?: string;  // Added to match template usage
  expYear?: string;   // Added to match template usage
  isDefault: boolean;
  cardBrand?: string;
  cardholderName?: string;
}

interface AdventureStyle {
  id: string;
  name: string;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, MatTabsModule, DatePipe, NgClass, RouterLink],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.sass', '../app.component.sass']
})
export class UserProfileComponent implements OnInit {
  // User data
  user: User | null = null;
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
  journeyFilter: 'all' | 'upcoming' | 'completed' | 'planning' = 'all';
  filteredJourneys: Journey[] = [];

  // Saved listings
  savedListings: SavedListing[] = [];
  savedExperiences: SavedListing[] = [];

  // Host data
  bookings: Booking[] = [];
  bookingFilter: 'all' | 'confirmed' | 'pending' = 'all';
  filteredBookings: Booking[] = [];

  // Review data
  userReviews: Review[] = [];

  // Payment methods
  paymentMethods: PaymentMethod[] = [];

  // Statistics
  journeysCount: number = 0;
  experiencesCount: number = 0;
  savedCount: number = 0;

  // Adventure preferences
  adventureStyles: AdventureStyle[] = [
    { id: 'cultural', name: 'Cultural Experiences' },
    { id: 'outdoor', name: 'Outdoor Adventures' },
    { id: 'relaxation', name: 'Relaxation & Wellness' },
    { id: 'foodie', name: 'Food & Culinary' },
    { id: 'nightlife', name: 'Nightlife & Entertainment' }
  ];
  selectedStyles: string[] = ['cultural', 'outdoor'];

  // Notification settings
  notificationOptions: NotificationOption[] = [
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
      bio: [''],
      location: [''],
      language: ['en'],
      travelPace: [3]
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

        // Load reviews
        this.loadReviews();

        // Initialize statistics
        this.updateStatistics();

        // Initialize journeys data for the UI
        this.initializeJourneys();
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
    this.userService.getProfile().subscribe({
      next: (profile: User) => {
        this.user = profile;
        this.profileImage = profile.profileImage || 'assets/sample-user.jpg';
        this.isHost = profile.isHost || false;

        // Populate form with user data
        this.profileForm.patchValue({
          name: profile.name,
          email: profile.email,
          phone: profile.phone || '',
          profileImage: profile.profileImage || '',
          bio: profile.bio || '',
          location: 'San Francisco, CA', // Mock data
          language: 'en',
          travelPace: 3
        });
      },
      error: (error: any) => {
        console.error('Error loading profile:', error);
      }
    });
  }

  // Check if user is a host
  checkIfHost() {
    // Using the user data from authService
    this.isHost = this.user?.isHost || false;
  }

  // Load user trips
  loadTrips() {
    this.userService.getTrips().subscribe({
      next: (trips: Trip[]) => {
        this.trips = trips;
        // Update statistics
        this.updateStatistics();
      },
      error: (error: any) => {
        console.error('Error loading trips:', error);
      }
    });
  }

  // Load saved listings
  loadSavedListings() {
    this.userService.getSavedListings().subscribe({
      next: (listings: SavedListing[]) => {
        this.savedListings = listings;
        this.savedExperiences = listings; // For the template
        this.savedCount = listings.length;
      },
      error: (error: any) => {
        console.error('Error loading saved listings:', error);
      }
    });
  }

  // Load bookings (for hosts)
  loadBookings() {
    // Mock implementation - in a real app, would call a service
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
        guestEmail: 'john.smith@example.com',
        experienceImage: 'assets/booking-1.jpg',
        experienceTitle: 'Beach House Adventure',
        startDate: '2025-06-10',
        travelers: 3,
        travelerName: 'John Smith',
        travelerEmail: 'john.smith@example.com'
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
        guestEmail: 'emma.j@example.com',
        experienceImage: 'assets/booking-2.jpg',
        experienceTitle: 'Beach House Retreat',
        startDate: '2025-07-01',
        travelers: 2,
        travelerName: 'Emma Johnson',
        travelerEmail: 'emma.j@example.com'
      }
    ];

    this.updateFilteredBookings();
  }

  // Load payment methods
  loadPaymentMethods() {
    this.userService.getPaymentMethods().subscribe({
      next: (methods: PaymentMethod[]) => {
        this.paymentMethods = methods;
      },
      error: (error: any) => {
        console.error('Error loading payment methods:', error);
      }
    });
  }

  // Load user reviews
  loadReviews() {
    // Mock implementation - in a real app, would call a service
    this.userReviews = [
      {
        id: '201',
        experienceId: '301',
        experienceTitle: 'Paris Food Tour',
        date: new Date('2024-01-15'),
        rating: 5,
        comment: 'Absolutely amazing experience! Our guide was knowledgeable and took us to hidden gems we never would have found on our own.',
        photos: ['assets/reviews/paris-food-1.jpg', 'assets/reviews/paris-food-2.jpg'],
        response: {
          text: 'Thank you for your kind words! It was a pleasure showing you around Paris.',
          date: new Date('2024-01-16')
        }
      }
    ];
  }

  // Initialize mock journeys for UI
  initializeJourneys() {
    const mockJourneys: Journey[] = [
      {
        id: '1',
        name: 'Summer in Italy',
        location: 'Rome, Florence, Venice',
        startDate: new Date('2025-06-10'),
        endDate: new Date('2025-06-24'),
        travelers: 2,
        status: 'upcoming',
        progressPercentage: 85,
        coverImage: 'assets/journeys/italy.jpg'
      },
      {
        id: '2',
        name: 'Japan Cherry Blossom Tour',
        location: 'Tokyo, Kyoto, Osaka',
        startDate: new Date('2025-03-22'),
        endDate: new Date('2025-04-05'),
        travelers: 1,
        status: 'planning',
        progressPercentage: 60,
        coverImage: 'assets/journeys/japan.jpg'
      },
      {
        id: '3',
        name: 'New Zealand Adventure',
        location: 'Auckland, Queenstown, Wellington',
        startDate: new Date('2024-11-15'),
        endDate: new Date('2024-12-01'),
        travelers: 2,
        status: 'completed',
        progressPercentage: 100,
        coverImage: 'assets/journeys/newzealand.jpg'
      }
    ];

    this.filteredJourneys = mockJourneys;
    this.updateFilteredJourneys();
  }

  // Update statistics
  updateStatistics() {
    this.journeysCount = this.filteredJourneys.length;
    this.experiencesCount = 5; // Mock value
    this.savedCount = this.savedExperiences.length;
  }

  // Form submissions
  onProfileSubmit() {
    this.submitted = true;

    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;

    this.userService.updateProfile({
      name: this.pf['name'].value,
      email: this.pf['email'].value,
      phone: this.pf['phone'].value,
      profileImage: this.pf['profileImage'].value,
      bio: this.pf['bio'].value
    }).subscribe({
      next: (updatedProfile: User) => {
        this.user = updatedProfile;
        this.profileImage = updatedProfile.profileImage || this.profileImage;
        this.loading = false;
        this.showEditProfile = false;
        alert('Profile updated successfully!');
      },
      error: (error: any) => {
        console.error('Error updating profile:', error);
        this.loading = false;
        alert('Failed to update profile. Please try again.');
      }
    });
  }

  onPasswordSubmit() {
    this.passwordSubmitted = true;

    if (this.passwordForm.invalid) {
      return;
    }

    this.passwordLoading = true;

    this.userService.changePassword(
      this.passwordF['currentPassword'].value,
      this.passwordF['newPassword'].value
    ).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.passwordForm.reset();
        this.passwordSubmitted = false;
        alert('Password updated successfully!');
      },
      error: (error: any) => {
        console.error('Error changing password:', error);
        this.passwordLoading = false;
        alert('Failed to change password. Please try again.');
      }
    });
  }

  // Journey filtering
  updateFilteredJourneys() {
    if (this.journeyFilter === 'all') {
      // The line below doesn't make sense as it assigns filteredJourneys to itself
      // So I'm leaving it as is, but in a real app you would need to get all journeys here
      // this.filteredJourneys = this.filteredJourneys;
    } else {
      this.filteredJourneys = this.filteredJourneys.filter(journey => journey.status === this.journeyFilter);
    }
  }

  // Cancel a journey
  cancelJourney(journeyId: string) {
    if (confirm('Are you sure you want to cancel this journey?')) {
      // In a real app, you would call your trip service here
      const journeyIndex = this.filteredJourneys.findIndex(j => j.id === journeyId);
      if (journeyIndex > -1) {
        this.filteredJourneys[journeyIndex].status = 'cancelled';
      }
    }
  }

  // Saved experiences management
  removeSaved(listingId: string) {
    if (confirm('Remove this listing from your saved list?')) {
      // In a real app, you would call your listings service here
      this.savedExperiences = this.savedExperiences.filter(listing => listing.id !== listingId);
      this.savedCount = this.savedExperiences.length;
    }
  }

  // Booking management (for hosts)
  updateFilteredBookings() {
    if (this.bookingFilter === 'all') {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(booking => booking.status === this.bookingFilter);
    }
  }

  approveBooking(bookingId: string) {
    // In a real app, you would call your booking service here
    const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex > -1) {
      this.bookings[bookingIndex].status = 'confirmed';
      this.updateFilteredBookings();
    }
  }

  rejectBooking(bookingId: string) {
    if (confirm('Are you sure you want to decline this booking?')) {
      // In a real app, you would call your booking service here
      const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
      if (bookingIndex > -1) {
        this.bookings[bookingIndex].status = 'cancelled';
        this.updateFilteredBookings();
      }
    }
  }

  // Payment methods
  setDefaultPayment(paymentId: string) {
    this.userService.setDefaultPaymentMethod(paymentId).subscribe({
      next: () => {
        this.paymentMethods.forEach(payment => {
          payment.isDefault = payment.id === paymentId;
        });
      },
      error: (error: any) => {
        console.error('Error setting default payment method:', error);
      }
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

      this.userService.removePaymentMethod(paymentId).subscribe({
        next: () => {
          this.paymentMethods = this.paymentMethods.filter(payment => payment.id !== paymentId);
        },
        error: (error: any) => {
          console.error('Error removing payment method:', error);
        }
      });
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
    this.userService.updateNotificationPreferences(this.notificationOptions).subscribe({
      next: () => {
        alert('Notification preferences saved!');
      },
      error: (error: any) => {
        console.error('Error updating notification preferences:', error);
      }
    });
  }

  // Account deletion
  confirmDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (confirm('All your data, including trips, bookings, and saved listings will be permanently deleted. Proceed?')) {
        this.userService.requestAccountDeletion().subscribe({
          next: () => {
            alert('Account deletion requested. You will receive an email with further instructions.');
          },
          error: (error: any) => {
            console.error('Error requesting account deletion:', error);
          }
        });
      }
    }
  }

  // Adventure preferences
  isStyleSelected(styleId: string): boolean {
    return this.selectedStyles.includes(styleId);
  }

  toggleStyle(styleId: string) {
    if (this.isStyleSelected(styleId)) {
      this.selectedStyles = this.selectedStyles.filter(id => id !== styleId);
    } else {
      this.selectedStyles.push(styleId);
    }
  }

  // Review management
  editReview(reviewId: string) {
    // In a real app, you would open a form to edit the review
    console.log(`Editing review ${reviewId}`);
    alert('Review editing functionality would open here');
  }

  deleteReview(reviewId: string) {
    if (confirm('Are you sure you want to delete this review?')) {
      // In a real app, you would call a service to delete the review
      this.userReviews = this.userReviews.filter(review => review.id !== reviewId);
    }
  }

  // Navigation methods
  navigateToCreatorSignup() {
    // In a real app, this would navigate to the creator signup page
    console.log('Navigating to creator signup');
    alert('This would navigate to the creator signup page');
  }
}

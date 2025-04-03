import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, SlicePipe } from '@angular/common';
import { ListingService } from '../listings.service';

interface Review {
  id: string;
  listingId: string;
  userId: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  date: string;
  response?: {
    text: string;
    date: string;
  };
  helpfulCount: number;
  photos?: string[];
  categories: {
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    checkin: number;
    value: number;
  }
}

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, ReactiveFormsModule],
  template: `
    <div class="reviews-container">
      <div class="reviews-header">
        <h2>
          {{ totalReviews }} {{ totalReviews === 1 ? 'Review' : 'Reviews' }}
          <span class="average-rating" *ngIf="reviews.length > 0">
            <span class="star-icon">★</span>
            {{ averageRating.toFixed(1) }}
          </span>
        </h2>

        <div class="rating-filters" *ngIf="reviews.length > 0">
          <button
            class="rating-filter"
            [class.active]="selectedRating === 0"
            (click)="filterByRating(0)">
            All
          </button>
          <button
            *ngFor="let rating of [5, 4, 3, 2, 1]"
            class="rating-filter"
            [class.active]="selectedRating === rating"
            (click)="filterByRating(rating)">
            {{ rating }} {{ rating === 1 ? 'Star' : 'Stars' }}
            <span class="filter-count">({{ getReviewCountByRating(rating) }})</span>
          </button>
        </div>
      </div>

      <div class="rating-breakdown" *ngIf="reviews.length > 0">
        <div class="rating-category" *ngFor="let category of ratingCategories">
          <span class="category-name">{{ category.name }}</span>
          <div class="rating-bar-container">
            <div class="rating-bar">
              <div class="rating-fill" [style.width]="getCategoryPercentage(category.key)"></div>
            </div>
            <span class="category-score">{{ getCategoryAverage(category.key).toFixed(1) }}</span>
          </div>
        </div>
      </div>

      <div class="reviews-list" *ngIf="filteredReviews.length > 0">
        <div class="review-card" *ngFor="let review of paginatedReviews">
          <div class="review-header">
            <img [src]="review.userImage" alt="{{ review.userName }}" class="reviewer-image">
            <div class="reviewer-info">
              <h3 class="reviewer-name">{{ review.userName }}</h3>
              <p class="review-date">{{ review.date | date:'mediumDate' }}</p>
            </div>
            <div class="review-rating">
              <span class="star-icon" *ngFor="let star of [1, 2, 3, 4, 5]">
                <svg viewBox="0 0 24 24" [class.filled]="star <= review.rating">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </span>
            </div>
          </div>

          <div class="review-content">
            <p class="review-text">{{ review.comment }}</p>

            <div class="review-photos" *ngIf="review.photos && review.photos.length > 0">
              <h4>Photos from {{ review.userName }}</h4>
              <div class="photos-grid">
                <div class="photo-item" *ngFor="let photo of review.photos">
                  <img [src]="photo" alt="Review photo" class="review-photo">
                </div>
              </div>
            </div>

            <div class="review-categories">
              <div class="category-item">
                <span class="category-label">Cleanliness:</span>
                <span class="category-value">{{ review.categories.cleanliness }}</span>
              </div>
              <div class="category-item">
                <span class="category-label">Accuracy:</span>
                <span class="category-value">{{ review.categories.accuracy }}</span>
              </div>
              <div class="category-item">
                <span class="category-label">Communication:</span>
                <span class="category-value">{{ review.categories.communication }}</span>
              </div>
              <div class="category-item">
                <span class="category-label">Location:</span>
                <span class="category-value">{{ review.categories.location }}</span>
              </div>
              <div class="category-item">
                <span class="category-label">Check-in:</span>
                <span class="category-value">{{ review.categories.checkin }}</span>
              </div>
              <div class="category-item">
                <span class="category-label">Value:</span>
                <span class="category-value">{{ review.categories.value }}</span>
              </div>
            </div>

            <div class="host-response" *ngIf="review.response">
              <h4>Response from host</h4>
              <p class="response-date">{{ review.response.date | date:'mediumDate' }}</p>
              <p class="response-text">{{ review.response.text }}</p>
            </div>

            <div class="review-actions">
              <button class="helpful-button" (click)="markHelpful(review.id)">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
                </svg>
                Helpful {{ review.helpfulCount > 0 ? '(' + review.helpfulCount + ')' : '' }}
              </button>
              <button class="report-button" (click)="reportReview(review.id)">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                </svg>
                Report
              </button>
            </div>
          </div>
        </div>

        <div class="pagination" *ngIf="totalPages > 1">
          <button
            class="page-button prev"
            [disabled]="currentPage === 1"
            (click)="prevPage()">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            Previous
          </button>

          <div class="page-numbers">
            <button
              *ngFor="let page of getPageNumbers()"
              class="page-number"
              [class.active]="currentPage === page"
              (click)="goToPage(page)">
              {{ page }}
            </button>
          </div>

          <button
            class="page-button next"
            [disabled]="currentPage === totalPages"
            (click)="nextPage()">
            Next
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="no-reviews" *ngIf="reviews.length === 0">
        <p>This property doesn't have any reviews yet.</p>
      </div>

      <div class="no-reviews" *ngIf="reviews.length > 0 && filteredReviews.length === 0">
        <p>No reviews match your current filter.</p>
        <button class="reset-filter" (click)="filterByRating(0)">Show all reviews</button>
      </div>

      <div class="write-review" *ngIf="canReview">
        <h3>Write a Review</h3>
        <form [formGroup]="reviewForm" (ngSubmit)="submitReview()">
          <div class="rating-input">
            <label>Overall Rating</label>
            <div class="star-rating">
              <button
                type="button"
                *ngFor="let star of [1, 2, 3, 4, 5]"
                class="star-button"
                [class.filled]="star <= selectedStar"
                (click)="selectStar(star)"
                (mouseenter)="hoverStar(star)"
                (mouseleave)="hoverStar(0)">
                <svg viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
              </button>
              <span class="rating-text">{{ getRatingText() }}</span>
            </div>
          </div>

          <div class="category-ratings">
            <h4>Rate specific categories</h4>
            <div class="category-grid">
              <div class="category-rating" *ngFor="let category of categoryRatings">
                <label>{{ category.label }}</label>
                <div class="mini-star-rating">
                  <button
                    type="button"
                    *ngFor="let star of [1, 2, 3, 4, 5]"
                    class="mini-star"
                    [class.filled]="star <= category.value"
                    (click)="setCategoryRating(category.key, star)">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="reviewComment">Your review</label>
            <textarea
              id="reviewComment"
              formControlName="comment"
              rows="5"
              placeholder="What did you like or dislike? How was your overall experience?"></textarea>
            <div class="error-message" *ngIf="submitted && r['comment'].errors">
              <span *ngIf="r['comment'].errors && r['comment'].errors['required']">Please write your review</span>
              <span *ngIf="r['comment'].errors && r['comment'].errors['minlength']">Review must be at least 20 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label>Add photos (optional)</label>
            <div class="photo-upload">
              <button type="button" class="upload-button">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
                </svg>
                Upload Photos
              </button>
              <input type="file" multiple class="file-input" (change)="onFileSelected($event)">
              <p class="upload-hint">You can upload up to 5 photos</p>
            </div>
          </div>

          <div class="photo-preview" *ngIf="selectedFiles.length > 0">
            <div class="preview-item" *ngFor="let file of selectedFiles; let i = index">
              <img [src]="filePreviewUrls[i]" alt="Preview" class="preview-image">
              <button type="button" class="remove-file" (click)="removeFile(i)">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-button" (click)="cancelReview()">Cancel</button>
            <button type="submit" class="submit-button" [disabled]="isSubmitting">
              {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['reviews.component.sass', '../app.component.sass']
})
export class ReviewsComponent implements OnInit {
  @Input() listingId: string = '';

  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedRating: number = 0;
  canReview: boolean = false;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  // Review form
  reviewForm: FormGroup;
  selectedStar: number = 0;
  hoveredStar: number = 0;
  submitted: boolean = false;
  isSubmitting: boolean = false;
  selectedFiles: File[] = [];
  filePreviewUrls: string[] = [];

  // Category ratings
  categoryRatings = [
    { key: 'cleanliness', label: 'Cleanliness', value: 0 },
    { key: 'accuracy', label: 'Accuracy', value: 0 },
    { key: 'communication', label: 'Communication', value: 0 },
    { key: 'location', label: 'Location', value: 0 },
    { key: 'checkin', label: 'Check-in', value: 0 },
    { key: 'value', label: 'Value', value: 0 }
  ];

  // Rating categories for display
  ratingCategories = [
    { key: 'cleanliness', name: 'Cleanliness' },
    { key: 'accuracy', name: 'Accuracy' },
    { key: 'communication', name: 'Communication' },
    { key: 'location', name: 'Location' },
    { key: 'checkin', name: 'Check-in' },
    { key: 'value', name: 'Value' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private listingService: ListingService
  ) {
    this.reviewForm = this.formBuilder.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(20)]]
    });
  }

  ngOnInit() {
    // In a real app, you would fetch reviews from a service
    this.loadSampleReviews();
    this.filterReviews();

    // Check if user can review (would normally be a service call)
    this.checkCanReview();
  }

  // Convenience getter for form fields
  get r() { return this.reviewForm.controls; }

  loadSampleReviews() {
    // Sample data
    this.reviews = [
      {
        id: '1',
        listingId: this.listingId,
        userId: 'user1',
        userName: 'Sarah Johnson',
        userImage: 'assets/users/user1.jpg',
        rating: 5,
        comment: 'Absolutely loved our stay here! The location was perfect, just a short walk to all the main attractions. The apartment was clean, stylish, and had everything we needed. The host was incredibly responsive and gave us great local recommendations. Would definitely stay here again on our next trip!',
        date: '2024-12-15',
        helpfulCount: 12,
        categories: {
          cleanliness: 5,
          accuracy: 5,
          communication: 5,
          location: 5,
          checkin: 4,
          value: 5
        },
        photos: [
          'assets/reviews/review1-1.jpg',
          'assets/reviews/review1-2.jpg'
        ],
        response: {
          text: "Thank you for your kind words, Sarah! We're so glad you enjoyed your stay and found everything to your satisfaction. We'd love to host you again on your next trip!",
          date: '2024-12-16'
        }
      },
      {
        id: '2',
        listingId: this.listingId,
        userId: 'user2',
        userName: 'Michael Chen',
        userImage: 'assets/users/user2.jpg',
        rating: 4,
        comment: 'Great place overall! Comfortable bed, well-equipped kitchen, and nice bathroom. The location is convenient with stores and restaurants nearby. Only downside was some street noise at night, but nothing too disturbing. Host was very accommodating with our check-in time.',
        date: '2024-11-20',
        helpfulCount: 5,
        categories: {
          cleanliness: 4,
          accuracy: 4,
          communication: 5,
          location: 4,
          checkin: 5,
          value: 4
        }
      },
      {
        id: '3',
        listingId: this.listingId,
        userId: 'user3',
        userName: 'Emma Wilson',
        userImage: 'assets/users/user3.jpg',
        rating: 5,
        comment: "This place exceeded our expectations! The photos don't do it justice - it's even more beautiful in person. We loved the attention to detail in the decor and the thoughtful amenities. The rooftop terrace was amazing for morning coffee and evening drinks. Would highly recommend!",
        date: '2024-10-05',
        helpfulCount: 8,
        categories: {
          cleanliness: 5,
          accuracy: 5,
          communication: 4,
          location: 5,
          checkin: 5,
          value: 5
        },
        photos: [
          'assets/reviews/review3-1.jpg',
          'assets/reviews/review3-2.jpg',
          'assets/reviews/review3-3.jpg'
        ]
      },
      {
        id: '4',
        listingId: this.listingId,
        userId: 'user4',
        userName: 'David Rodriguez',
        userImage: 'assets/users/user4.jpg',
        rating: 3,
        comment: 'The apartment is in a good location and has nice furnishings. However, we had some issues with the hot water during our stay, and it took a while to get resolved. The host was apologetic and offered a partial refund, which we appreciated. Otherwise, the stay was fine.',
        date: '2024-09-12',
        helpfulCount: 14,
        categories: {
          cleanliness: 4,
          accuracy: 3,
          communication: 3,
          location: 4,
          checkin: 4,
          value: 2
        },
        response: {
          text: "David, thank you for your feedback. We sincerely apologize for the hot water issue during your stay. We've since had the water heater replaced to ensure this doesn't happen to future guests. We appreciate your understanding and hope you might give us another chance in the future.",
          date: '2024-09-13'
        }
      },
      {
        id: '5',
        listingId: this.listingId,
        userId: 'user5',
        userName: 'Olivia Thompson',
        userImage: 'assets/users/user5.jpg',
        rating: 5,
        comment: 'Perfect for our family vacation! Spacious, clean, and in a great neighborhood. Our kids loved the nearby park, and we enjoyed being close to great restaurants and shops. The kitchen was well-stocked for cooking meals. Communication with the host was excellent from booking to checkout.',
        date: '2024-08-25',
        helpfulCount: 7,
        categories: {
          cleanliness: 5,
          accuracy: 5,
          communication: 5,
          location: 5,
          checkin: 4,
          value: 4
        }
      },
      {
        id: '6',
        listingId: this.listingId,
        userId: 'user6',
        userName: 'Jamal Washington',
        userImage: 'assets/users/user6.jpg',
        rating: 4,
        comment: 'Comfortable and convenient place to stay. Everything was as described in the listing. The neighborhood has a lot to offer and is easily walkable. The only suggestion I have is to provide more towels for longer stays. Otherwise, great experience!',
        date: '2024-07-30',
        helpfulCount: 3,
        categories: {
          cleanliness: 4,
          accuracy: 5,
          communication: 4,
          location: 5,
          checkin: 4,
          value: 4
        }
      }
    ];
  }

  filterReviews() {
    if (this.selectedRating === 0) {
      this.filteredReviews = [...this.reviews];
    } else {
      this.filteredReviews = this.reviews.filter(review => Math.floor(review.rating) === this.selectedRating);
    }

    // Sort by date (newest first)
    this.filteredReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate total pages
    this.totalPages = Math.ceil(this.filteredReviews.length / this.pageSize);
    this.currentPage = 1; // Reset to first page when filtering
  }

  filterByRating(rating: number) {
    this.selectedRating = rating;
    this.filterReviews();
  }

  getReviewCountByRating(rating: number): number {
    return this.reviews.filter(review => Math.floor(review.rating) === rating).length;
  }

  get paginatedReviews(): Review[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredReviews.slice(startIndex, startIndex + this.pageSize);
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show a subset of pages
      let startPage = Math.max(1, this.currentPage - 2);
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

      // Adjust if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }

    return pages;
  }

  get totalReviews(): number {
    return this.reviews.length;
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((total, review) => total + review.rating, 0);
    return sum / this.reviews.length;
  }

  getCategoryAverage(category: string): number {
    if (this.reviews.length === 0) return 0;

    const sum = this.reviews.reduce((total, review) => {
      return total + review.categories[category as keyof typeof review.categories];
    }, 0);

    return sum / this.reviews.length;
  }

  getCategoryPercentage(category: string): string {
    const average = this.getCategoryAverage(category);
    const percentage = (average / 5) * 100;
    return `${percentage}%`;
  }

  markHelpful(reviewId: string) {
    // In a real app, this would call a service to update the helpful count
    const review = this.reviews.find(r => r.id === reviewId);
    if (review) {
      review.helpfulCount++;
    }
  }

  reportReview(reviewId: string) {
    // In a real app, this would open a modal for reporting
    alert('Thank you for flagging this review. Our team will review it.');
  }

  // REVIEW FORM FUNCTIONALITY
  checkCanReview() {
    // In a real app, this would check if the user has stayed at this property
    // and hasn't already left a review
    this.canReview = true;
  }

  selectStar(star: number) {
    this.selectedStar = star;
    this.reviewForm.patchValue({ rating: star });

    // Set all category ratings to the same value initially
    this.categoryRatings.forEach(category => {
      category.value = star;
    });
  }

  hoverStar(star: number) {
    this.hoveredStar = star;
  }

  getRatingText(): string {
    const displayStar = this.hoveredStar > 0 ? this.hoveredStar : this.selectedStar;

    switch(displayStar) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  }

  setCategoryRating(key: string, value: number) {
    const category = this.categoryRatings.find(c => c.key === key);
    if (category) {
      category.value = value;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    // Limit to 5 files max
    const newFiles = Array.from(input.files).slice(0, 5 - this.selectedFiles.length);

    // Create preview URLs
    newFiles.forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreviewUrls.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.filePreviewUrls.splice(index, 1);
  }

  submitReview() {
    this.submitted = true;

    if (this.reviewForm.invalid || this.selectedStar === 0) {
      if (this.selectedStar === 0) {
        alert('Please select a rating');
      }
      return;
    }

    this.isSubmitting = true;

    // Prepare review data
    const newReview = {
      id: Date.now().toString(),
      listingId: this.listingId,
      userId: 'current-user-id', // Would come from auth service
      userName: 'Your Name', // Would come from user profile
      userImage: 'assets/users/default.jpg', // Would come from user profile
      rating: this.selectedStar,
      comment: this.reviewForm.value.comment,
      date: new Date().toISOString().split('T')[0],
      helpfulCount: 0,
      photos: this.filePreviewUrls,
      categories: {
        cleanliness: this.getCategoryValue('cleanliness'),
        accuracy: this.getCategoryValue('accuracy'),
        communication: this.getCategoryValue('communication'),
        location: this.getCategoryValue('location'),
        checkin: this.getCategoryValue('checkin'),
        value: this.getCategoryValue('value')
      }
    };

    // In a real app, this would submit to a service
    setTimeout(() => {
      // Add review to list (would normally come from API response)
      this.reviews.unshift(newReview as Review);
      this.filterReviews();

      // Reset form
      this.isSubmitting = false;
      this.submitted = false;
      this.reviewForm.reset();
      this.selectedStar = 0;
      this.selectedFiles = [];
      this.filePreviewUrls = [];
      this.categoryRatings.forEach(cat => cat.value = 0);

      alert('Thank you for your review!');
      this.canReview = false; // Prevent multiple reviews
    }, 1500);
  }

  getCategoryValue(key: string): number {
    const category = this.categoryRatings.find(c => c.key === key);
    return category ? category.value : this.selectedStar;
  }

  cancelReview() {
    this.reviewForm.reset();
    this.selectedStar = 0;
    this.selectedFiles = [];
    this.filePreviewUrls = [];
    this.categoryRatings.forEach(cat => cat.value = 0);
    this.submitted = false;
  }
}

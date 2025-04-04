import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgFor, NgIf, NgClass, SlicePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ListingService, Listing as ServiceListing } from '../listings.service';
import { UserService } from '../user.service';

// Using the interface from ListingsComponent but ensuring compatibility with service
export interface Listing extends ServiceListing {
  id?: string;
  title: string;
  location: string;
  price: string;
  rating?: number;
  reviewCount?: number;
  picture_url?: string;
  description?: string;
  country?: string;
  region?: string;
  features?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  hostName?: string;
}

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, RouterLink, SlicePipe],
  templateUrl: 'listings.component.html',
  styleUrls: ['listings.component.sass']
})
export class ListingsComponent implements OnInit {
  // Data storage
  paginatedExperiences: Listing[] = [];
  filteredExperiences: Listing[] = [];
  savedExperiences: string[] = [];

  // UI state
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  hasSearched: boolean = false;

  // Search and filter state
  searchTerm: string = '';
  sortOption: string = 'recommended';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  // Math for template
  Math = Math; // Make Math available in the template

  // Filtering options
  filters = [
    {
      name: 'Adventure Type',
      icon: 'tag',
      isCollapsed: false,
      options: ['Outdoor', 'Cultural', 'Culinary', 'Wellness', 'Nightlife', 'Family-friendly']
    },
    {
      name: 'Experience Type',
      icon: 'compass',
      isCollapsed: true,
      options: ['Classes', 'Tours', 'Day Trips', 'Multi-day', 'Activities', 'Venues']
    },
    {
      name: 'Rating',
      icon: 'star',
      isCollapsed: true,
      options: ['5 Stars', '4+ Stars', '3+ Stars']
    },
    {
      name: 'Price Range',
      icon: 'money',
      isCollapsed: true,
      options: ['Under $50', '$50 - $100', '$100 - $200', '$200+']
    }
  ];

  activeFilters: {[category: string]: string[]} = {};

  constructor(
    private listingService: ListingService,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchTerm = params['q'];
        this.hasSearched = true;
        this.getExperiences();
      }

      if (params['category']) {
        this.toggleFilter('Adventure Type', params['category']);
        this.hasSearched = true;
        this.getExperiences();
      }

      if (params['location']) {
        this.searchTerm = params['location'];
        this.hasSearched = true;
        this.getExperiences();
      }
    });

    // Load saved experiences
    this.loadSavedExperiences();
  }

  // Fetch experiences from API
  getExperiences(): void {
    this.isLoading = true;
    this.hasError = false;

    this.listingService.searchListings({
      q: this.searchTerm,
      page: this.currentPage,
      limit: this.itemsPerPage
    }).subscribe({
      next: (response) => {
        // Explicitly convert service listings to component listings
        const convertedListings: Listing[] = (response.listings || []).map(listing => ({
          ...listing,
          rating: typeof listing.rating === 'string' ? parseFloat(listing.rating) : listing.rating
        }));

        this.filteredExperiences = convertedListings;
        this.totalPages = response.pageCount || 1;
        this.applyFilters();
        this.applySort();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.hasError = true;
        this.errorMessage = 'Failed to load experiences. Please try again.';
        this.isLoading = false;
        console.error('Error fetching experiences:', error);
      }
    });
  }

  // Load user's saved experiences
  loadSavedExperiences(): void {
    this.userService.getSavedListings().subscribe({
      next: (saved) => {
        this.savedExperiences = saved.map(item => item.id);
      },
      error: (error: any) => {
        console.error('Error loading saved experiences:', error);
      }
    });
  }

  // Check if an experience is saved
  isSaved(id: string): boolean {
    return this.savedExperiences.includes(id);
  }

  // Toggle saved status for an experience
  toggleSaved(id: string): void {
    if (this.isSaved(id)) {
      this.userService.unsaveExperience(id).subscribe({
        next: () => {
          this.savedExperiences = this.savedExperiences.filter(savedId => savedId !== id);
        },
        error: (error: any) => {
          console.error('Error unsaving experience:', error);
        }
      });
    } else {
      this.userService.saveExperience(id).subscribe({
        next: () => {
          this.savedExperiences.push(id);
        },
        error: (error: any) => {
          console.error('Error saving experience:', error);
        }
      });
    }
  }

  // Search form submission
  onSearch(): void {
    this.currentPage = 1;
    this.hasSearched = true;

    // Update URL with search parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: this.searchTerm },
      queryParamsHandling: 'merge'
    });

    this.getExperiences();
  }

  // Sort options
  onSortChange(): void {
    this.applySort();
  }

  applySort(): void {
    switch (this.sortOption) {
      case 'price-low':
        this.filteredExperiences.sort((a, b) => {
          return this.extractPrice(a.price) - this.extractPrice(b.price);
        });
        break;
      case 'price-high':
        this.filteredExperiences.sort((a, b) => {
          return this.extractPrice(b.price) - this.extractPrice(a.price);
        });
        break;
      case 'rating':
        this.filteredExperiences.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA;
        });
        break;
      case 'newest':
        // Assuming there's a createdAt property, or we could use the isNew flag
        this.filteredExperiences.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return 0;
        });
        break;
      default:
        // 'recommended' - default sorting from API
        break;
    }

    this.updatePagination();
  }

  // Helper to extract price as a number
  private extractPrice(priceString: string): number {
    const numericString = priceString?.replace(/[^0-9.]/g, '');
    return numericString ? parseFloat(numericString) : 0;
  }

  // Filter management
  toggleFilter(category: string, option: string): void {
    if (!this.activeFilters[category]) {
      this.activeFilters[category] = [];
    }

    const index = this.activeFilters[category].indexOf(option);
    if (index === -1) {
      this.activeFilters[category].push(option);
    } else {
      this.activeFilters[category].splice(index, 1);
      if (this.activeFilters[category].length === 0) {
        delete this.activeFilters[category];
      }
    }

    this.applyFilters();
  }

  isFilterSelected(category: string, option: string): boolean {
    return this.activeFilters[category]?.includes(option) || false;
  }

  getActiveFiltersCount(): number {
    return Object.values(this.activeFilters)
      .reduce((count, options) => count + options.length, 0);
  }

  clearFilters(): void {
    this.activeFilters = {};
    this.applyFilters();
  }

  applyFilters(): void {
    // If no active filters, use all experiences
    if (this.getActiveFiltersCount() === 0) {
      // No need to re-filter, just update pagination
      this.updatePagination();
      return;
    }

    // Apply filters
    // Note: In a real app, you might want to send these filters to the backend
    // This is a simplified client-side filtering implementation
    this.filteredExperiences = this.filteredExperiences.filter(experience => {
      return this.matchesAllFilters(experience);
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  private matchesAllFilters(experience: Listing): boolean {
    // Check if experience matches all active filter categories
    for (const [category, options] of Object.entries(this.activeFilters)) {
      if (options.length === 0) continue;

      let categoryMatch = false;

      switch (category) {
        case 'Adventure Type':
          // Check if any experience features match the selected adventure types
          categoryMatch = options.some(option =>
            experience.features?.some(feature =>
              feature.toLowerCase().includes(option.toLowerCase())
            )
          );
          break;

        case 'Rating':
          const rating = experience.rating || 0;
          categoryMatch = options.some(option => {
            if (option === '5 Stars') return rating >= 4.8;
            if (option === '4+ Stars') return rating >= 4.0;
            if (option === '3+ Stars') return rating >= 3.0;
            return false;
          });
          break;

        case 'Price Range':
          const price = this.extractPrice(experience.price);
          categoryMatch = options.some(option => {
            if (option === 'Under $50') return price < 50;
            if (option === '$50 - $100') return price >= 50 && price <= 100;
            if (option === '$100 - $200') return price > 100 && price <= 200;
            if (option === '$200+') return price > 200;
            return false;
          });
          break;

        default:
          // No match for this category
          categoryMatch = false;
      }

      // If the experience doesn't match this category, return false
      if (!categoryMatch) return false;
    }

    // If we get here, the experience matches all filter categories
    return true;
  }

  // Toggle filter dropdown collapse
  toggleCollapse(filter: any): void {
    filter.isCollapsed = !filter.isCollapsed;
  }

  // Pagination methods
  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedExperiences = this.filteredExperiences.slice(startIndex, endIndex);
    this.totalPages = Math.ceil(this.filteredExperiences.length / this.itemsPerPage);
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  getVisiblePages(): number[] {
    const visiblePageCount = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(visiblePageCount / 2));
    let endPage = Math.min(this.totalPages, startPage + visiblePageCount - 1);

    // Adjust start page if needed
    if (endPage - startPage + 1 < visiblePageCount) {
      startPage = Math.max(1, endPage - visiblePageCount + 1);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  }
}

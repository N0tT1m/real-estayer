import { Component, OnInit } from '@angular/core'
import { ListingService } from '../listings.service'
import { FormsModule } from "@angular/forms"
import {NgIf, NgFor, KeyValuePipe, TitleCasePipe, NgClass, SlicePipe} from "@angular/common"
import { HttpClientModule } from '@angular/common/http'
import { Router, ActivatedRoute } from '@angular/router'

interface Listing {
  url: string
  title: string
  picture_url: string
  location: string
  region: string
  state: string
  province: string
  country: string
  price: string
  features: string[]
  rating?: number
}

interface Filter {
  name: string
  options: string[]
  selected: string[]
  isCollapsed: boolean
  icon?: string
}

@Component({
  selector: 'app-listings',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    KeyValuePipe,
    TitleCasePipe,
    FormsModule,
    HttpClientModule,
    SlicePipe
  ],
  providers: [ListingService],
  templateUrl: 'listings.component.html',
  styleUrls: ['listings.component.sass'],
})
export class ListingsComponent implements OnInit {
  allListings: Listing[] = []
  filteredListings: Listing[] = []
  searchTerm: string = ''
  filters: Filter[] = []
  hasSearched: boolean = false
  isLoading: boolean = false
  hasError: boolean = false
  errorMessage: string = ''
  currentPage: number = 1
  itemsPerPage: number = 12
  totalPages: number = 1
  sortOption: string = 'recommended'

  readonly sortOptions = [
    { value: 'recommended', label: 'Recommended' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating_desc', label: 'Highest Rated' }
  ]

  constructor(
    private listingService: ListingService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Initialize filters with icons
    this.filters = [
      {
        name: 'Features',
        options: [],
        selected: [],
        isCollapsed: true,
        icon: 'features'
      },
      {
        name: 'Price Range',
        options: ['$0-$50', '$51-$100', '$101-$200', '$201+'],
        selected: [],
        isCollapsed: true,
        icon: 'price'
      },
      {
        name: 'Location',
        options: [],
        selected: [],
        isCollapsed: true,
        icon: 'location'
      }
    ]

    // Check for query params
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search']
        this.getListings()
      }

      if (params['sort']) {
        this.sortOption = params['sort']
      }

      if (params['page']) {
        this.currentPage = +params['page']
      }
    })
  }

  getListings() {
    this.isLoading = true
    this.hasError = false

    this.listingService.getListings(this.searchTerm).subscribe({
      next: (data: Listing[]) => {
        this.allListings = data
        this.updateFilterOptions()
        this.sortListings()
        this.filterListings()
        this.hasSearched = true
        this.isLoading = false

        // Update URL with search term
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { search: this.searchTerm },
          queryParamsHandling: 'merge'
        })
      },
      error: error => {
        console.error('Error fetching listings:', error)
        this.hasSearched = true
        this.isLoading = false
        this.hasError = true
        this.errorMessage = 'Failed to load listings. Please try again later.'
        this.allListings = []
        this.filteredListings = []
      }
    })
  }

  onSearch() {
    this.currentPage = 1 // Reset to first page on new search
    this.getListings()
  }

  updateFilterOptions() {
    // Update Features filter options
    const allFeatures = Array.from(new Set(this.allListings.flatMap(listing => listing.features)))
    this.filters[0].options = allFeatures.sort()

    // Update Location filter options
    const allLocations = Array.from(new Set(this.allListings.map(listing => listing.location)))
    this.filters[2].options = allLocations.sort()
  }

  sortListings() {
    switch(this.sortOption) {
      case 'price_asc':
        this.allListings.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g,''))
          const priceB = parseInt(b.price.replace(/\D/g,''))
          return priceA - priceB
        })
        break
      case 'price_desc':
        this.allListings.sort((a, b) => {
          const priceA = parseInt(a.price.replace(/\D/g,''))
          const priceB = parseInt(b.price.replace(/\D/g,''))
          return priceB - priceA
        })
        break
      case 'rating_desc':
        this.allListings.sort((a, b) => {
          const ratingA = a.rating || 0
          const ratingB = b.rating || 0
          return ratingB - ratingA
        })
        break
      case 'recommended':
      default:
        // Keep original ordering or implement recommendation logic
        break
    }
  }

  onSortChange() {
    this.sortListings()
    this.filterListings()

    // Update URL with sort option
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: this.sortOption },
      queryParamsHandling: 'merge'
    })
  }

  filterListings() {
    this.filteredListings = this.allListings.filter(listing => {
      // If searchTerm is not empty, filter by it
      if (this.searchTerm.trim() !== '') {
        const searchLower = this.searchTerm.toLowerCase()
        const locationMatch =
          listing.location.toLowerCase().includes(searchLower) ||
          listing.region.toLowerCase().includes(searchLower) ||
          listing.country.toLowerCase().includes(searchLower) ||
          (listing.state && listing.state.toLowerCase().includes(searchLower)) ||
          (listing.province && listing.province.toLowerCase().includes(searchLower))

        if (!locationMatch) {
          return false
        }
      }

      return this.filters.every(filter => {
        if (filter.selected.length === 0) return true

        switch(filter.name) {
          case 'Features':
            return filter.selected.every(feature =>
              listing.features.includes(feature)
            )
          case 'Price Range':
            const price = parseInt(listing.price.replace(/\D/g,''))
            return filter.selected.some(range => {
              const [min, max] = range.split('-').map(v =>
                parseInt(v.replace('$', ''))
              )
              return price >= min && (max ? price <= max : true)
            })
          case 'Location':
            return filter.selected.includes(listing.location)
          default:
            return true
        }
      })
    })

    this.updatePagination()
  }

  toggleFilter(filterName: string, option: string) {
    const filter = this.filters.find(f => f.name === filterName)
    if (filter) {
      const index = filter.selected.indexOf(option)
      if (index > -1) {
        filter.selected.splice(index, 1)
      } else {
        filter.selected.push(option)
      }
      this.currentPage = 1 // Reset to first page when filters change
      this.filterListings()
    }
  }

  clearFilters() {
    this.filters.forEach(filter => {
      filter.selected = []
    })
    this.currentPage = 1
    this.filterListings()
  }

  isFilterSelected(filterName: string, option: string): boolean {
    const filter = this.filters.find(f => f.name === filterName)
    return filter ? filter.selected.includes(option) : false
  }

  toggleCollapse(filter: Filter) {
    filter.isCollapsed = !filter.isCollapsed
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredListings.length / this.itemsPerPage)
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages)
    }
  }

  get paginatedListings() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage
    return this.filteredListings.slice(startIndex, startIndex + this.itemsPerPage)
  }

  nextPage() {
    if (this.hasNextPage()) {
      this.currentPage++
      this.updatePageQueryParam()
    }
  }

  prevPage() {
    if (this.hasPreviousPage()) {
      this.currentPage--
      this.updatePageQueryParam()
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page
      this.updatePageQueryParam()
    }
  }

  updatePageQueryParam() {
    // Update URL with page number
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage },
      queryParamsHandling: 'merge'
    })

    // Scroll to top of results
    const listingsElement = document.querySelector('.listings') as HTMLElement;
    window.scrollTo({
      top: listingsElement?.offsetTop - 100 || 0,
      behavior: 'smooth'
    })
  }

  hasNextPage(): boolean {
    return this.currentPage < this.totalPages
  }

  hasPreviousPage(): boolean {
    return this.currentPage > 1
  }

  getVisiblePages(): number[] {
    const delta = 2
    const range: number[] = []

    let left = this.currentPage - delta
    let right = this.currentPage + delta + 1

    // Handle edge cases
    if (left < 1) {
      left = 1
      right = Math.min(5, this.totalPages)
    }

    if (right > this.totalPages) {
      right = this.totalPages
      left = Math.max(1, this.totalPages - 4)
    }

    // Generate the range
    for (let i = left; i < right; i++) {
      range.push(i)
    }

    return range
  }

  getActiveFiltersCount(): number {
    return this.filters.reduce((count, filter) => count + filter.selected.length, 0)
  }

  protected readonly Math = Math;
}

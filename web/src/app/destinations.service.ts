import { Injectable } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { ListingService, Listing } from './listing.service';

export interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  avgPrice: string;
  rating: number;
  popularFor: string[];
  listingsCount: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class DestinationsService {
  private categories: Category[] = [
    {
      id: 'beach',
      name: 'Beach',
      description: 'Sun, sand & surf',
      icon: '<svg viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 5.28c-1.23-.37-2.22-1.17-2.8-2.18l-1-1.6c-.41-.65-1.11-1-1.84-1-.78 0-1.59.5-1.78 1.44S7 23 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1 1.15 2.41 2.01 4 2.34V23H19V9h-1.5v1.78zM7.43 13.13l-2.12-.41c-.54-.11-.9-.63-.79-1.17l.76-3.93c.21-1.08 1.26-1.79 2.34-1.58l1.16.23-1.35 6.86z"></path></svg>'
    },
    {
      id: 'mountain',
      name: 'Mountain',
      description: 'Scenic peaks & trails',
      icon: '<svg viewBox="0 0 24 24"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"></path></svg>'
    },
    {
      id: 'urban',
      name: 'City',
      description: 'Urban exploration',
      icon: '<svg viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"></path></svg>'
    },
    {
      id: 'countryside',
      name: 'Countryside',
      description: 'Rural retreats',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path></svg>'
    },
    {
      id: 'luxury',
      name: 'Luxury',
      description: 'High-end stays',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path></svg>'
    }
  ];

  // Mock data for fallback
  private mockFeaturedDestinations: Destination[] = [
    {
      id: '1',
      name: 'Bali',
      country: 'Indonesia',
      image: 'assets/destinations/bali.jpg',
      description: 'A tropical paradise with stunning beaches, lush rice terraces, and unique cultural experiences.',
      avgPrice: '$85',
      rating: 4.8,
      popularFor: ['Beaches', 'Culture', 'Nightlife', 'Food'],
      listingsCount: 1245
    },
    {
      id: '2',
      name: 'Paris',
      country: 'France',
      image: 'assets/destinations/paris.jpg',
      description: 'The city of lights featuring iconic landmarks, world-class museums, and romantic ambiance.',
      avgPrice: '$120',
      rating: 4.7,
      popularFor: ['Culture', 'Food', 'Art', 'Architecture'],
      listingsCount: 1876
    },
    {
      id: '3',
      name: 'Kyoto',
      country: 'Japan',
      image: 'assets/destinations/kyoto.jpg',
      description: 'A city rich in Japanese heritage with historic temples, traditional gardens, and serene atmospheres.',
      avgPrice: '$95',
      rating: 4.9,
      popularFor: ['Culture', 'History', 'Nature', 'Food'],
      listingsCount: 987
    }
  ];

  private mockTrendingCities: Destination[] = [
    {
      id: '4',
      name: 'Barcelona',
      country: 'Spain',
      image: 'assets/destinations/barcelona.jpg',
      description: 'A vibrant city with unique architecture, lively beaches, and world-famous cuisine.',
      avgPrice: '$90',
      rating: 4.6,
      popularFor: ['Architecture', 'Beaches', 'Food', 'Nightlife'],
      listingsCount: 1532
    },
    {
      id: '5',
      name: 'New York',
      country: 'USA',
      image: 'assets/destinations/newyork.jpg',
      description: 'The city that never sleeps offers iconic skyscrapers, diverse neighborhoods, and endless entertainment.',
      avgPrice: '$150',
      rating: 4.7,
      popularFor: ['Shopping', 'Culture', 'Food', 'Entertainment'],
      listingsCount: 2180
    },
    {
      id: '6',
      name: 'Tokyo',
      country: 'Japan',
      image: 'assets/destinations/tokyo.jpg',
      description: 'An ultra-modern metropolis with cutting-edge technology, traditional culture, and incredible food.',
      avgPrice: '$110',
      rating: 4.8,
      popularFor: ['Technology', 'Shopping', 'Food', 'Culture'],
      listingsCount: 1687
    },
    {
      id: '7',
      name: 'Rome',
      country: 'Italy',
      image: 'assets/destinations/rome.jpg',
      description: 'The Eternal City showcases ancient history, artistic masterpieces, and delicious Italian cuisine.',
      avgPrice: '$95',
      rating: 4.7,
      popularFor: ['History', 'Art', 'Food', 'Architecture'],
      listingsCount: 1425
    }
  ];

  private mockSeasonalPicks: Destination[] = [
    {
      id: '8',
      name: 'Amsterdam',
      country: 'Netherlands',
      image: 'assets/destinations/amsterdam.jpg',
      description: 'Famous for its tulip season, picturesque canals, historic buildings, and vibrant culture.',
      avgPrice: '$105',
      rating: 4.6,
      popularFor: ['Tulips', 'Canals', 'Cycling', 'Museums'],
      listingsCount: 987
    },
    {
      id: '9',
      name: 'Kyoto',
      country: 'Japan',
      image: 'assets/destinations/kyoto-spring.jpg',
      description: 'Experience the magic of cherry blossom season among historic temples and gardens.',
      avgPrice: '$115',
      rating: 4.9,
      popularFor: ['Cherry Blossoms', 'Temples', 'Gardens', 'History'],
      listingsCount: 1045
    },
    {
      id: '10',
      name: 'Provence',
      country: 'France',
      image: 'assets/destinations/provence.jpg',
      description: 'Blooming lavender fields, charming villages, and Mediterranean climate make it a spring favorite.',
      avgPrice: '$95',
      rating: 4.7,
      popularFor: ['Lavender', 'Countryside', 'Wine', 'Food'],
      listingsCount: 765
    },
    {
      id: '11',
      name: 'Washington D.C.',
      country: 'USA',
      image: 'assets/destinations/washington.jpg',
      description: 'Visit during the National Cherry Blossom Festival for stunning views and cultural celebrations.',
      avgPrice: '$130',
      rating: 4.5,
      popularFor: ['Cherry Blossoms', 'Museums', 'History', 'Monuments'],
      listingsCount: 892
    }
  ];

  constructor(private listingService: ListingService) {}

  getCategories(): Observable<Category[]> {
    return of(this.categories);
  }

  // Convert backend listings to frontend destinations
  private convertListingsToDestinations(listings: unknown): Destination[] {
    return listings.map(listing => {
      // Extract price value from the listing price string (assuming format like "$120")
      let avgPrice = listing.price || '$0';
      if (avgPrice && !avgPrice.includes('$')) {
        avgPrice = '$' + avgPrice;
      }

      // Parse rating to number (default to 4.5 if not available)
      const rating = listing.rating ? parseFloat(listing.rating) : 4.5;

      // Extract features as popular tags
      const popularFor = listing.features && listing.features.length > 0
        ? listing.features.slice(0, 4)
        : ['Comfortable', 'Cozy'];

      return {
        id: listing._id,
        name: listing.title?.split(' in ')[0] || 'Beautiful Place',
        country: listing.country || 'Unknown Country',
        image: listing.picture_url || 'assets/destinations/default.jpg',
        description: listing.description || 'A wonderful place to stay with amazing amenities.',
        avgPrice: avgPrice,
        rating: rating,
        popularFor: popularFor,
        listingsCount: Math.floor(Math.random() * 1000) + 200 // Mock data for listings count
      };
    });
  }

  getFeaturedDestinations(): Observable<Destination[]> {
    // Get some featured listings from the backend
    return this.listingService.getListings(undefined, 3)
      .pipe(
        map(listings => this.convertListingsToDestinations(listings)),
        catchError(error => {
          console.error('Error fetching featured destinations:', error);
          return of(this.mockFeaturedDestinations);
        })
      );
  }

  getTrendingCities(): Observable<Destination[]> {
    // For trending cities, we'll search for popular locations
    return this.listingService.searchListings({
      pageSize: 4
    }).pipe(
      map(response => this.convertListingsToDestinations(response.listings)),
      catchError(error => {
        console.error('Error fetching trending cities:', error);
        return of(this.mockTrendingCities);
      })
    );
  }

  getSeasonalPicks(): Observable<Destination[]> {
    // For seasonal picks, you could use a specific filter
    return this.listingService.searchListings({
      amenities: ['Garden', 'Pool', 'Outdoor'],
      pageSize: 4
    }).pipe(
      map(response => this.convertListingsToDestinations(response.listings)),
      catchError(error => {
        console.error('Error fetching seasonal picks:', error);
        return of(this.mockSeasonalPicks);
      })
    );
  }
}

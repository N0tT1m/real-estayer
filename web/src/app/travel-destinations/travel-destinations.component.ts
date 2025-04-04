import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgFor, NgIf, AsyncPipe, DatePipe } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { ListingService } from '../listings.service';
import { Observable, catchError, of, tap } from 'rxjs';

// Interface definitions
interface Destination {
  id: string;
  name: string;
  country: string;
  image: string;
  description: string;
  avgPrice: string;
  rating: number;
  popularFor: string[];
  adventuresCount: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface TravelGuide {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  authorImage: string;
  date: Date;
}

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, DatePipe],
  templateUrl: './travel-destinations.component.html',
  styleUrls: ['./travel-destinations.component.sass', '../app.component.sass']
})
export class DestinationsComponent implements OnInit {
  adventureStyles: any[] = [
    {
      id: 'coastal',
      name: 'Coastal',
      description: 'Beach adventures',
      icon: '<svg viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 5.28c-1.23-.37-2.22-1.17-2.8-2.18l-1-1.6c-.41-.65-1.11-1-1.84-1-.78 0-1.59.5-1.78 1.44S7 23 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1 1.15 2.41 2.01 4 2.34V23H19V9h-1.5v1.78zM7.43 13.13l-2.12-.41c-.54-.11-.9-.63-.79-1.17l.76-3.93c.21-1.08 1.26-1.79 2.34-1.58l1.16.23-1.35 6.86z"></path></svg>'
    },
    {
      id: 'alpine',
      name: 'Alpine',
      description: 'Mountain expeditions',
      icon: '<svg viewBox="0 0 24 24"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"></path></svg>'
    },
    {
      id: 'urban',
      name: 'Urban',
      description: 'City exploration',
      icon: '<svg viewBox="0 0 24 24"><path d="M15 11V5l-3-3-3 3v2H3v14h18V11h-6zm-8 8H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5V9h2v2zm6 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm6 12h-2v-2h2v2zm0-4h-2v-2h2v2z"></path></svg>'
    },
    {
      id: 'rural',
      name: 'Rural',
      description: 'Countryside immersion',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"></path></svg>'
    }
  ];

  featuredDestinations: Destination[] = [];
  trendingCities: any[] = [];
  seasonalPicks: Destination[] = [];
  travelGuides: TravelGuide[] = [];

  newsletterEmail: string = '';

  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private router: Router,
    private listingService: ListingService
  ) {
    // Initialize travel guides
    this.travelGuides = [
      {
        id: '1',
        title: 'Essential Hiking Gear for Alpine Adventures',
        excerpt: 'Make sure you\'re prepared for high-altitude trekking with this gear guide.',
        image: 'assets/images/guide-1.jpg',
        category: 'Alpine',
        author: 'Sarah Johnson',
        authorImage: 'assets/images/author-1.jpg',
        date: new Date('2024-02-15')
      },
      {
        id: '2',
        title: 'Top 10 Hidden Beaches in Southeast Asia',
        excerpt: 'Discover secluded coastal paradises away from the tourist crowds.',
        image: 'assets/images/guide-2.jpg',
        category: 'Coastal',
        author: 'Mike Thompson',
        authorImage: 'assets/images/author-2.jpg',
        date: new Date('2024-03-05')
      },
      {
        id: '3',
        title: 'Urban Photography: Capturing City Life',
        excerpt: 'Tips and techniques for stunning urban photography during your city explorations.',
        image: 'assets/images/guide-3.jpg',
        category: 'Urban',
        author: 'Lisa Chen',
        authorImage: 'assets/images/author-3.jpg',
        date: new Date('2024-03-22')
      },
      {
        id: '4',
        title: 'Farm-to-Table Experiences in Rural Europe',
        excerpt: 'The best agritourism experiences for food lovers seeking authentic culinary adventures.',
        image: 'assets/images/guide-4.jpg',
        category: 'Rural',
        author: 'Marco Rossi',
        authorImage: 'assets/images/author-4.jpg',
        date: new Date('2024-02-28')
      }
    ];
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loading = true;
    this.errorMessage = '';

    // Load all data at once and handle with fallbacks
    this.loadFeaturedDestinations();
    this.loadTrendingCities();
    this.loadSeasonalPicks();
  }

  loadFeaturedDestinations() {
    this.loading = true;

    // Using the standard listing service
    this.listingService.getListings('', 3)
      .subscribe({
        next: (data) => {
          this.featuredDestinations = this.convertListingsToDestinations(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading featured destinations:', err);
          this.featuredDestinations = this.convertListingsToDestinations(this.getFallbackFeaturedDestinations());
          this.loading = false;
        }
      });
  }

  loadTrendingCities() {
    this.listingService.searchListings({
      limit: 4
    })
      .subscribe({
        next: (data) => {
          // Extract listings from the response
          const listings = data.listings || [];
          this.trendingCities = this.convertListingsToDestinations(listings);
        },
        error: (err) => {
          console.error('Error loading trending cities:', err);
          this.trendingCities = this.convertListingsToDestinations(this.getFallbackTrendingCities());
        }
      });
  }

  loadSeasonalPicks() {
    this.listingService.searchListings({
      limit: 4
    })
      .subscribe({
        next: (data) => {
          // Extract listings from the response
          const listings = data.listings || [];
          this.seasonalPicks = this.convertListingsToDestinations(listings);
        },
        error: (err) => {
          console.error('Error loading seasonal picks:', err);
          this.seasonalPicks = this.convertListingsToDestinations(this.getFallbackSeasonalPicks());
        }
      });
  }

  filterByStyle(styleId: string) {
    this.router.navigate(['/listings'], {
      queryParams: { category: styleId }
    });
  }

  exploreDestination(destinationName: string) {
    this.router.navigate(['/listings'], {
      queryParams: { location: destinationName }
    });
  }

  readGuide(guideId: string) {
    console.log(`Opening guide ${guideId}`);
    // Implementation would navigate to a specific guide page
  }

  viewAllGuides() {
    console.log('Viewing all travel guides');
    // Implementation would navigate to a guides listing page
  }

  subscribeNewsletter() {
    if (!this.newsletterEmail) {
      alert('Please enter your email address');
      return;
    }

    console.log(`Subscribing ${this.newsletterEmail} to newsletter`);
    alert(`Thank you for subscribing to our newsletter!`);
    this.newsletterEmail = '';
  }

  // Helper method to convert backend listings to frontend destinations format
  private convertListingsToDestinations(listings: any[]): Destination[] {
    return listings.map(listing => {
      // Extract price value (default to a placeholder if not available)
      let avgPrice = listing.price || '$85';
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
        id: listing._id || String(Math.random()),
        name: listing.title?.split(' in ')[0] || listing.location || 'Beautiful Place',
        country: listing.country || 'Unknown Country',
        image: listing.picture_url || `assets/destinations/${Math.floor(Math.random() * 5) + 1}.jpg`,
        description: listing.description || 'A wonderful place to stay with amazing amenities and a great location.',
        avgPrice: avgPrice,
        rating: rating,
        popularFor: popularFor,
        adventuresCount: Math.floor(Math.random() * 1000) + 200 // Mock data for adventures count
      };
    });
  }

  // Fallback data in case the API fails
  private getFallbackFeaturedDestinations(): any[] {
    return [
      {
        _id: '1',
        title: 'Bali Beachfront Villa',
        country: 'Indonesia',
        picture_url: 'assets/destinations/bali.jpg',
        description: 'A tropical paradise with stunning beaches, lush rice terraces, and unique cultural experiences.',
        price: '$85',
        rating: '4.8',
        features: ['Beaches', 'Culture', 'Nightlife', 'Food']
      },
      {
        _id: '2',
        title: 'Paris Apartment',
        country: 'France',
        picture_url: 'assets/destinations/paris.jpg',
        description: 'The city of lights featuring iconic landmarks, world-class museums, and romantic ambiance.',
        price: '$120',
        rating: '4.7',
        features: ['Culture', 'Food', 'Art', 'Architecture']
      },
      {
        _id: '3',
        title: 'Kyoto Traditional Home',
        country: 'Japan',
        picture_url: 'assets/destinations/kyoto.jpg',
        description: 'A city rich in Japanese heritage with historic temples, traditional gardens, and serene atmospheres.',
        price: '$95',
        rating: '4.9',
        features: ['Culture', 'History', 'Nature', 'Food']
      }
    ];
  }

  private getFallbackTrendingCities(): any[] {
    return [
      {
        _id: '4',
        title: 'Barcelona Penthouse',
        country: 'Spain',
        picture_url: 'assets/destinations/barcelona.jpg',
        description: 'A vibrant city with unique architecture, lively beaches, and world-famous cuisine.',
        price: '$90',
        rating: '4.6',
        features: ['Architecture', 'Beaches', 'Food', 'Nightlife']
      },
      {
        _id: '5',
        title: 'New York Loft',
        country: 'USA',
        picture_url: 'assets/destinations/newyork.jpg',
        description: 'The city that never sleeps offers iconic skyscrapers, diverse neighborhoods, and endless entertainment.',
        price: '$150',
        rating: '4.7',
        features: ['Shopping', 'Culture', 'Food', 'Entertainment']
      },
      {
        _id: '6',
        title: 'Tokyo Modern Apartment',
        country: 'Japan',
        picture_url: 'assets/destinations/tokyo.jpg',
        description: 'An ultra-modern metropolis with cutting-edge technology, traditional culture, and incredible food.',
        price: '$110',
        rating: '4.8',
        features: ['Technology', 'Shopping', 'Food', 'Culture']
      },
      {
        _id: '7',
        title: 'Rome Historic Apartment',
        country: 'Italy',
        picture_url: 'assets/destinations/rome.jpg',
        description: 'The Eternal City showcases ancient history, artistic masterpieces, and delicious Italian cuisine.',
        price: '$95',
        rating: '4.7',
        features: ['History', 'Art', 'Food', 'Architecture']
      }
    ];
  }

  private getFallbackSeasonalPicks(): any[] {
    return [
      {
        _id: '8',
        title: 'Amsterdam Canal House',
        country: 'Netherlands',
        picture_url: 'assets/destinations/amsterdam.jpg',
        description: 'Famous for its tulip season, picturesque canals, historic buildings, and vibrant culture.',
        price: '$105',
        rating: '4.6',
        features: ['Tulips', 'Canals', 'Cycling', 'Museums']
      },
      {
        _id: '9',
        title: 'Kyoto Cherry Blossom View',
        country: 'Japan',
        picture_url: 'assets/destinations/kyoto-spring.jpg',
        description: 'Experience the magic of cherry blossom season among historic temples and gardens.',
        price: '$115',
        rating: '4.9',
        features: ['Cherry Blossoms', 'Temples', 'Gardens', 'History']
      },
      {
        _id: '10',
        title: 'Provence Cottage',
        country: 'France',
        picture_url: 'assets/destinations/provence.jpg',
        description: 'Blooming lavender fields, charming villages, and Mediterranean climate make it a spring favorite.',
        price: '$95',
        rating: '4.7',
        features: ['Lavender', 'Countryside', 'Wine', 'Food']
      },
      {
        _id: '11',
        title: 'Washington D.C. Townhouse',
        country: 'USA',
        picture_url: 'assets/destinations/washington.jpg',
        description: 'Visit during the National Cherry Blossom Festival for stunning views and cultural celebrations.',
        price: '$130',
        rating: '4.5',
        features: ['Cherry Blossoms', 'Museums', 'History', 'Monuments']
      }
    ];
  }
}

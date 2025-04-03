import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

export interface Activity {
  id?: string;
  name: string;
  date: string;
  time: string;
  location: string;
  cost: number;
  notes: string;
  booked: boolean;
}

export interface Accommodation {
  id?: string;
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  cost: number;
  confirmation: string;
  notes: string;
}

export interface Transportation {
  id?: string;
  type: 'flight' | 'train' | 'car' | 'bus' | 'other';
  from: string;
  to: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  carrier: string;
  confirmation: string;
  cost: number;
  notes: string;
}

export interface Itinerary {
  id?: string;
  userId?: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  accommodations: Accommodation[];
  transportation: Transportation[];
  totalBudget: number;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = `${environment.apiUrl}/trips`;
  private mockMode = true; // Set to false when backend is ready

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all trips for current user
  getUserTrips(): Observable<Itinerary[]> {
    if (this.mockMode) {
      return of(this.getMockItineraries());
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.get<Itinerary[]>(this.apiUrl, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching user trips:', error);
          return throwError(() => 'Failed to load your trips. Please try again later.');
        })
      );
  }

  // Get a specific trip by ID
  getTripById(tripId: string): Observable<Itinerary> {
    if (this.mockMode) {
      const trip = this.getMockItineraries().find(t => t.id === tripId);
      return trip
        ? of(trip)
        : throwError(() => 'Trip not found');
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.get<Itinerary>(`${this.apiUrl}/${tripId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error fetching trip details:', error);
          return throwError(() => 'Failed to load trip details. Please try again later.');
        })
      );
  }

  // Create a new trip
  createTrip(trip: Itinerary): Observable<Itinerary> {
    if (this.mockMode) {
      const newTrip = {
        ...trip,
        id: Date.now().toString(),
        userId: '1'
      };
      return of(newTrip);
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.post<Itinerary>(this.apiUrl, trip, { headers })
      .pipe(
        catchError(error => {
          console.error('Error creating trip:', error);
          return throwError(() => 'Failed to create trip. Please try again later.');
        })
      );
  }

  // Update an existing trip
  updateTrip(tripId: string, trip: Itinerary): Observable<Itinerary> {
    if (this.mockMode) {
      return of({
        ...trip,
        id: tripId
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.put<Itinerary>(`${this.apiUrl}/${tripId}`, trip, { headers })
      .pipe(
        catchError(error => {
          console.error('Error updating trip:', error);
          return throwError(() => 'Failed to update trip. Please try again later.');
        })
      );
  }

  // Delete a trip
  deleteTrip(tripId: string): Observable<any> {
    if (this.mockMode) {
      return of({ success: true });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${tripId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error deleting trip:', error);
          return throwError(() => 'Failed to delete trip. Please try again later.');
        })
      );
  }

  // Add an activity to a trip
  addActivity(tripId: string, activity: Activity): Observable<Activity> {
    if (this.mockMode) {
      return of({
        ...activity,
        id: Date.now().toString()
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.post<Activity>(`${this.apiUrl}/${tripId}/activities`, activity, { headers })
      .pipe(
        catchError(error => {
          console.error('Error adding activity:', error);
          return throwError(() => 'Failed to add activity. Please try again later.');
        })
      );
  }

  // Update an activity
  updateActivity(tripId: string, activityId: string, activity: Activity): Observable<Activity> {
    if (this.mockMode) {
      return of({
        ...activity,
        id: activityId
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.put<Activity>(`${this.apiUrl}/${tripId}/activities/${activityId}`, activity, { headers })
      .pipe(
        catchError(error => {
          console.error('Error updating activity:', error);
          return throwError(() => 'Failed to update activity. Please try again later.');
        })
      );
  }

  // Delete an activity
  deleteActivity(tripId: string, activityId: string): Observable<any> {
    if (this.mockMode) {
      return of({ success: true });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${tripId}/activities/${activityId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error deleting activity:', error);
          return throwError(() => 'Failed to delete activity. Please try again later.');
        })
      );
  }

  // Add accommodation to a trip
  addAccommodation(tripId: string, accommodation: Accommodation): Observable<Accommodation> {
    if (this.mockMode) {
      return of({
        ...accommodation,
        id: Date.now().toString()
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.post<Accommodation>(`${this.apiUrl}/${tripId}/accommodations`, accommodation, { headers })
      .pipe(
        catchError(error => {
          console.error('Error adding accommodation:', error);
          return throwError(() => 'Failed to add accommodation. Please try again later.');
        })
      );
  }

  // Update accommodation
  updateAccommodation(tripId: string, accommodationId: string, accommodation: Accommodation): Observable<Accommodation> {
    if (this.mockMode) {
      return of({
        ...accommodation,
        id: accommodationId
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.put<Accommodation>(
      `${this.apiUrl}/${tripId}/accommodations/${accommodationId}`,
      accommodation,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error updating accommodation:', error);
        return throwError(() => 'Failed to update accommodation. Please try again later.');
      })
    );
  }

  // Delete accommodation
  deleteAccommodation(tripId: string, accommodationId: string): Observable<any> {
    if (this.mockMode) {
      return of({ success: true });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${tripId}/accommodations/${accommodationId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error deleting accommodation:', error);
          return throwError(() => 'Failed to delete accommodation. Please try again later.');
        })
      );
  }

  // Add transportation to a trip
  addTransportation(tripId: string, transportation: Transportation): Observable<Transportation> {
    if (this.mockMode) {
      return of({
        ...transportation,
        id: Date.now().toString()
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.post<Transportation>(`${this.apiUrl}/${tripId}/transportation`, transportation, { headers })
      .pipe(
        catchError(error => {
          console.error('Error adding transportation:', error);
          return throwError(() => 'Failed to add transportation. Please try again later.');
        })
      );
  }

  // Update transportation
  updateTransportation(
    tripId: string,
    transportationId: string,
    transportation: Transportation
  ): Observable<Transportation> {
    if (this.mockMode) {
      return of({
        ...transportation,
        id: transportationId
      });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.put<Transportation>(
      `${this.apiUrl}/${tripId}/transportation/${transportationId}`,
      transportation,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Error updating transportation:', error);
        return throwError(() => 'Failed to update transportation. Please try again later.');
      })
    );
  }

  // Delete transportation
  deleteTransportation(tripId: string, transportationId: string): Observable<any> {
    if (this.mockMode) {
      return of({ success: true });
    }

    const headers = this.authService.getAuthHeaders();

    return this.http.delete(`${this.apiUrl}/${tripId}/transportation/${transportationId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error deleting transportation:', error);
          return throwError(() => 'Failed to delete transportation. Please try again later.');
        })
      );
  }

  // Mock data for testing without backend
  private getMockItineraries(): Itinerary[] {
    return [
      {
        id: '1',
        userId: '1',
        name: 'Summer in Europe',
        destination: 'Europe (Multiple Countries)',
        startDate: '2025-06-15',
        endDate: '2025-06-28',
        activities: [
          {
            id: 'a1',
            name: 'Eiffel Tower Visit',
            date: '2025-06-16',
            time: '10:00',
            location: 'Paris, France',
            cost: 25,
            notes: 'Book tickets in advance to avoid long queues',
            booked: true
          },
          {
            id: 'a2',
            name: 'Vatican Museum Tour',
            date: '2025-06-20',
            time: '09:30',
            location: 'Vatican City, Rome',
            cost: 45,
            notes: 'Guided tour, meeting point at museum entrance',
            booked: true
          }
        ],
        accommodations: [
          {
            id: 'acc1',
            name: 'Hotel Montmartre',
            checkIn: '2025-06-15',
            checkOut: '2025-06-18',
            location: 'Paris, France',
            cost: 450,
            confirmation: 'HM123456',
            notes: 'Breakfast included, metro station nearby'
          },
          {
            id: 'acc2',
            name: 'Grand Italia Hotel',
            checkIn: '2025-06-18',
            checkOut: '2025-06-22',
            location: 'Rome, Italy',
            cost: 580,
            confirmation: 'GI789012',
            notes: 'City center location, walking distance to Colosseum'
          }
        ],
        transportation: [
          {
            id: 't1',
            type: 'flight',
            from: 'New York JFK',
            to: 'Paris CDG',
            departureDate: '2025-06-15',
            departureTime: '18:30',
            arrivalDate: '2025-06-16',
            arrivalTime: '08:15',
            carrier: 'Air France',
            confirmation: 'AF456789',
            cost: 950,
            notes: 'Terminal 1, Economy Plus'
          },
          {
            id: 't2',
            type: 'train',
            from: 'Paris Gare de Lyon',
            to: 'Rome Termini',
            departureDate: '2025-06-18',
            departureTime: '10:00',
            arrivalDate: '2025-06-18',
            arrivalTime: '18:30',
            carrier: 'EuroRail',
            confirmation: 'ER123456',
            cost: 175,
            notes: 'First class, seat reservation included'
          }
        ],
        totalBudget: 3000,
        notes: 'First family trip to Europe. Focus on historical sites and local cuisine.'
      },
      {
        id: '2',
        userId: '1',
        name: 'Asian Adventure',
        destination: 'Japan & Thailand',
        startDate: '2025-09-10',
        endDate: '2025-09-24',
        activities: [
          {
            id: 'a3',
            name: 'Tokyo Tower Visit',
            date: '2025-09-12',
            time: '14:00',
            location: 'Tokyo, Japan',
            cost: 30,
            notes: 'Go during sunset for the best views',
            booked: true
          },
          {
            id: 'a4',
            name: 'Elephant Sanctuary Tour',
            date: '2025-09-18',
            time: '09:00',
            location: 'Chiang Mai, Thailand',
            cost: 60,
            notes: 'Full day tour, includes lunch',
            booked: true
          }
        ],
        accommodations: [
          {
            id: 'acc3',
            name: 'Shinjuku Capsule Hotel',
            checkIn: '2025-09-10',
            checkOut: '2025-09-15',
            location: 'Tokyo, Japan',
            cost: 500,
            confirmation: 'SH567890',
            notes: 'Central location, small rooms but great amenities'
          },
          {
            id: 'acc4',
            name: 'Riverside Resort',
            checkIn: '2025-09-15',
            checkOut: '2025-09-24',
            location: 'Chiang Mai, Thailand',
            cost: 700,
            confirmation: 'RR123789',
            notes: 'Pool access, free shuttle to night market'
          }
        ],
        transportation: [
          {
            id: 't3',
            type: 'flight',
            from: 'San Francisco SFO',
            to: 'Tokyo NRT',
            departureDate: '2025-09-10',
            departureTime: '13:45',
            arrivalDate: '2025-09-11',
            arrivalTime: '17:30',
            carrier: 'JAL',
            confirmation: 'JAL789012',
            cost: 1200,
            notes: 'Premium economy, extra legroom'
          },
          {
            id: 't4',
            type: 'flight',
            from: 'Tokyo NRT',
            to: 'Chiang Mai CNX',
            departureDate: '2025-09-15',
            departureTime: '09:30',
            arrivalDate: '2025-09-15',
            arrivalTime: '14:45',
            carrier: 'Thai Airways',
            confirmation: 'TA567123',
            cost: 350,
            notes: 'Economy class, 1 checked bag'
          }
        ],
        totalBudget: 4500,
        notes: 'First time in Asia, focus on cultural experiences and food tours'
      }
    ];
  }
}

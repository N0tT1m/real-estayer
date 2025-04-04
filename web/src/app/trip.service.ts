import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Itinerary {
  id?: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  activities: Activity[];
  accommodations: Accommodation[];
  transportation: Transportation[];
  totalBudget: number;
  notes?: string;
  // Add theme property to fix errors
  theme?: string;
}

export interface Activity {
  id?: string;
  name: string;
  date: string;
  time: string;
  location: string;
  cost: number;
  notes: string;
  booked: boolean;
  // Add type property to fix errors
  type?: string;
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
  // Add type property to fix errors
  type?: string;
  // Add url property to fix errors
  url?: string;
}

export interface Transportation {
  id?: string;
  type: string;
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

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private apiUrl = 'http://localhost:5000/api/trips';
  private mockTrips: Itinerary[] = [];

  constructor(private http: HttpClient) {
    this.initializeMockTrips();
  }

  // Get all trips for the current user
  getUserTrips(): Observable<Itinerary[]> {
    // In a real app, this would make an HTTP request
    // return this.http.get<Itinerary[]>(`${this.apiUrl}`);

    // Mock implementation
    return of(this.mockTrips).pipe(
      catchError(this.handleError<Itinerary[]>('getUserTrips', []))
    );
  }

  // Get a specific trip by ID
  getTripById(id: string): Observable<Itinerary> {
    // In a real app, this would make an HTTP request
    // return this.http.get<Itinerary>(`${this.apiUrl}/${id}`);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === id);

    if (!trip) {
      return throwError('Trip not found');
    }

    return of(trip).pipe(
      catchError(this.handleError<Itinerary>('getTripById', {} as Itinerary))
    );
  }

  // Create a new trip
  createTrip(trip: Itinerary): Observable<Itinerary> {
    // In a real app, this would make an HTTP request
    // return this.http.post<Itinerary>(`${this.apiUrl}`, trip);

    // Mock implementation
    const newTrip: Itinerary = {
      ...trip,
      id: Math.random().toString(36).substring(2, 11),
      activities: [],
      accommodations: [],
      transportation: []
    };

    this.mockTrips.push(newTrip);

    return of(newTrip).pipe(
      catchError(this.handleError<Itinerary>('createTrip', {} as Itinerary))
    );
  }

  // Update a trip
  updateTrip(id: string, trip: Itinerary): Observable<Itinerary> {
    // In a real app, this would make an HTTP request
    // return this.http.put<Itinerary>(`${this.apiUrl}/${id}`, trip);

    // Mock implementation
    const index = this.mockTrips.findIndex(t => t.id === id);

    if (index === -1) {
      return throwError('Trip not found');
    }

    this.mockTrips[index] = {
      ...this.mockTrips[index],
      ...trip,
      id: id // Ensure ID doesn't change
    };

    return of(this.mockTrips[index]).pipe(
      catchError(this.handleError<Itinerary>('updateTrip', {} as Itinerary))
    );
  }

  // Delete a trip
  deleteTrip(id: string): Observable<boolean> {
    // In a real app, this would make an HTTP request
    // return this.http.delete<boolean>(`${this.apiUrl}/${id}`);

    // Mock implementation
    const index = this.mockTrips.findIndex(t => t.id === id);

    if (index === -1) {
      return throwError('Trip not found');
    }

    this.mockTrips.splice(index, 1);

    return of(true).pipe(
      catchError(this.handleError<boolean>('deleteTrip', false))
    );
  }

  // ACTIVITY MANAGEMENT
  addActivity(tripId: string, activity: Activity): Observable<Activity> {
    // In a real app, this would make an HTTP request
    // return this.http.post<Activity>(`${this.apiUrl}/${tripId}/activities`, activity);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const newActivity: Activity = {
      ...activity,
      id: Math.random().toString(36).substring(2, 11)
    };

    trip.activities.push(newActivity);

    return of(newActivity).pipe(
      catchError(this.handleError<Activity>('addActivity', {} as Activity))
    );
  }

  updateActivity(tripId: string, activityId: string, activity: Activity): Observable<Activity> {
    // In a real app, this would make an HTTP request
    // return this.http.put<Activity>(`${this.apiUrl}/${tripId}/activities/${activityId}`, activity);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const activityIndex = trip.activities.findIndex(a => a.id === activityId);

    if (activityIndex === -1) {
      return throwError('Activity not found');
    }

    const updatedActivity: Activity = {
      ...activity,
      id: activityId
    };

    trip.activities[activityIndex] = updatedActivity;

    return of(updatedActivity).pipe(
      catchError(this.handleError<Activity>('updateActivity', {} as Activity))
    );
  }

  deleteActivity(tripId: string, activityId: string): Observable<boolean> {
    // In a real app, this would make an HTTP request
    // return this.http.delete<boolean>(`${this.apiUrl}/${tripId}/activities/${activityId}`);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const activityIndex = trip.activities.findIndex(a => a.id === activityId);

    if (activityIndex === -1) {
      return throwError('Activity not found');
    }

    trip.activities.splice(activityIndex, 1);

    return of(true).pipe(
      catchError(this.handleError<boolean>('deleteActivity', false))
    );
  }

  // ACCOMMODATION MANAGEMENT
  addAccommodation(tripId: string, accommodation: Accommodation): Observable<Accommodation> {
    // In a real app, this would make an HTTP request
    // return this.http.post<Accommodation>(`${this.apiUrl}/${tripId}/accommodations`, accommodation);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const newAccommodation: Accommodation = {
      ...accommodation,
      id: Math.random().toString(36).substring(2, 11)
    };

    trip.accommodations.push(newAccommodation);

    return of(newAccommodation).pipe(
      catchError(this.handleError<Accommodation>('addAccommodation', {} as Accommodation))
    );
  }

  updateAccommodation(tripId: string, accommodationId: string, accommodation: Accommodation): Observable<Accommodation> {
    // In a real app, this would make an HTTP request
    // return this.http.put<Accommodation>(`${this.apiUrl}/${tripId}/accommodations/${accommodationId}`, accommodation);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const accommodationIndex = trip.accommodations.findIndex(a => a.id === accommodationId);

    if (accommodationIndex === -1) {
      return throwError('Accommodation not found');
    }

    const updatedAccommodation: Accommodation = {
      ...accommodation,
      id: accommodationId
    };

    trip.accommodations[accommodationIndex] = updatedAccommodation;

    return of(updatedAccommodation).pipe(
      catchError(this.handleError<Accommodation>('updateAccommodation', {} as Accommodation))
    );
  }

  deleteAccommodation(tripId: string, accommodationId: string): Observable<boolean> {
    // In a real app, this would make an HTTP request
    // return this.http.delete<boolean>(`${this.apiUrl}/${tripId}/accommodations/${accommodationId}`);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const accommodationIndex = trip.accommodations.findIndex(a => a.id === accommodationId);

    if (accommodationIndex === -1) {
      return throwError('Accommodation not found');
    }

    trip.accommodations.splice(accommodationIndex, 1);

    return of(true).pipe(
      catchError(this.handleError<boolean>('deleteAccommodation', false))
    );
  }

  // TRANSPORTATION MANAGEMENT
  addTransportation(tripId: string, transportation: Transportation): Observable<Transportation> {
    // In a real app, this would make an HTTP request
    // return this.http.post<Transportation>(`${this.apiUrl}/${tripId}/transportation`, transportation);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const newTransportation: Transportation = {
      ...transportation,
      id: Math.random().toString(36).substring(2, 11)
    };

    trip.transportation.push(newTransportation);

    return of(newTransportation).pipe(
      catchError(this.handleError<Transportation>('addTransportation', {} as Transportation))
    );
  }

  updateTransportation(tripId: string, transportationId: string, transportation: Transportation): Observable<Transportation> {
    // In a real app, this would make an HTTP request
    // return this.http.put<Transportation>(`${this.apiUrl}/${tripId}/transportation/${transportationId}`, transportation);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const transportationIndex = trip.transportation.findIndex(t => t.id === transportationId);

    if (transportationIndex === -1) {
      return throwError('Transportation not found');
    }

    const updatedTransportation: Transportation = {
      ...transportation,
      id: transportationId
    };

    trip.transportation[transportationIndex] = updatedTransportation;

    return of(updatedTransportation).pipe(
      catchError(this.handleError<Transportation>('updateTransportation', {} as Transportation))
    );
  }

  deleteTransportation(tripId: string, transportationId: string): Observable<boolean> {
    // In a real app, this would make an HTTP request
    // return this.http.delete<boolean>(`${this.apiUrl}/${tripId}/transportation/${transportationId}`);

    // Mock implementation
    const trip = this.mockTrips.find(t => t.id === tripId);

    if (!trip) {
      return throwError('Trip not found');
    }

    const transportationIndex = trip.transportation.findIndex(t => t.id === transportationId);

    if (transportationIndex === -1) {
      return throwError('Transportation not found');
    }

    trip.transportation.splice(transportationIndex, 1);

    return of(true).pipe(
      catchError(this.handleError<boolean>('deleteTransportation', false))
    );
  }

  // Generic error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }

  // Initialize mock trips
  private initializeMockTrips() {
    this.mockTrips = [
      {
        id: '1',
        name: 'Summer in Italy',
        destination: 'Rome, Florence, Venice',
        startDate: '2025-06-10',
        endDate: '2025-06-24',
        activities: [
          {
            id: 'a1',
            name: 'Colosseum Tour',
            date: '2025-06-11',
            time: '10:00',
            location: 'Rome, Italy',
            cost: 45,
            notes: 'Meet guide at south entrance',
            booked: true,
            type: 'cultural'
          },
          {
            id: 'a2',
            name: 'Vatican Museums',
            date: '2025-06-12',
            time: '09:00',
            location: 'Vatican City',
            cost: 35,
            notes: 'Skip the line tickets',
            booked: true,
            type: 'cultural'
          }
        ],
        accommodations: [
          {
            id: 'ac1',
            name: 'Hotel Roma',
            checkIn: '2025-06-10',
            checkOut: '2025-06-15',
            location: 'Rome, Italy',
            cost: 650,
            confirmation: 'HR-123456',
            notes: 'Breakfast included',
            type: 'hotel',
            url: 'https://example.com/hotel-roma'
          },
          {
            id: 'ac2',
            name: 'Florence Apartment',
            checkIn: '2025-06-15',
            checkOut: '2025-06-20',
            location: 'Florence, Italy',
            cost: 580,
            confirmation: 'FL-789012',
            notes: 'Key pickup at agency next door',
            type: 'apartment',
            url: 'https://example.com/florence-apt'
          }
        ],
        transportation: [
          {
            id: 't1',
            type: 'flight',
            from: 'JFK Airport',
            to: 'Rome Fiumicino Airport',
            departureDate: '2025-06-10',
            departureTime: '18:30',
            arrivalDate: '2025-06-11',
            arrivalTime: '08:45',
            carrier: 'Alitalia',
            confirmation: 'AL-345678',
            cost: 950,
            notes: 'Economy Plus'
          },
          {
            id: 't2',
            type: 'train',
            from: 'Rome',
            to: 'Florence',
            departureDate: '2025-06-15',
            departureTime: '10:15',
            arrivalDate: '2025-06-15',
            arrivalTime: '11:45',
            carrier: 'Trenitalia',
            confirmation: 'TI-901234',
            cost: 65,
            notes: 'First class'
          }
        ],
        totalBudget: 3500,
        notes: 'Family vacation, focus on history and food',
        theme: 'cultural'
      },
      {
        id: '2',
        name: 'Japan Cherry Blossom Tour',
        destination: 'Tokyo, Kyoto, Osaka',
        startDate: '2025-03-22',
        endDate: '2025-04-05',
        activities: [],
        accommodations: [],
        transportation: [],
        totalBudget: 4200,
        notes: 'Photography focus, want to see cherry blossoms',
        theme: 'cultural'
      }
    ];
  }
}

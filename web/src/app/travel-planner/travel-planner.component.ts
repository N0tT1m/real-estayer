import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TripService, Itinerary, Activity, Accommodation, Transportation } from '../trip.service'; // Path fixed
import { ListingService } from '../listings.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-travel-planner',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, MatTabsModule, DatePipe, NgClass, TitleCasePipe],
  templateUrl: './travel-planner.component.html',
  styleUrls: ['./travel-planner.component.sass', '../app.component.sass']
})
export class TravelPlannerComponent implements OnInit {
  // Itinerary management
  public itineraries: Itinerary[] = [];
  public selectedItinerary: Itinerary | null = null;
  public tripDays: Date[] = [];

  // Form states
  public showNewItineraryForm: boolean = false;
  public itineraryForm: FormGroup;
  public activityForm: FormGroup;
  public accommodationForm: FormGroup;
  transportationForm: FormGroup;
  submitted: boolean = false;
  formSubmitting: boolean = false;

  // Application state
  loading: boolean = false;
  error: string = '';

  // Detail view states
  showingActivityForm: boolean = false;
  showingAccommodationForm: boolean = false;
  showingTransportationForm: boolean = false;
  editingActivity: string | null = null;
  editingAccommodation: string | null = null;
  editingTransportation: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private tripService: TripService,
    private listingService: ListingService
  ) {
    this.itineraryForm = this.formBuilder.group({
      name: ['', Validators.required],
      destination: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: [''],
      travelers: ['1'],
      notes: ['']
    });

    this.activityForm = this.formBuilder.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      time: [''],
      location: [''],
      cost: [0],
      notes: [''],
      booked: [false]
    });

    this.accommodationForm = this.formBuilder.group({
      name: ['', Validators.required],
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      location: [''],
      cost: [0],
      confirmation: [''],
      notes: ['']
    });

    this.transportationForm = this.formBuilder.group({
      type: ['flight', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      departureDate: ['', Validators.required],
      departureTime: [''],
      arrivalDate: ['', Validators.required],
      arrivalTime: [''],
      carrier: [''],
      confirmation: [''],
      cost: [0],
      notes: ['']
    });
  }

  ngOnInit() {
    this.loadTrips();
  }

  // Convenience getter for form fields
  get f() { return this.itineraryForm.controls; }

  // Load user trips
  loadTrips() {
    this.loading = true;
    this.error = '';

    this.tripService.getUserTrips()
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : 'Failed to load trips. Please try again.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((trips: Itinerary[]) => {
        this.itineraries = trips;
      });
  }

  // ITINERARY MANAGEMENT
  createItinerary() {
    this.submitted = true;

    if (this.itineraryForm.invalid) {
      return;
    }

    this.formSubmitting = true;

    const newItinerary: Itinerary = {
      name: this.f['name'].value,
      destination: this.f['destination'].value,
      startDate: this.f['startDate'].value,
      endDate: this.f['endDate'].value,
      activities: [],
      accommodations: [],
      transportation: [],
      totalBudget: this.f['budget'].value || 0,
      notes: this.f['notes'].value
    };

    this.tripService.createTrip(newItinerary)
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : 'Failed to create trip. Please try again.';
          return of(null);
        }),
        finalize(() => {
          this.formSubmitting = false;
        })
      )
      .subscribe((trip: Itinerary | null) => {
        if (trip) {
          this.itineraries.push(trip);
          this.showNewItineraryForm = false;
          this.itineraryForm.reset();
          this.submitted = false;
        }
      });
  }

  cancelNewItinerary() {
    this.showNewItineraryForm = false;
    this.itineraryForm.reset();
    this.submitted = false;
  }

  viewItinerary(id: string | undefined) {
    if (!id) return;

    this.loading = true;

    this.tripService.getTripById(id)
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : `Failed to load trip details. Please try again.`;
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((trip: Itinerary | null) => {
        if (trip) {
          this.selectedItinerary = trip;
          this.generateTripDays();
        }
      });
  }

  editItinerary(id: string | undefined) {
    if (!id) return;

    const itinerary = this.itineraries.find(i => i.id === id);
    if (itinerary) {
      this.itineraryForm.patchValue({
        name: itinerary.name,
        destination: itinerary.destination,
        startDate: itinerary.startDate,
        endDate: itinerary.endDate,
        budget: itinerary.totalBudget,
        notes: itinerary.notes
      });

      this.showNewItineraryForm = true;
    }
  }

  deleteItinerary(id: string | undefined) {
    if (!id) return;

    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      this.loading = true;

      this.tripService.deleteTrip(id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete trip. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.itineraries = this.itineraries.filter(i => i.id !== id);
            if (this.selectedItinerary && this.selectedItinerary.id === id) {
              this.selectedItinerary = null;
            }
          }
        });
    }
  }

  closeDetail() {
    this.selectedItinerary = null;
  }

  // ACTIVITY MANAGEMENT
  showActivityForm() {
    this.showingActivityForm = true;
    this.editingActivity = null;
    this.activityForm.reset({
      booked: false,
      cost: 0
    });

    // Set default date to first day of trip
    if (this.selectedItinerary) {
      this.activityForm.patchValue({
        date: this.selectedItinerary.startDate
      });
    }
  }

  addActivityForm(day: Date) {
    this.showingActivityForm = true;
    this.editingActivity = null;
    this.activityForm.reset({
      booked: false,
      cost: 0,
      date: day.toISOString().split('T')[0]
    });
  }

  editActivity(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    const activity = this.selectedItinerary.activities.find((a: Activity) => a.id === id);
    if (activity) {
      this.editingActivity = id;
      this.activityForm.patchValue({
        name: activity.name,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        cost: activity.cost,
        notes: activity.notes,
        booked: activity.booked
      });
      this.showingActivityForm = true;
    }
  }

  saveActivity() {
    if (this.activityForm.invalid || !this.selectedItinerary) {
      return;
    }

    this.formSubmitting = true;

    const activityData: Activity = {
      name: this.activityForm.value.name,
      date: this.activityForm.value.date,
      time: this.activityForm.value.time || '00:00',
      location: this.activityForm.value.location || '',
      cost: this.activityForm.value.cost || 0,
      notes: this.activityForm.value.notes || '',
      booked: this.activityForm.value.booked
    };

    if (this.editingActivity) {
      // Update existing activity
      this.tripService.updateActivity(this.selectedItinerary.id!, this.editingActivity, activityData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to update activity. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((updatedActivity: Activity | null) => {
          if (updatedActivity) {
            const index = this.selectedItinerary!.activities.findIndex((a: Activity) => a.id === this.editingActivity);
            if (index !== -1) {
              this.selectedItinerary!.activities[index] = updatedActivity;
            }
            this.showingActivityForm = false;
            this.editingActivity = null;
            this.activityForm.reset();
          }
        });
    } else {
      // Add new activity
      this.tripService.addActivity(this.selectedItinerary.id!, activityData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to add activity. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((newActivity: Activity | null) => {
          if (newActivity) {
            this.selectedItinerary!.activities.push(newActivity);
            // Sort activities by date and time
            this.selectedItinerary!.activities.sort((a: Activity, b: Activity) => {
              const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
              if (dateCompare === 0) {
                return a.time.localeCompare(b.time);
              }
              return dateCompare;
            });
            this.showingActivityForm = false;
            this.activityForm.reset();
          }
        });
    }
  }

  cancelActivityForm() {
    this.showingActivityForm = false;
    this.editingActivity = null;
    this.activityForm.reset();
  }

  deleteActivity(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    if (confirm('Are you sure you want to delete this activity?')) {
      this.tripService.deleteActivity(this.selectedItinerary.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete activity. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedItinerary!.activities = this.selectedItinerary!.activities.filter((a: Activity) => a.id !== id);
          }
        });
    }
  }

  // ACCOMMODATION MANAGEMENT
  showAccommodationForm() {
    this.showingAccommodationForm = true;
    this.editingAccommodation = null;
    this.accommodationForm.reset({
      cost: 0
    });

    // Set default check-in/out dates
    if (this.selectedItinerary) {
      this.accommodationForm.patchValue({
        checkIn: this.selectedItinerary.startDate,
        checkOut: this.selectedItinerary.endDate
      });
    }
  }

  editAccommodation(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    const accommodation = this.selectedItinerary.accommodations.find((a: Accommodation) => a.id === id);
    if (accommodation) {
      this.editingAccommodation = id;
      this.accommodationForm.patchValue({
        name: accommodation.name,
        checkIn: accommodation.checkIn,
        checkOut: accommodation.checkOut,
        location: accommodation.location,
        cost: accommodation.cost,
        confirmation: accommodation.confirmation,
        notes: accommodation.notes
      });
      this.showingAccommodationForm = true;
    }
  }

  saveAccommodation() {
    if (this.accommodationForm.invalid || !this.selectedItinerary) {
      return;
    }

    this.formSubmitting = true;

    const accommodationData: Accommodation = {
      name: this.accommodationForm.value.name,
      checkIn: this.accommodationForm.value.checkIn,
      checkOut: this.accommodationForm.value.checkOut,
      location: this.accommodationForm.value.location || '',
      cost: this.accommodationForm.value.cost || 0,
      confirmation: this.accommodationForm.value.confirmation || '',
      notes: this.accommodationForm.value.notes || ''
    };

    if (this.editingAccommodation) {
      // Update existing accommodation
      this.tripService.updateAccommodation(this.selectedItinerary.id!, this.editingAccommodation, accommodationData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to update accommodation. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((updatedAccommodation: Accommodation | null) => {
          if (updatedAccommodation) {
            const index = this.selectedItinerary!.accommodations.findIndex((a: Accommodation) => a.id === this.editingAccommodation);
            if (index !== -1) {
              this.selectedItinerary!.accommodations[index] = updatedAccommodation;
            }
            this.showingAccommodationForm = false;
            this.editingAccommodation = null;
            this.accommodationForm.reset();
          }
        });
    } else {
      // Add new accommodation
      this.tripService.addAccommodation(this.selectedItinerary.id!, accommodationData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to add accommodation. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((newAccommodation: Accommodation | null) => {
          if (newAccommodation) {
            this.selectedItinerary!.accommodations.push(newAccommodation);
            // Sort accommodations by check-in date
            this.selectedItinerary!.accommodations.sort((a: Accommodation, b: Accommodation) => {
              return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
            });
            this.showingAccommodationForm = false;
            this.accommodationForm.reset();
          }
        });
    }
  }

  cancelAccommodationForm() {
    this.showingAccommodationForm = false;
    this.editingAccommodation = null;
    this.accommodationForm.reset();
  }

  deleteAccommodation(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    if (confirm('Are you sure you want to delete this accommodation?')) {
      this.tripService.deleteAccommodation(this.selectedItinerary.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete accommodation. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedItinerary!.accommodations = this.selectedItinerary!.accommodations.filter((a: Accommodation) => a.id !== id);
          }
        });
    }
  }

  // TRANSPORTATION MANAGEMENT
  showTransportationForm() {
    this.showingTransportationForm = true;
    this.editingTransportation = null;
    this.transportationForm.reset({
      type: 'flight',
      cost: 0
    });

    // Set default departure/arrival dates
    if (this.selectedItinerary) {
      this.transportationForm.patchValue({
        departureDate: this.selectedItinerary.startDate,
        arrivalDate: this.selectedItinerary.startDate
      });
    }
  }

  editTransportation(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    const transportation = this.selectedItinerary.transportation.find((t: Transportation) => t.id === id);
    if (transportation) {
      this.editingTransportation = id;
      this.transportationForm.patchValue({
        type: transportation.type,
        from: transportation.from,
        to: transportation.to,
        departureDate: transportation.departureDate,
        departureTime: transportation.departureTime,
        arrivalDate: transportation.arrivalDate,
        arrivalTime: transportation.arrivalTime,
        carrier: transportation.carrier,
        confirmation: transportation.confirmation,
        cost: transportation.cost,
        notes: transportation.notes
      });
      this.showingTransportationForm = true;
    }
  }

  saveTransportation() {
    if (this.transportationForm.invalid || !this.selectedItinerary) {
      return;
    }

    this.formSubmitting = true;

    const transportationData: Transportation = {
      type: this.transportationForm.value.type,
      from: this.transportationForm.value.from,
      to: this.transportationForm.value.to,
      departureDate: this.transportationForm.value.departureDate,
      departureTime: this.transportationForm.value.departureTime || '00:00',
      arrivalDate: this.transportationForm.value.arrivalDate,
      arrivalTime: this.transportationForm.value.arrivalTime || '00:00',
      carrier: this.transportationForm.value.carrier || '',
      confirmation: this.transportationForm.value.confirmation || '',
      cost: this.transportationForm.value.cost || 0,
      notes: this.transportationForm.value.notes || ''
    };

    if (this.editingTransportation) {
      // Update existing transportation
      this.tripService.updateTransportation(this.selectedItinerary.id!, this.editingTransportation, transportationData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to update transportation. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((updatedTransportation: Transportation | null) => {
          if (updatedTransportation) {
            const index = this.selectedItinerary!.transportation.findIndex((t: Transportation) => t.id === this.editingTransportation);
            if (index !== -1) {
              this.selectedItinerary!.transportation[index] = updatedTransportation;
            }
            this.showingTransportationForm = false;
            this.editingTransportation = null;
            this.transportationForm.reset({
              type: 'flight'
            });
          }
        });
    } else {
      // Add new transportation
      this.tripService.addTransportation(this.selectedItinerary.id!, transportationData)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to add transportation. Please try again.';
            return of(null);
          }),
          finalize(() => {
            this.formSubmitting = false;
          })
        )
        .subscribe((newTransportation: Transportation | null) => {
          if (newTransportation) {
            this.selectedItinerary!.transportation.push(newTransportation);
            // Sort transportation by departure date and time
            this.selectedItinerary!.transportation.sort((a: Transportation, b: Transportation) => {
              const dateCompare = new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
              if (dateCompare === 0) {
                return a.departureTime.localeCompare(b.departureTime);
              }
              return dateCompare;
            });
            this.showingTransportationForm = false;
            this.transportationForm.reset({
              type: 'flight'
            });
          }
        });
    }
  }

  cancelTransportationForm() {
    this.showingTransportationForm = false;
    this.editingTransportation = null;
    this.transportationForm.reset({
      type: 'flight'
    });
  }

  deleteTransportation(id: string | undefined) {
    if (!id || !this.selectedItinerary) return;

    if (confirm('Are you sure you want to delete this transportation?')) {
      this.tripService.deleteTransportation(this.selectedItinerary.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete transportation. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedItinerary!.transportation = this.selectedItinerary!.transportation.filter((t: Transportation) => t.id !== id);
          }
        });
    }
  }

  // HELPER METHODS
  generateTripDays() {
    this.tripDays = [];
    if (this.selectedItinerary) {
      const startDate = new Date(this.selectedItinerary.startDate);
      const endDate = new Date(this.selectedItinerary.endDate);

      // Create array of days
      let currentDay = new Date(startDate);
      while (currentDay <= endDate) {
        this.tripDays.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
  }

  getActivitiesForDay(day: Date): Activity[] {
    if (!this.selectedItinerary) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedItinerary.activities.filter((activity: Activity) => {
      return activity.date === dayString;
    });
  }

  getAccommodationForDay(day: Date): Accommodation[] {
    if (!this.selectedItinerary) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedItinerary.accommodations.filter((accommodation: Accommodation) => {
      const checkIn = accommodation.checkIn;
      const checkOut = accommodation.checkOut;

      // Check if the day falls between check-in and check-out
      return dayString >= checkIn && dayString < checkOut;
    });
  }

  getTransportationForDay(day: Date): Transportation[] {
    if (!this.selectedItinerary) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedItinerary.transportation.filter((transportation: Transportation) => {
      return transportation.departureDate === dayString || transportation.arrivalDate === dayString;
    });
  }

  hasEventsForDay(day: Date): boolean {
    return this.getActivitiesForDay(day).length > 0 ||
      this.getAccommodationForDay(day).length > 0 ||
      this.getTransportationForDay(day).length > 0;
  }

  get totalSpent(): number {
    if (!this.selectedItinerary) return 0;

    const activityCosts = this.selectedItinerary.activities.reduce((sum: number, activity: Activity) => sum + activity.cost, 0);
    const accommodationCosts = this.selectedItinerary.accommodations.reduce((sum: number, accommodation: Accommodation) => sum + accommodation.cost, 0);
    const transportationCosts = this.selectedItinerary.transportation.reduce((sum: number, transportation: Transportation) => sum + transportation.cost, 0);

    return activityCosts + accommodationCosts + transportationCosts;
  }

  get tripDuration(): number {
    if (!this.selectedItinerary) return 0;

    const startDate = new Date(this.selectedItinerary.startDate);
    const endDate = new Date(this.selectedItinerary.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }

  // INTEGRATION WITH LISTINGS
  searchForAccommodations() {
    if (!this.selectedItinerary) return;

    // Using the ListingService to find accommodations for the trip destination
    this.loading = true;

    const searchOptions = {
      location: this.selectedItinerary.destination,
      checkIn: this.selectedItinerary.startDate,
      checkOut: this.selectedItinerary.endDate,
      limit: 5
    };

    this.listingService.searchListings(searchOptions)
      .pipe(
        catchError(err => {
          console.error('Error searching for accommodations:', err);
          this.error = 'Unable to find accommodations. Please try again later.';
          return of({
            listings: [],
            totalCount: 0,
            pageCount: 0,
            currentPage: 1
          });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(results => {
        if (results && results.listings && results.listings.length > 0) {
          // Show accommodation suggestion UI
          this.showAccommodationSuggestions(results.listings);
        } else {
          this.error = 'No accommodations found for your destination and dates.';
        }
      });
  }

  showAccommodationSuggestions(listings: any[]) {
    // This method would open a modal or panel showing accommodation suggestions
    // For simplicity in this example, we'll just add the first listing as an accommodation
    if (listings.length > 0 && this.selectedItinerary) {
      const listing = listings[0];

      // Parse price (remove $ and convert to number)
      const priceStr = listing.price || '0';
      const price = parseFloat(priceStr.replace(/[^0-9.-]+/g, ''));

      const newAccommodation: Accommodation = {
        name: listing.title || 'Accommodation',
        location: listing.location || this.selectedItinerary.destination,
        checkIn: this.selectedItinerary.startDate,
        checkOut: this.selectedItinerary.endDate,
        cost: price,
        confirmation: '',
        notes: listing.description || ''
      };

      // Pre-fill the accommodation form
      this.accommodationForm.patchValue(newAccommodation);
      this.showingAccommodationForm = true;
    }
  }

  // Sharing and export functionality
  shareItinerary() {
    if (!this.selectedItinerary) return;

    // In a real application, this would generate a shareable link
    // For this example, we'll just show an alert
    alert(`Share link generated for "${this.selectedItinerary.name}"\nThis would typically open a sharing dialog or copy a link to clipboard.`);
  }

  exportToPDF() {
    if (!this.selectedItinerary) return;

    // In a real application, this would generate a PDF
    // For this example, we'll just show an alert
    alert(`Exporting "${this.selectedItinerary.name}" to PDF...\nThis would typically download a PDF file of the itinerary.`);
  }

  exportToCalendar() {
    if (!this.selectedItinerary) return;

    // In a real application, this would generate an iCal file
    // For this example, we'll just show an alert
    alert(`Exporting "${this.selectedItinerary.name}" to calendar...\nThis would typically download an .ics file for calendar import.`);
  }
}

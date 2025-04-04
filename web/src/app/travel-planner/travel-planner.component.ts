import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { TripService, Itinerary, Activity, Accommodation, Transportation } from '../trip.service';
import { ListingService } from '../listings.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-travel-planner',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, FormsModule, MatTabsModule, DatePipe, NgClass, TitleCasePipe],
  templateUrl: './travel-planner.component.html',
  styleUrls: ['./travel-planner.component.sass', '../app.component.sass']
})
export class TravelPlannerComponent implements OnInit {
  // Journey management (renamed from itineraries to journeys for template consistency)
  public journeys: Itinerary[] = [];
  public selectedJourney: Itinerary | null = null;
  public journeyDays: Date[] = [];

  // Form states
  public showNewJourneyForm: boolean = false;
  public journeyForm: FormGroup;
  public activityForm: FormGroup;
  public accommodationForm: FormGroup;
  public transportationForm: FormGroup;
  public packingItemForm: FormGroup;
  submitted: boolean = false;
  formSubmitting: boolean = false;

  // Journey themes
  public journeyThemes: any[] = [
    {
      id: 'adventure',
      name: 'Adventure',
      icon: '<svg viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 5.28c-1.23-.37-2.22-1.17-2.8-2.18l-1-1.6c-.41-.65-1.11-1-1.84-1-.78 0-1.59.5-1.78 1.44S7 23 7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3c1 1.15 2.41 2.01 4 2.34V23H19V9h-1.5v1.78z"></path></svg>'
    },
    {
      id: 'cultural',
      name: 'Cultural Immersion',
      icon: '<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"></path></svg>'
    },
    {
      id: 'wellness',
      name: 'Wellness & Relaxation',
      icon: '<svg viewBox="0 0 24 24"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"></path></svg>'
    },
    {
      id: 'food',
      name: 'Food & Culinary',
      icon: '<svg viewBox="0 0 24 24"><path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"></path></svg>'
    },
    {
      id: 'wildlife',
      name: 'Wildlife & Nature',
      icon: '<svg viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"></path></svg>'
    }
  ];

  // Application state
  loading: boolean = false;
  error: string = '';

  // Detail view states
  showingActivityForm: boolean = false;
  showingAccommodationForm: boolean = false;
  showingTransportationForm: boolean = false;
  showingPackingItemForm: boolean = false;
  editingActivity: string | null = null;
  editingAccommodation: string | null = null;
  editingTransportation: string | null = null;

  // Packing list categories
  packingCategories: any[] = [
    { id: 'essentials', name: 'Essentials', isCollapsed: false, items: [] },
    { id: 'clothing', name: 'Clothing', isCollapsed: true, items: [] },
    { id: 'toiletries', name: 'Toiletries', isCollapsed: true, items: [] },
    { id: 'electronics', name: 'Electronics', isCollapsed: true, items: [] },
    { id: 'documents', name: 'Documents', isCollapsed: true, items: [] },
    { id: 'gear', name: 'Adventure Gear', isCollapsed: true, items: [] }
  ];

  // Recommended experiences
  recommendedExperiences: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private tripService: TripService,
    private listingService: ListingService
  ) {
    this.journeyForm = this.formBuilder.group({
      name: ['', Validators.required],
      destination: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      budget: [''],
      travelers: ['1'],
      notes: [''],
      theme: ['adventure']
    });

    this.activityForm = this.formBuilder.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      time: [''],
      location: [''],
      cost: [0],
      notes: [''],
      booked: [false],
      type: ['adventure']
    });

    this.accommodationForm = this.formBuilder.group({
      name: ['', Validators.required],
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
      location: [''],
      cost: [0],
      confirmation: [''],
      notes: [''],
      type: ['hotel'],
      url: ['']
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

    this.packingItemForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: ['essentials', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      notes: [''],
      packed: [false]
    });
  }

  ngOnInit() {
    this.loadJourneys();
    // Load some recommended experiences based on popular destinations
    this.loadRecommendedExperiences();
  }

  // Convenience getter for form fields
  get f() { return this.journeyForm.controls; }

  // Load user journeys
  loadJourneys() {
    this.loading = true;
    this.error = '';

    this.tripService.getUserTrips()
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : 'Failed to load journeys. Please try again.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((trips: Itinerary[]) => {
        this.journeys = trips;
      });
  }

  // JOURNEY MANAGEMENT
  createJourney() {
    this.submitted = true;

    if (this.journeyForm.invalid) {
      return;
    }

    this.formSubmitting = true;

    const newJourney: Itinerary = {
      name: this.f['name'].value,
      destination: this.f['destination'].value,
      startDate: this.f['startDate'].value,
      endDate: this.f['endDate'].value,
      activities: [],
      accommodations: [],
      transportation: [],
      totalBudget: this.f['budget'].value || 0,
      notes: this.f['notes'].value,
      theme: this.f['theme'].value
    };

    this.tripService.createTrip(newJourney)
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : 'Failed to create journey. Please try again.';
          return of(null);
        }),
        finalize(() => {
          this.formSubmitting = false;
        })
      )
      .subscribe((trip: Itinerary | null) => {
        if (trip) {
          this.journeys.push(trip);
          this.showNewJourneyForm = false;
          this.journeyForm.reset();
          this.submitted = false;
        }
      });
  }

  cancelNewJourney() {
    this.showNewJourneyForm = false;
    this.journeyForm.reset();
    this.submitted = false;
  }

  viewJourney(id: string | undefined) {
    if (!id) return;

    this.loading = true;

    this.tripService.getTripById(id)
      .pipe(
        catchError(err => {
          this.error = typeof err === 'string' ? err : `Failed to load journey details. Please try again.`;
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((trip: Itinerary | null) => {
        if (trip) {
          this.selectedJourney = trip;
          this.generateTripDays();
        }
      });
  }

  editJourney(id: string | undefined) {
    if (!id) return;

    const journey = this.journeys.find(i => i.id === id);
    if (journey) {
      this.journeyForm.patchValue({
        name: journey.name,
        destination: journey.destination,
        startDate: journey.startDate,
        endDate: journey.endDate,
        budget: journey.totalBudget,
        notes: journey.notes,
        theme: journey.theme || 'adventure'
      });

      this.showNewJourneyForm = true;
    }
  }

  deleteJourney(id: string | undefined) {
    if (!id) return;

    if (confirm('Are you sure you want to delete this journey? This action cannot be undone.')) {
      this.loading = true;

      this.tripService.deleteTrip(id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete journey. Please try again.';
            return of(null);
          }),
          // Continuing from previous part
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.journeys = this.journeys.filter(i => i.id !== id);
            if (this.selectedJourney && this.selectedJourney.id === id) {
              this.selectedJourney = null;
            }
          }
        });
    }
  }

  closeDetail() {
    this.selectedJourney = null;
  }

  // ACTIVITY MANAGEMENT
  showActivityForm() {
    this.showingActivityForm = true;
    this.editingActivity = null;
    this.activityForm.reset({
      booked: false,
      cost: 0,
      type: 'adventure'
    });

    // Set default date to first day of trip
    if (this.selectedJourney) {
      this.activityForm.patchValue({
        date: this.selectedJourney.startDate
      });
    }
  }

  addActivityForm(day: Date) {
    this.showingActivityForm = true;
    this.editingActivity = null;
    this.activityForm.reset({
      booked: false,
      cost: 0,
      type: 'adventure',
      date: day.toISOString().split('T')[0]
    });
  }

  editActivity(id: string | undefined) {
    if (!id || !this.selectedJourney) return;

    const activity = this.selectedJourney.activities.find((a: Activity) => a.id === id);
    if (activity) {
      this.editingActivity = id;
      this.activityForm.patchValue({
        name: activity.name,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        cost: activity.cost,
        notes: activity.notes,
        booked: activity.booked,
        type: activity.type || 'adventure'
      });
      this.showingActivityForm = true;
    }
  }

  saveActivity() {
    if (this.activityForm.invalid || !this.selectedJourney) {
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
      booked: this.activityForm.value.booked,
      type: this.activityForm.value.type
    };

    if (this.editingActivity) {
      // Update existing activity
      this.tripService.updateActivity(this.selectedJourney.id!, this.editingActivity, activityData)
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
            const index = this.selectedJourney!.activities.findIndex((a: Activity) => a.id === this.editingActivity);
            if (index !== -1) {
              this.selectedJourney!.activities[index] = updatedActivity;
            }
            this.showingActivityForm = false;
            this.editingActivity = null;
            this.activityForm.reset();
          }
        });
    } else {
      // Add new activity
      this.tripService.addActivity(this.selectedJourney.id!, activityData)
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
            this.selectedJourney!.activities.push(newActivity);
            // Sort activities by date and time
            this.selectedJourney!.activities.sort((a: Activity, b: Activity) => {
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
    if (!id || !this.selectedJourney) return;

    if (confirm('Are you sure you want to delete this activity?')) {
      this.tripService.deleteActivity(this.selectedJourney.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete activity. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedJourney!.activities = this.selectedJourney!.activities.filter((a: Activity) => a.id !== id);
          }
        });
    }
  }

  // ACCOMMODATION MANAGEMENT
  showAccommodationForm() {
    this.showingAccommodationForm = true;
    this.editingAccommodation = null;
    this.accommodationForm.reset({
      cost: 0,
      type: 'hotel'
    });

    // Set default check-in/out dates
    if (this.selectedJourney) {
      this.accommodationForm.patchValue({
        checkIn: this.selectedJourney.startDate,
        checkOut: this.selectedJourney.endDate
      });
    }
  }

  editAccommodation(id: string | undefined) {
    if (!id || !this.selectedJourney) return;

    const accommodation = this.selectedJourney.accommodations.find((a: Accommodation) => a.id === id);
    if (accommodation) {
      this.editingAccommodation = id;
      this.accommodationForm.patchValue({
        name: accommodation.name,
        checkIn: accommodation.checkIn,
        checkOut: accommodation.checkOut,
        location: accommodation.location,
        cost: accommodation.cost,
        confirmation: accommodation.confirmation,
        notes: accommodation.notes,
        type: accommodation.type || 'hotel',
        url: accommodation.url || ''
      });
      this.showingAccommodationForm = true;
    }
  }

  saveAccommodation() {
    if (this.accommodationForm.invalid || !this.selectedJourney) {
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
      notes: this.accommodationForm.value.notes || '',
      type: this.accommodationForm.value.type,
      url: this.accommodationForm.value.url
    };

    if (this.editingAccommodation) {
      // Update existing accommodation
      this.tripService.updateAccommodation(this.selectedJourney.id!, this.editingAccommodation, accommodationData)
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
            const index = this.selectedJourney!.accommodations.findIndex((a: Accommodation) => a.id === this.editingAccommodation);
            if (index !== -1) {
              this.selectedJourney!.accommodations[index] = updatedAccommodation;
            }
            this.showingAccommodationForm = false;
            this.editingAccommodation = null;
            this.accommodationForm.reset();
          }
        });
    } else {
      // Add new accommodation
      this.tripService.addAccommodation(this.selectedJourney.id!, accommodationData)
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
            this.selectedJourney!.accommodations.push(newAccommodation);
            // Sort accommodations by check-in date
            this.selectedJourney!.accommodations.sort((a: Accommodation, b: Accommodation) => {
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
    if (!id || !this.selectedJourney) return;

    if (confirm('Are you sure you want to delete this accommodation?')) {
      this.tripService.deleteAccommodation(this.selectedJourney.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete accommodation. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedJourney!.accommodations = this.selectedJourney!.accommodations.filter((a: Accommodation) => a.id !== id);
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
    if (this.selectedJourney) {
      this.transportationForm.patchValue({
        departureDate: this.selectedJourney.startDate,
        arrivalDate: this.selectedJourney.startDate
      });
    }
  }

  editTransportation(id: string | undefined) {
    if (!id || !this.selectedJourney) return;

    const transportation = this.selectedJourney.transportation.find((t: Transportation) => t.id === id);
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
    if (this.transportationForm.invalid || !this.selectedJourney) {
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
      this.tripService.updateTransportation(this.selectedJourney.id!, this.editingTransportation, transportationData)
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
            const index = this.selectedJourney!.transportation.findIndex((t: Transportation) => t.id === this.editingTransportation);
            if (index !== -1) {
              this.selectedJourney!.transportation[index] = updatedTransportation;
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
      this.tripService.addTransportation(this.selectedJourney.id!, transportationData)
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
            this.selectedJourney!.transportation.push(newTransportation);
            // Sort transportation by departure date and time
            this.selectedJourney!.transportation.sort((a: Transportation, b: Transportation) => {
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
    if (!id || !this.selectedJourney) return;

    if (confirm('Are you sure you want to delete this transportation?')) {
      this.tripService.deleteTransportation(this.selectedJourney.id!, id)
        .pipe(
          catchError(err => {
            this.error = typeof err === 'string' ? err : 'Failed to delete transportation. Please try again.';
            return of(null);
          })
        )
        .subscribe((result: any) => {
          if (result) {
            this.selectedJourney!.transportation = this.selectedJourney!.transportation.filter((t: Transportation) => t.id !== id);
          }
        });
    }
  }

  // PACKING LIST MANAGEMENT
  showPackingItemForm() {
    this.showingPackingItemForm = true;
    this.packingItemForm.reset({
      category: 'essentials',
      quantity: 1,
      packed: false
    });
  }

  savePackingItem() {
    if (this.packingItemForm.invalid || !this.selectedJourney) {
      return;
    }

    this.formSubmitting = true;

    // Add item to appropriate category
    const categoryId = this.packingItemForm.value.category;
    const category = this.packingCategories.find(c => c.id === categoryId);

    if (category) {
      const newItem = {
        id: Math.random().toString(36).substring(2, 11),
        name: this.packingItemForm.value.name,
        quantity: this.packingItemForm.value.quantity,
        packed: this.packingItemForm.value.packed,
        notes: this.packingItemForm.value.notes || ''
      };

      if (!category.items) {
        category.items = [];
      }

      category.items.push(newItem);

      this.showingPackingItemForm = false;
      this.packingItemForm.reset({
        category: 'essentials',
        quantity: 1,
        packed: false
      });

      this.formSubmitting = false;
    }
  }

  cancelPackingItemForm() {
    this.showingPackingItemForm = false;
    this.packingItemForm.reset({
      category: 'essentials',
      quantity: 1,
      packed: false
    });
  }

  usePackingTemplate() {
    // Simplified implementation that adds common items to each category
    const templates = {
      essentials: ['Passport', 'Wallet', 'Phone', 'Charger', 'Travel insurance docs'],
      clothing: ['T-shirts', 'Pants/shorts', 'Underwear', 'Socks', 'Jacket'],
      toiletries: ['Toothbrush', 'Toothpaste', 'Shampoo', 'Soap', 'Sunscreen'],
      electronics: ['Camera', 'Laptop', 'Headphones', 'Power bank', 'Adapters'],
      documents: ['Passport copies', 'Booking confirmations', 'Travel insurance', 'Maps', 'Emergency contacts'],
      gear: ['Backpack', 'Daypack', 'Water bottle', 'First aid kit', 'Flashlight']
    };

    // Add template items to each category
    this.packingCategories.forEach(category => {
      const templateItems = templates[category.id as keyof typeof templates] || [];

      if (!category.items) {
        category.items = [];
      }

      templateItems.forEach(itemName => {
        // Only add if not already in the list - explicit typing
        if (!category.items.some((item: any) => item.name === itemName)) {
          category.items.push({
            id: Math.random().toString(36).substring(2, 11),
            name: itemName,
            quantity: 1,
            packed: false,
            notes: ''
          });
        }
      });
    });

    alert('Packing template applied!');
  }

  toggleCategory(categoryId: string) {
    const category = this.packingCategories.find(c => c.id === categoryId);
    if (category) {
      category.isCollapsed = !category.isCollapsed;
    }
  }

  getCategoryCount(categoryId: string): number {
    const category = this.packingCategories.find(c => c.id === categoryId);
    return category && category.items ? category.items.length : 0;
  }

  getCategoryProgress(categoryId: string): number {
    const category = this.packingCategories.find(c => c.id === categoryId);
    if (!category || !category.items || category.items.length === 0) {
      return 0;
    }

    const packedItems = category.items.filter((item: any) => item.packed).length;
    return Math.round((packedItems / category.items.length) * 100);
  }

  getItemsByCategory(categoryId: string): any[] {
    const category = this.packingCategories.find(c => c.id === categoryId);
    return category && category.items ? category.items : [];
  }

  updatePackingItem(item: any) {
    // Update is handled by ngModel binding directly
    console.log(`Updating item ${item.id} to packed: ${item.packed}`);
  }

  editPackingItem(itemId: string) {
    // Find the item in all categories
    for (const category of this.packingCategories) {
      if (!category.items) continue;

      const item = category.items.find((i: any) => i.id === itemId);
      if (item) {
        this.showingPackingItemForm = true;
        this.packingItemForm.patchValue({
          name: item.name,
          category: category.id,
          quantity: item.quantity,
          notes: item.notes,
          packed: item.packed
        });

        // Remove the old item (will be replaced when saving)
        category.items = category.items.filter((i: any) => i.id !== itemId);
        break;
      }
    }
  }

  deletePackingItem(itemId: string) {
    if (confirm('Are you sure you want to delete this item?')) {
      // Find and delete the item from its category
      for (const category of this.packingCategories) {
        if (!category.items) continue;

        const index = category.items.findIndex((i: any) => i.id === itemId);
        if (index !== -1) {
          category.items.splice(index, 1);
          break;
        }
      }
    }
  }

  getTotalPackingItems(): number {
    return this.packingCategories.reduce((total, category) => {
      return total + (category.items ? category.items.length : 0);
    }, 0);
  }

  // HELPER METHODS
  generateTripDays() {
    this.journeyDays = [];
    if (this.selectedJourney) {
      const startDate = new Date(this.selectedJourney.startDate);
      const endDate = new Date(this.selectedJourney.endDate);

      // Create array of days
      let currentDay = new Date(startDate);
      while (currentDay <= endDate) {
        this.journeyDays.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
  }

  getActivitiesForDay(day: Date): Activity[] {
    if (!this.selectedJourney) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedJourney.activities.filter((activity: Activity) => {
      return activity.date === dayString;
    });
  }

  getAccommodationForDay(day: Date): Accommodation[] {
    if (!this.selectedJourney) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedJourney.accommodations.filter((accommodation: Accommodation) => {
      const checkIn = accommodation.checkIn;
      const checkOut = accommodation.checkOut;

      // Check if the day falls between check-in and check-out
      return dayString >= checkIn && dayString < checkOut;
    });
  }

  getTransportationForDay(day: Date): Transportation[] {
    if (!this.selectedJourney) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedJourney.transportation.filter((transportation: Transportation) => {
      return transportation.departureDate === dayString || transportation.arrivalDate === dayString;
    });
  }

  hasEventsForDay(day: Date): boolean {
    return this.getActivitiesForDay(day).length > 0 ||
      this.getAccommodationForDay(day).length > 0 ||
      this.getTransportationForDay(day).length > 0;
  }

  getJourneyProgress(journey: Itinerary): number {
    // Calculate completion based on filled sections
    let totalSections = 3; // Activities, Accommodations, Transportation
    let completedSections = 0;

    if (journey.activities && journey.activities.length > 0) {
      completedSections += 1;
    }

    if (journey.accommodations && journey.accommodations.length > 0) {
      completedSections += 1;
    }

    if (journey.transportation && journey.transportation.length > 0) {
      completedSections += 1;
    }

    return Math.round((completedSections / totalSections) * 100);
  }

  get totalSpent(): number {
    if (!this.selectedJourney) return 0;

    const activityCosts = this.selectedJourney.activities.reduce((sum: number, activity: Activity) => sum + activity.cost, 0);
    const accommodationCosts = this.selectedJourney.accommodations.reduce((sum: number, accommodation: Accommodation) => sum + accommodation.cost, 0);
    const transportationCosts = this.selectedJourney.transportation.reduce((sum: number, transportation: Transportation) => sum + transportation.cost, 0);

    return activityCosts + accommodationCosts + transportationCosts;
  }

  get journeyDuration(): number {
    if (!this.selectedJourney) return 0;

    const startDate = new Date(this.selectedJourney.startDate);
    const endDate = new Date(this.selectedJourney.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }

  // INTEGRATION WITH LISTINGS
  loadRecommendedExperiences() {
    // Mock implementation that loads based on popular destinations
    this.recommendedExperiences = [
      {
        id: 'exp1',
        title: 'Guided Hiking Tour',
        image: 'assets/experiences/hiking.jpg',
        location: 'Rocky Mountains',
        price: '$89',
        rating: 4.8
      },
      {
        id: 'exp2',
        title: 'Sunset Sailing Adventure',
        image: 'assets/experiences/sailing.jpg',
        location: 'San Francisco Bay',
        price: '$120',
        rating: 4.9
      },
      {
        id: 'exp3',
        title: 'Wine Tasting Experience',
        image: 'assets/experiences/wine.jpg',
        location: 'Napa Valley',
        price: '$65',
        rating: 4.7
      }
    ];
  }

  addToJourney(experienceId: string) {
    if (!this.selectedJourney) return;

    const experience = this.recommendedExperiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    // Add as an activity
    this.activityForm.patchValue({
      name: experience.title,
      location: experience.location,
      cost: parseFloat(experience.price.replace('$', '')),
      date: this.selectedJourney.startDate // Default to first day
    });

    this.showingActivityForm = true;
  }
}

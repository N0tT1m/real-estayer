import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ListingService } from '../listings.service';
import {NgIf, NgFor, DatePipe, NgClass, TitleCasePipe} from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

interface Itinerary {
  id: string;
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

interface Activity {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  cost: number;
  notes: string;
  booked: boolean;
}

interface Accommodation {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  location: string;
  cost: number;
  confirmation: string;
  notes: string;
}

interface Transportation {
  id: string;
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

@Component({
  selector: 'app-travel-planner',
  standalone: true,
  imports: [NgIf, NgFor, ReactiveFormsModule, MatTabsModule, DatePipe, NgClass, TitleCasePipe],
  template: `
    <div class="planner-container">
      <div class="planner-header">
        <h1>Travel Planner</h1>
        <p>Plan and organize your trips all in one place</p>
      </div>

      <div class="planner-actions">
        <button class="create-button" (click)="showNewItineraryForm = true" *ngIf="!showNewItineraryForm">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create New Trip
        </button>
      </div>

      New Itinerary Form
      <div class="new-itinerary-form" *ngIf="showNewItineraryForm">
        <h2>Create New Trip</h2>
        <form [formGroup]="itineraryForm" (ngSubmit)="createItinerary()">
          <div class="form-row">
            <div class="form-group">
              <label for="tripName">Trip Name</label>
              <input type="text" id="tripName" formControlName="name" class="form-control">
              <div class="error-message" *ngIf="submitted && f['name'].errors">
                <div *ngIf="f['name'].errors['required']">Trip name is required</div>
              </div>
            </div>

            <div class="form-group">
              <label for="destination">Destination</label>
              <input type="text" id="destination" formControlName="destination" class="form-control">
              <div class="error-message" *ngIf="submitted && f['destination'].errors">
                <div *ngIf="f['destination'].errors['required']">Destination is required</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="startDate">Start Date</label>
              <input type="date" id="startDate" formControlName="startDate" class="form-control">
              <div class="error-message" *ngIf="submitted && f['startDate'].errors">
                <div *ngIf="f['startDate'].errors['required']">Start date is required</div>
              </div>
            </div>

            <div class="form-group">
              <label for="endDate">End Date</label>
              <input type="date" id="endDate" formControlName="endDate" class="form-control">
              <div class="error-message" *ngIf="submitted && f['endDate'].errors">
                <div *ngIf="f['endDate'].errors['required']">End date is required</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="budget">Budget (USD)</label>
              <input type="number" id="budget" formControlName="budget" class="form-control">
            </div>

            <div class="form-group">
              <label for="travelers">Number of Travelers</label>
              <input type="number" id="travelers" formControlName="travelers" class="form-control">
            </div>
          </div>

          <div class="form-group full-width">
            <label for="notes">Notes</label>
            <textarea id="notes" formControlName="notes" class="form-control textarea"></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-button" (click)="cancelNewItinerary()">Cancel</button>
            <button type="submit" class="save-button">Create Trip</button>
          </div>
        </form>
      </div>

      <!-- Itinerary List -->
      <div class="itinerary-list" *ngIf="!showNewItineraryForm && itineraries.length > 0">
        <div class="itinerary-card" *ngFor="let itinerary of itineraries">
          <div class="itinerary-header">
            <h3>{{ itinerary.name }}</h3>
            <div class="itinerary-dates">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 002 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z"/>
              </svg>
              {{ itinerary.startDate | date:'mediumDate' }} - {{ itinerary.endDate | date:'mediumDate' }}
            </div>
          </div>

          <div class="itinerary-destination">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {{ itinerary.destination }}
          </div>

          <div class="itinerary-budget">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
            {{ itinerary.totalBudget }}
          </div>

          <div class="itinerary-stats">
            <div class="stat-item">
              <div class="stat-value">{{ itinerary.activities.length }}</div>
              <div class="stat-label">Activities</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ itinerary.accommodations.length }}</div>
              <div class="stat-label">Stays</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ itinerary.transportation.length }}</div>
              <div class="stat-label">Transport</div>
            </div>
          </div>

          <div class="itinerary-actions">
            <button class="view-button" (click)="viewItinerary(itinerary.id)">View Details</button>
            <button class="edit-button" (click)="editItinerary(itinerary.id)">Edit</button>
            <button class="delete-button" (click)="deleteItinerary(itinerary.id)">Delete</button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!showNewItineraryForm && itineraries.length === 0">
        <div class="empty-illustration">
          <svg viewBox="0 0 24 24" width="64" height="64">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <h2>No trips planned yet</h2>
        <p>Start creating your travel itineraries and keep all your plans organized in one place.</p>
        <button class="create-button" (click)="showNewItineraryForm = true">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Create Your First Trip
        </button>
      </div>

      <!-- Itinerary Detail View -->
      <div class="itinerary-detail" *ngIf="selectedItinerary">
        <div class="detail-header">
          <div class="header-content">
            <h2>{{ selectedItinerary.name }}</h2>
            <p class="detail-dates">{{ selectedItinerary.startDate | date:'mediumDate' }} - {{ selectedItinerary.endDate | date:'mediumDate' }}</p>
            <p class="detail-location">{{ selectedItinerary.destination }}</p>
          </div>
          <button class="close-button" (click)="closeDetail()">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <mat-tab-group>
          <mat-tab label="Overview">
            <div class="overview-content">
              <div class="budget-tracker">
                <h3>Budget Tracker</h3>
                <div class="budget-progress">
                  <div class="budget-bar">
                    <div class="budget-spent" [style.width]="(totalSpent / selectedItinerary.totalBudget * 100) + '%'"></div>
                  </div>
                  <div class="budget-stats">
                    <div class="budget-total">
                      <span>Total Budget:</span>
                      <span>{{ selectedItinerary.totalBudget }}</span>
                    </div>
                    <div class="budget-spent">
                      <span>Spent So Far:</span>
                      <span>{{ totalSpent }}</span>
                    </div>
                    <div class="budget-remaining" [ngClass]="{'over-budget': totalSpent > selectedItinerary.totalBudget}">
                      <span>Remaining:</span>
                      <span>{{ selectedItinerary.totalBudget - totalSpent }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="trip-summary">
                <h3>Trip Summary</h3>
                <div class="summary-grid">
                  <div class="summary-card">
                    <h4>Duration</h4>
                    <p>{{ tripDuration }} days</p>
                  </div>
                  <div class="summary-card">
                    <h4>Activities</h4>
                    <p>{{ selectedItinerary.activities.length }} planned</p>
                  </div>
                  <div class="summary-card">
                    <h4>Accommodations</h4>
                    <p>{{ selectedItinerary.accommodations.length }} booked</p>
                  </div>
                  <div class="summary-card">
                    <h4>Transportation</h4>
                    <p>{{ selectedItinerary.transportation.length }} booked</p>
                  </div>
                </div>
              </div>

              <div class="notes-section" *ngIf="selectedItinerary.notes">
                <h3>Trip Notes</h3>
                <div class="notes-content">
                  {{ selectedItinerary.notes }}
                </div>
              </div>

              <div class="trip-timeline">
                <h3>Trip Timeline</h3>
                <div class="timeline">
                  <div class="timeline-item" *ngFor="let day of tripDays; let i = index">
                    <div class="timeline-date">
                      <div class="date-marker">{{ i + 1 }}</div>
                      <div class="date-details">
                        <div class="date-day">{{ day | date:'EEEE' }}</div>
                        <div class="date-full">{{ day | date:'mediumDate' }}</div>
                      </div>
                    </div>
                    <div class="timeline-events">
                      <div class="timeline-event transport" *ngFor="let transport of getTransportationForDay(day)">
                        <div class="event-time">{{ transport.departureTime }}</div>
                        <div class="event-type">{{ transport.type | titlecase }}</div>
                        <div class="event-details">
                          {{ transport.from }} to {{ transport.to }}
                          <div class="event-sub">{{ transport.carrier }}</div>
                        </div>
                      </div>
                      <div class="timeline-event accommodation" *ngFor="let accommodation of getAccommodationForDay(day)">
                        <div class="event-time">Check-in</div>
                        <div class="event-type">Stay</div>
                        <div class="event-details">
                          {{ accommodation.name }}
                          <div class="event-sub">{{ accommodation.location }}</div>
                        </div>
                      </div>
                      <div class="timeline-event activity" *ngFor="let activity of getActivitiesForDay(day)">
                        <div class="event-time">{{ activity.time }}</div>
                        <div class="event-type">Activity</div>
                        <div class="event-details">
                          {{ activity.name }}
                          <div class="event-sub">{{ activity.location }}</div>
                        </div>
                      </div>
                      <div class="empty-day" *ngIf="!hasEventsForDay(day)">
                        No activities planned for this day.
                        <button class="add-activity-button" (click)="addActivityForm(day)">Add Activity</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Activities">
            <div class="activities-content">
              <div class="section-header">
                <h3>Activities & Experiences</h3>
                <button class="add-button" (click)="showActivityForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Activity
                </button>
              </div>

              <div class="activities-form" *ngIf="showingActivityForm">
                <h4>{{ editingActivity ? 'Edit Activity' : 'Add New Activity' }}</h4>
                <form [formGroup]="activityForm" (ngSubmit)="saveActivity()">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="activityName">Activity Name</label>
                      <input type="text" id="activityName" formControlName="name" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="activityDate">Date</label>
                      <input type="date" id="activityDate" formControlName="date" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="activityTime">Time</label>
                      <input type="time" id="activityTime" formControlName="time" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="activityLocation">Location</label>
                      <input type="text" id="activityLocation" formControlName="location" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="activityCost">Cost (USD)</label>
                      <input type="number" id="activityCost" formControlName="cost" class="form-control">
                    </div>

                    <div class="form-group">
                      <label class="checkbox-label">
                        <input type="checkbox" formControlName="booked">
                        <span>Already Booked</span>
                      </label>
                    </div>
                  </div>

                  <div class="form-group full-width">
                    <label for="activityNotes">Notes</label>
                    <textarea id="activityNotes" formControlName="notes" class="form-control textarea"></textarea>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="cancel-button" (click)="cancelActivityForm()">Cancel</button>
                    <button type="submit" class="save-button">Save</button>
                  </div>
                </form>
              </div>

              <div class="activities-list" *ngIf="!showingActivityForm && selectedItinerary.activities.length > 0">
                <div class="activity-card" *ngFor="let activity of selectedItinerary.activities">
                  <div class="activity-info">
                    <h4>{{ activity.name }}</h4>
                    <p class="activity-datetime">
                      {{ activity.date | date:'mediumDate' }} at {{ activity.time }}
                    </p>
                    <p class="activity-location">{{ activity.location }}</p>
                    <p class="activity-cost">{{ activity.cost }}</p>
                    <div class="booking-status" *ngIf="activity.booked">Booked</div>
                  </div>
                  <div class="activity-actions">
                    <button class="edit-button" (click)="editActivity(activity.id)">Edit</button>
                    <button class="delete-button" (click)="deleteActivity(activity.id)">Delete</button>
                  </div>
                </div>
              </div>

              <div class="empty-state" *ngIf="!showingActivityForm && selectedItinerary.activities.length === 0">
                <p>No activities added yet. Start planning your experiences!</p>
                <button class="add-button" (click)="showActivityForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Activity
                </button>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Accommodations">
            <div class="accommodations-content">
              <div class="section-header">
                <h3>Accommodations</h3>
                <button class="add-button" (click)="showAccommodationForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Accommodation
                </button>
              </div>

              <div class="accommodation-form" *ngIf="showingAccommodationForm">
                <h4>{{ editingAccommodation ? 'Edit Accommodation' : 'Add New Accommodation' }}</h4>
                <form [formGroup]="accommodationForm" (ngSubmit)="saveAccommodation()">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="accommodationName">Property Name</label>
                      <input type="text" id="accommodationName" formControlName="name" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="accommodationLocation">Location</label>
                      <input type="text" id="accommodationLocation" formControlName="location" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="checkIn">Check-in Date</label>
                      <input type="date" id="checkIn" formControlName="checkIn" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="checkOut">Check-out Date</label>
                      <input type="date" id="checkOut" formControlName="checkOut" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="accommodationCost">Cost (USD)</label>
                      <input type="number" id="accommodationCost" formControlName="cost" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="confirmation">Confirmation Number</label>
                      <input type="text" id="confirmation" formControlName="confirmation" class="form-control">
                    </div>
                  </div>

                  <div class="form-group full-width">
                    <label for="accommodationNotes">Notes</label>
                    <textarea id="accommodationNotes" formControlName="notes" class="form-control textarea"></textarea>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="cancel-button" (click)="cancelAccommodationForm()">Cancel</button>
                    <button type="submit" class="save-button">Save</button>
                  </div>
                </form>
              </div>

              <div class="accommodations-list" *ngIf="!showingAccommodationForm && selectedItinerary.accommodations.length > 0">
                <div class="accommodation-card" *ngFor="let accommodation of selectedItinerary.accommodations">
                  <div class="accommodation-info">
                    <h4>{{ accommodation.name }}</h4>
                    <p class="accommodation-location">{{ accommodation.location }}</p>
                    <p class="accommodation-dates">
                      {{ accommodation.checkIn | date:'mediumDate' }} - {{ accommodation.checkOut | date:'mediumDate' }}
                    </p>
                    <p class="accommodation-cost">{{ accommodation.cost }}</p>
                    <p class="accommodation-confirmation" *ngIf="accommodation.confirmation">
                      Confirmation #: {{ accommodation.confirmation }}
                    </p>
                  </div>
                  <div class="accommodation-actions">
                    <button class="edit-button" (click)="editAccommodation(accommodation.id)">Edit</button>
                    <button class="delete-button" (click)="deleteAccommodation(accommodation.id)">Delete</button>
                  </div>
                </div>
              </div>

              <div class="empty-state" *ngIf="!showingAccommodationForm && selectedItinerary.accommodations.length === 0">
                <p>No accommodations added yet. Where will you be staying?</p>
                <button class="add-button" (click)="showAccommodationForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Accommodation
                </button>
              </div>
            </div>
          </mat-tab>

          <mat-tab label="Transportation">
            <div class="transportation-content">
              <div class="section-header">
                <h3>Transportation</h3>
                <button class="add-button" (click)="showTransportationForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Transportation
                </button>
              </div>

              <div class="transportation-form" *ngIf="showingTransportationForm">
                <h4>{{ editingTransportation ? 'Edit Transportation' : 'Add New Transportation' }}</h4>
                <form [formGroup]="transportationForm" (ngSubmit)="saveTransportation()">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="transportationType">Type</label>
                      <select id="transportationType" formControlName="type" class="form-control">
                        <option value="flight">Flight</option>
                        <option value="train">Train</option>
                        <option value="car">Car Rental</option>
                        <option value="bus">Bus</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label for="carrier">Carrier/Company</label>
                      <input type="text" id="carrier" formControlName="carrier" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="from">From</label>
                      <input type="text" id="from" formControlName="from" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="to">To</label>
                      <input type="text" id="to" formControlName="to" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="departureDate">Departure Date</label>
                      <input type="date" id="departureDate" formControlName="departureDate" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="departureTime">Departure Time</label>
                      <input type="time" id="departureTime" formControlName="departureTime" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="arrivalDate">Arrival Date</label>
                      <input type="date" id="arrivalDate" formControlName="arrivalDate" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="arrivalTime">Arrival Time</label>
                      <input type="time" id="arrivalTime" formControlName="arrivalTime" class="form-control">
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label for="transportationCost">Cost (USD)</label>
                      <input type="number" id="transportationCost" formControlName="cost" class="form-control">
                    </div>

                    <div class="form-group">
                      <label for="transportationConfirmation">Confirmation/Booking Reference</label>
                      <input type="text" id="transportationConfirmation" formControlName="confirmation" class="form-control">
                    </div>
                  </div>

                  <div class="form-group full-width">
                    <label for="transportationNotes">Notes</label>
                    <textarea id="transportationNotes" formControlName="notes" class="form-control textarea"></textarea>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="cancel-button" (click)="cancelTransportationForm()">Cancel</button>
                    <button type="submit" class="save-button">Save</button>
                  </div>
                </form>
              </div>

              <div class="transportation-list" *ngIf="!showingTransportationForm && selectedItinerary.transportation.length > 0">
                <div class="transportation-card" *ngFor="let transport of selectedItinerary.transportation">
                  <div class="transportation-type" [ngClass]="transport.type">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                      <path *ngIf="transport.type === 'flight'" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                      <path *ngIf="transport.type === 'train'" d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z"/>
                      <path *ngIf="transport.type === 'car'" d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                      <path *ngIf="transport.type === 'bus'" d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
                      <path *ngIf="transport.type === 'other'" d="M18.41 5.8L17.2 4.59c-.78-.78-2.05-.78-2.83 0l-2.68 2.68L3 15.96V20h4.04l8.74-8.74 2.63-2.63c.79-.78.79-2.05 0-2.83zM6.21 18H5v-1.21l8.66-8.66 1.21 1.21L6.21 18zM11 20l4-4h6v4H11z"/>
                    </svg>
                  </div>
                  <div class="transportation-info">
                    <h4>{{ transport.type | titlecase }}: {{ transport.from }} to {{ transport.to }}</h4>
                    <p class="transport-carrier" *ngIf="transport.carrier">{{ transport.carrier }}</p>
                    <p class="transport-datetime">
                      {{ transport.departureDate | date:'mediumDate' }} at {{ transport.departureTime }}
                      <span class="arrow">→</span>
                      {{ transport.arrivalDate | date:'mediumDate' }} at {{ transport.arrivalTime }}
                    </p>
                    <p class="transport-cost">{{ transport.cost }}</p>
                    <p class="transport-confirmation" *ngIf="transport.confirmation">
                      Confirmation #: {{ transport.confirmation }}
                    </p>
                  </div>
                  <div class="transportation-actions">
                    <button class="edit-button" (click)="editTransportation(transport.id)">Edit</button>
                    <button class="delete-button" (click)="deleteTransportation(transport.id)">Delete</button>
                  </div>
                </div>
              </div>

              <div class="empty-state" *ngIf="!showingTransportationForm && selectedItinerary.transportation.length === 0">
                <p>No transportation added yet. How will you get there?</p>
                <button class="add-button" (click)="showTransportationForm()">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                  Add Transportation
                </button>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styleUrls: ['travel-planner.component.sass', '../app.component.sass']
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

  // Detail view states
  showingActivityForm: boolean = false;
  showingAccommodationForm: boolean = false;
  showingTransportationForm: boolean = false;
  editingActivity: string | null = null;
  editingAccommodation: string | null = null;
  editingTransportation: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
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
    // Load sample data
    this.loadSampleItineraries();
  }

  // Convenience getter for form fields
  get f() { return this.itineraryForm.controls; }

  // Load sample itineraries
  loadSampleItineraries() {
    const sampleItinerary: Itinerary = {
      id: '1',
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
    };

    this.itineraries.push(sampleItinerary);
  }

  // ITINERARY MANAGEMENT
  createItinerary() {
    this.submitted = true;

    if (this.itineraryForm.invalid) {
      return;
    }

    const newItinerary: Itinerary = {
      id: Date.now().toString(),
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

    this.itineraries.push(newItinerary);
    this.showNewItineraryForm = false;
    this.itineraryForm.reset();
    this.submitted = false;
  }

  cancelNewItinerary() {
    this.showNewItineraryForm = false;
    this.itineraryForm.reset();
    this.submitted = false;
  }

  viewItinerary(id: string) {
    this.selectedItinerary = this.itineraries.find(i => i.id === id) || null;
    if (this.selectedItinerary) {
      this.generateTripDays();
    }
  }

  editItinerary(id: string) {
    // Implementation for editing existing itinerary
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
      // Would need to implement update logic
    }
  }

  deleteItinerary(id: string) {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      this.itineraries = this.itineraries.filter(i => i.id !== id);
      if (this.selectedItinerary && this.selectedItinerary.id === id) {
        this.selectedItinerary = null;
      }
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

  editActivity(id: string) {
    if (this.selectedItinerary) {
      const activity = this.selectedItinerary.activities.find(a => a.id === id);
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
  }

  saveActivity() {
    if (this.activityForm.invalid || !this.selectedItinerary) {
      return;
    }

    const activityData = {
      id: this.editingActivity || Date.now().toString(),
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
      const index = this.selectedItinerary.activities.findIndex(a => a.id === this.editingActivity);
      if (index !== -1) {
        this.selectedItinerary.activities[index] = activityData;
      }
    } else {
      // Add new activity
      this.selectedItinerary.activities.push(activityData);
    }

    // Sort activities by date and time
    this.selectedItinerary.activities.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return a.time.localeCompare(b.time);
      }
      return dateCompare;
    });

    this.showingActivityForm = false;
    this.editingActivity = null;
    this.activityForm.reset();
  }

  cancelActivityForm() {
    this.showingActivityForm = false;
    this.editingActivity = null;
    this.activityForm.reset();
  }

  deleteActivity(id: string) {
    if (confirm('Are you sure you want to delete this activity?') && this.selectedItinerary) {
      this.selectedItinerary.activities = this.selectedItinerary.activities.filter(a => a.id !== id);
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

  editAccommodation(id: string) {
    if (this.selectedItinerary) {
      const accommodation = this.selectedItinerary.accommodations.find(a => a.id === id);
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
  }

  saveAccommodation() {
    if (this.accommodationForm.invalid || !this.selectedItinerary) {
      return;
    }

    const accommodationData = {
      id: this.editingAccommodation || Date.now().toString(),
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
      const index = this.selectedItinerary.accommodations.findIndex(a => a.id === this.editingAccommodation);
      if (index !== -1) {
        this.selectedItinerary.accommodations[index] = accommodationData;
      }
    } else {
      // Add new accommodation
      this.selectedItinerary.accommodations.push(accommodationData);
    }

    // Sort accommodations by check-in date
    this.selectedItinerary.accommodations.sort((a, b) => {
      return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
    });

    this.showingAccommodationForm = false;
    this.editingAccommodation = null;
    this.accommodationForm.reset();
  }

  cancelAccommodationForm() {
    this.showingAccommodationForm = false;
    this.editingAccommodation = null;
    this.accommodationForm.reset();
  }

  deleteAccommodation(id: string) {
    if (confirm('Are you sure you want to delete this accommodation?') && this.selectedItinerary) {
      this.selectedItinerary.accommodations = this.selectedItinerary.accommodations.filter(a => a.id !== id);
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

  editTransportation(id: string) {
    if (this.selectedItinerary) {
      const transportation = this.selectedItinerary.transportation.find(t => t.id === id);
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
  }

  saveTransportation() {
    if (this.transportationForm.invalid || !this.selectedItinerary) {
      return;
    }

    const transportationData = {
      id: this.editingTransportation || Date.now().toString(),
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
      const index = this.selectedItinerary.transportation.findIndex(t => t.id === this.editingTransportation);
      if (index !== -1) {
        this.selectedItinerary.transportation[index] = transportationData;
      }
    } else {
      // Add new transportation
      this.selectedItinerary.transportation.push(transportationData);
    }

    // Sort transportation by departure date and time
    this.selectedItinerary.transportation.sort((a, b) => {
      const dateCompare = new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      if (dateCompare === 0) {
        return a.departureTime.localeCompare(b.departureTime);
      }
      return dateCompare;
    });

    this.showingTransportationForm = false;
    this.editingTransportation = null;
    this.transportationForm.reset({
      type: 'flight'
    });
  }

  cancelTransportationForm() {
    this.showingTransportationForm = false;
    this.editingTransportation = null;
    this.transportationForm.reset({
      type: 'flight'
    });
  }

  deleteTransportation(id: string) {
    if (confirm('Are you sure you want to delete this transportation?') && this.selectedItinerary) {
      this.selectedItinerary.transportation = this.selectedItinerary.transportation.filter(t => t.id !== id);
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
    return this.selectedItinerary.activities.filter(activity => {
      return activity.date === dayString;
    });
  }

  getAccommodationForDay(day: Date): Accommodation[] {
    if (!this.selectedItinerary) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedItinerary.accommodations.filter(accommodation => {
      const checkIn = accommodation.checkIn;
      const checkOut = accommodation.checkOut;

      // Check if the day falls between check-in and check-out
      return dayString >= checkIn && dayString < checkOut;
    });
  }

  getTransportationForDay(day: Date): Transportation[] {
    if (!this.selectedItinerary) return [];

    const dayString = day.toISOString().split('T')[0];
    return this.selectedItinerary.transportation.filter(transportation => {
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

    const activityCosts = this.selectedItinerary.activities.reduce((sum, activity) => sum + activity.cost, 0);
    const accommodationCosts = this.selectedItinerary.accommodations.reduce((sum, accommodation) => sum + accommodation.cost, 0);
    const transportationCosts = this.selectedItinerary.transportation.reduce((sum, transportation) => sum + transportation.cost, 0);

    return activityCosts + accommodationCosts + transportationCosts;
  }

  get tripDuration(): number {
    if (!this.selectedItinerary) return 0;

    const startDate = new Date(this.selectedItinerary.startDate);
    const endDate = new Date(this.selectedItinerary.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
  }
}

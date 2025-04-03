import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule
  ]
})
export class AdminComponent implements OnInit {
  scrapingInProgress = false;
  scrapingProgress: any = null;
  cityForm: FormGroup;

  // US States from your backend
  usStates = [
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska",
    "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  // Canadian Provinces (commented out in backend but adding here for completeness)
  canadianProvinces = [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon"
  ];

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.cityForm = this.fb.group({
      city: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  scrapeNorthAmerica(): void {
    if (this.scrapingInProgress) {
      this.showNotification('Scraping is already in progress!', 'warning');
      return;
    }

    if (confirm('This will scrape data for all US states and Canadian provinces. This process may take a long time. Do you want to continue?')) {
      this.scrapingInProgress = true;
      this.scrapingProgress = {
        message: 'Initiating North America scraping...',
        total_listings: 0,
        canada_listings: 0,
        us_listings: 0
      };

      this.showNotification('Starting North America scraping...', 'info');

      // Using HttpClient directly instead of ListingService
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE',
      };

      const options = {
        headers: headers,
        rejectUnauthorized: false,
      };

      this.http.get('http://localhost:5000/scrape-north-america', options).subscribe({
        next: (response: any) => {
          this.scrapingProgress = response;
          this.showNotification(`Scraping completed. Total listings: ${response.total_listings}`, 'success');
        },
        error: (error: any) => {
          console.error('Error scraping North America:', error);
          this.showNotification('Error occurred while scraping. Check console for details.', 'error');
        },
        complete: () => {
          this.scrapingInProgress = false;
        }
      });
    }
  }

  scrapeCity(): void {
    if (this.scrapingInProgress) {
      this.showNotification('Scraping is already in progress!', 'warning');
      return;
    }

    if (this.cityForm.invalid) {
      this.showNotification('Please enter a valid city name', 'error');
      return;
    }

    const city = this.cityForm.get('city')?.value;

    if (confirm(`This will scrape data for ${city}. Do you want to continue?`)) {
      this.scrapingInProgress = true;
      this.scrapingProgress = {
        message: `Initiating scraping for ${city}...`,
        places: 0
      };

      this.showNotification(`Starting scraping for ${city}...`, 'info');

      // Using HttpClient directly instead of ListingService
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,DELETE',
      };

      const options = {
        headers: headers,
        rejectUnauthorized: false,
      };

      this.http.get(`http://localhost:5000/scrape-city-data?city=${encodeURIComponent(city)}`, options).subscribe({
        next: (response: any) => {
          this.scrapingProgress = {
            message: `Scraping for ${city} completed`,
            places: response.places.length,
            inserted_ids: response.inserted_ids.length
          };
          this.showNotification(`Scraping completed. Found ${response.places.length} listings.`, 'success');
        },
        error: (error: any) => {
          console.error(`Error scraping ${city}:`, error);
          this.showNotification('Error occurred while scraping. Check console for details.', 'error');
        },
        complete: () => {
          this.scrapingInProgress = false;
        }
      });
    }
  }

  private showNotification(message: string, panelClass: 'success' | 'error' | 'info' | 'warning'): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`notification-${panelClass}`]
    });
  }
}

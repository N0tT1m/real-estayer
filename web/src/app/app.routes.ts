import { Routes } from '@angular/router';
import { ListingsComponent } from './listings/listings.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { TravelPlannerComponent } from './travel-planner/travel-planner.component';
import { HomeComponent } from './home/home.component';

// You'll need to create these components
import { ListingDetailComponent } from './listing-detail/listing-detail.component';
import { DestinationsComponent } from './travel-destinations/travel-destinations.component';
import {AdminComponent} from "./admin/admin.component";
import {AuthGuard} from "./auth-guard.service";
// import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent, // Uncomment after creating DestinationsComponent
    title: 'RealEstayer - Discover Amazing Places'
  },
  {
    path: 'listings',
    component: ListingsComponent, // Uncomment after creating ListingsComponent
    title: 'Browse Listings'
  },
  {
    path: 'listings/:id',
    component: ListingDetailComponent, // Uncomment after creating ListingDetailComponent
    title: 'Listing Details'
  },
  {
    path: 'destinations',
    component: DestinationsComponent, // Uncomment after creating DestinationsComponent
    title: 'Popular Destinations'
  },
  {
    path: 'planner',
    component: TravelPlannerComponent,
    // canActivate: [AuthGuard], // Uncomment after creating AuthGuard
    title: 'Travel Planner'
  },
  {
    path: 'profile',
    component: UserProfileComponent,
    // canActivate: [AuthGuard], // Uncomment after creating AuthGuard
    title: 'My Profile'
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Log In'
  },
  {
    path: 'signup',
    component: SignupComponent,
    title: 'Sign Up'
  },
  { path: 'admin', component: AdminComponent, canActivate: [AuthGuard], data: { requiresAdmin: true } },
  {
    path: '**',
    redirectTo: '/'
  }
];

import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">Create an Account</h2>

        <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              formControlName="name"
              class="form-control"
              [ngClass]="{'invalid': submitted && f['name'].errors}">
            <div class="error-message" *ngIf="submitted && f['name'].errors">
              <div *ngIf="f['name'].errors['required']">Name is required</div>
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              class="form-control"
              [ngClass]="{'invalid': submitted && f['email'].errors}">
            <div class="error-message" *ngIf="submitted && f['email'].errors">
              <div *ngIf="f['email'].errors['required']">Email is required</div>
              <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              class="form-control"
              [ngClass]="{'invalid': submitted && f['password'].errors}">
            <div class="error-message" *ngIf="submitted && f['password'].errors">
              <div *ngIf="f['password'].errors['required']">Password is required</div>
              <div *ngIf="f['password'].errors['minlength']">Password must be at least 6 characters</div>
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              formControlName="confirmPassword"
              class="form-control"
              [ngClass]="{'invalid': submitted && f['confirmPassword'].errors}">
            <div class="error-message" *ngIf="submitted && f['confirmPassword'].errors">
              <div *ngIf="f['confirmPassword'].errors['required']">Please confirm your password</div>
              <div *ngIf="f['confirmPassword'].errors['mustMatch']">Passwords must match</div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="auth-button" [disabled]="loading">
              {{ loading ? 'Signing up...' : 'Sign Up' }}
            </button>
          </div>

          <div class="auth-error" *ngIf="error">
            {{ error }}
          </div>

          <div class="auth-links">
            <a routerLink="/login">Already have an account? Login</a>
          </div>
        </form>
      </div>
    </div>
  `,
  styleUrls: ['../login/auth.component.sass']
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    // Redirect to home if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    this.signupForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.signupForm.controls; }

  // Custom validator to check if password and confirmPassword match
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  onSubmit() {
    this.submitted = true;

    // Stop here if form is invalid
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.signup(
      this.f['name'].value,
      this.f['email'].value,
      this.f['password'].value
    ).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.error = error;
        this.loading = false;
      }
    });
  }
}

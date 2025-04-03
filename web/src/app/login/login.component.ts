import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2 class="auth-title">Login to RealEstayer</h2>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
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

          <div class="form-actions">
            <button type="submit" class="auth-button" [disabled]="loading">
              {{ loading ? 'Logging in...' : 'Login' }}
            </button>
          </div>

          <div class="auth-error" *ngIf="error">
            {{ error }}
          </div>

          <div class="auth-links">
            <a routerLink="/forgot-password">Forgot password?</a>
            <span class="auth-separator">|</span>
            <a routerLink="/signup">Don't have an account? Sign up</a>
          </div>
        </form>

        <div class="social-login">
          <p class="social-divider"><span>Or login with</span></p>
          <div class="social-buttons">
            <button class="social-button google">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.79-1.677-4.184-2.702-6.735-2.702-5.518 0-10 4.477-10 10s4.482 10 10 10c8.396 0 10.249-7.85 9.426-11.748l-9.426 0.082z"/>
              </svg>
              Google
            </button>
            <button class="social-button facebook">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M20.007 3h-16.014c-0.55 0-0.993 0.444-0.993 0.993v16.014c0 0.55 0.444 0.993 0.993 0.993h8.618v-6.972h-2.344v-2.716h2.344v-2.027c0-2.325 1.42-3.591 3.494-3.591 0.993 0 1.847 0.074 2.096 0.107v2.43h-1.438c-1.128 0-1.346 0.536-1.346 1.323v1.758h2.689l-0.35 2.716h-2.339v6.972h4.59c0.55 0 0.993-0.444 0.993-0.993v-16.014c0-0.55-0.444-0.993-0.993-0.993z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./auth.component.sass']
})
export class LoginComponent {
  loginForm: FormGroup;
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

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;

    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.f['email'].value, this.f['password'].value)
      .subscribe({
        next: () => {
          // Navigate to previous page or home page
          const returnUrl = localStorage.getItem('returnUrl') || '/';
          localStorage.removeItem('returnUrl');
          this.router.navigate([returnUrl]);
        },
        error: (error) => {
          this.error = error;
          this.loading = false;
        }
      });
  }
}

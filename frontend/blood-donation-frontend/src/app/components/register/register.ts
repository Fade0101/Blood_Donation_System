import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  isLoading = signal(false);
  registrationSuccess = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onRegister(): void {
    if (!this.email() || !this.password() || !this.confirmPassword()) {
      this.toastr.error('Please fill in all fields');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.toastr.error('Passwords do not match');
      return;
    }

    if (this.password().length < 6) {
      this.toastr.error('Password must be at least 6 characters');
      return;
    }

    this.isLoading.set(true);
    this.authService.register(this.email(), this.password()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.registrationSuccess.set(true);
        this.toastr.success('Registration successful! Waiting for admin approval.');
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Registration failed');
        this.isLoading.set(false);
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}


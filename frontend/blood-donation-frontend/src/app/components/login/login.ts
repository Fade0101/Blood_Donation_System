import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  isLoading = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  onLogin(): void {
    if (!this.email() || !this.password()) {
      this.toastr.error('Please fill in all fields');
      return;
    }

    this.isLoading.set(true);
    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.toastr.success('Login successful');
        this.router.navigate(['/home']);
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Login failed');
        this.isLoading.set(false);
      }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}

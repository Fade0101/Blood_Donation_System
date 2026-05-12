import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { User } from '../../services/auth.service';

interface UserWithApproval extends User {
  isApproved: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  pendingUsers = signal<UserWithApproval[]>([]);
  approvedUsers = signal<UserWithApproval[]>([]);
  isLoading = signal(false);
  activeTab = signal<'pending' | 'approved'>('pending');
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.http.get<{ success: boolean; data: UserWithApproval[] }>(`${this.apiUrl}/users/pending`)
      .subscribe({
        next: (response) => {
          this.pendingUsers.set(response.data);
          this.loadApprovedUsers();
        },
        error: (error) => {
          this.toastr.error('Failed to load pending users');
          this.isLoading.set(false);
        }
      });
  }

  loadApprovedUsers(): void {
    this.http.get<{ success: boolean; data: UserWithApproval[] }>(`${this.apiUrl}/users`)
      .subscribe({
        next: (response) => {
          this.approvedUsers.set(response.data.filter(u => u.isApproved));
          this.isLoading.set(false);
        },
        error: (error) => {
          this.toastr.error('Failed to load approved users');
          this.isLoading.set(false);
        }
      });
  }

  approveUser(userId: string): void {
    this.http.patch<{ success: boolean; data: UserWithApproval }>(
      `${this.apiUrl}/users/${userId}/approve`,
      {}
    ).subscribe({
      next: (response) => {
        const pendingList = this.pendingUsers().filter(u => u.id !== userId);
        this.pendingUsers.set(pendingList);
        this.approvedUsers.set([...this.approvedUsers(), response.data]);
        this.toastr.success('User approved successfully');
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Failed to approve user');
      }
    });
  }

  rejectUser(userId: string): void {
    this.http.patch<{ success: boolean }>(
      `${this.apiUrl}/users/${userId}/reject`,
      {}
    ).subscribe({
      next: () => {
        const pendingList = this.pendingUsers().filter(u => u.id !== userId);
        this.pendingUsers.set(pendingList);
        this.toastr.success('User rejected and deleted');
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Failed to reject user');
      }
    });
  }

  makeAdmin(userId: string): void {
    this.http.patch<{ success: boolean; data: UserWithApproval }>(
      `${this.apiUrl}/users/${userId}/role`,
      { role: 'ADMIN' }
    ).subscribe({
      next: (response) => {
        const updatedUsers = this.approvedUsers().map(u =>
          u.id === userId ? response.data : u
        );
        this.approvedUsers.set(updatedUsers);
        this.toastr.success('User role updated to Admin');
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Failed to update user role');
      }
    });
  }

  makeStaff(userId: string): void {
    this.http.patch<{ success: boolean; data: UserWithApproval }>(
      `${this.apiUrl}/users/${userId}/role`,
      { role: 'STAFF' }
    ).subscribe({
      next: (response) => {
        const updatedUsers = this.approvedUsers().map(u =>
          u.id === userId ? response.data : u
        );
        this.approvedUsers.set(updatedUsers);
        this.toastr.success('User role updated to Staff');
      },
      error: (error) => {
        this.toastr.error(error.error?.message || 'Failed to update user role');
      }
    });
  }
}

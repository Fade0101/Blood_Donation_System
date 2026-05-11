import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSignal = signal<User | null>(null);
  private tokenSignal = signal<string | null>(null);
  private isLoadingSignal = signal(false);

  currentUser = this.currentUserSignal.asReadonly();
  token = this.tokenSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor(private http: HttpClient) {
    this.loadFromLocalStorage();
  }

  register(email: string, password: string): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { email, password }).pipe(
      tap(response => {
        this.setAuthData(response.data.user, response.data.token);
        this.isLoadingSignal.set(false);
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(response => {
        this.setAuthData(response.data.user, response.data.token);
        this.isLoadingSignal.set(false);
      })
    );
  }

  logout(): void {
    this.currentUserSignal.set(null);
    this.tokenSignal.set(null);
    this.removeFromLocalStorage();
  }

  private setAuthData(user: User, token: string): void {
    this.currentUserSignal.set(user);
    this.tokenSignal.set(token);
    this.saveToLocalStorage(token, user);
  }

  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      if (token && user) {
        this.tokenSignal.set(token);
        this.currentUserSignal.set(JSON.parse(user));
      }
    } catch (error) {
      console.error('Failed to load auth data from localStorage', error);
      this.logout();
    }
  }

  private saveToLocalStorage(token: string, user: User): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save auth data to localStorage', error);
    }
  }

  private removeFromLocalStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Failed to remove auth data from localStorage', error);
    }
  }
}

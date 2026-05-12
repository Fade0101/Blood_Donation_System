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

  // 1. استخراج البيانات من localStorage فوراً قبل تعريف الـ Signals
  private getInitialToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  }

  private getInitialUser(): User | null {
    if (typeof localStorage !== 'undefined') {
      const userJson = localStorage.getItem('user');
      try {
        return userJson ? JSON.parse(userJson) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  // 2. تعريف الـ Signals بقيم ابتدائية حقيقية (عشان الـ Refresh ما يرميش على الـ Login)
  private currentUserSignal = signal<User | null>(this.getInitialUser());
  private tokenSignal = signal<string | null>(this.getInitialToken());
  private isLoadingSignal = signal(false);

  // 3. الـ Readonly والمشتقات (Computed)
  currentUser = this.currentUserSignal.asReadonly();
  token = this.tokenSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  isAuthenticated = computed(() => !!this.tokenSignal());
  isAdmin = computed(() => this.currentUserSignal()?.role === 'ADMIN');

  constructor(private http: HttpClient) {
    // الـ Constructor هنا بقى "رايق" لأن البيانات اتسحبت فوق خلاص
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

  private saveToLocalStorage(token: string, user: User): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private removeFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
}
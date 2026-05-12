import { inject, PLATFORM_ID } from '@angular/core'; // ضيف PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // ضيف دي
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); 

  let hasToken = false;

  if (isPlatformBrowser(platformId)) {
    hasToken = !!localStorage.getItem('token');
  }

  if (authService.isAuthenticated() || hasToken) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
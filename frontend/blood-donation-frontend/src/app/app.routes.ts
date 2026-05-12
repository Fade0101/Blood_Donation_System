import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./components/register/register')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./components/home/home')
        .then(m => m.Home),
    canActivate: [authGuard]
  },
  {
    path: 'donors',
    loadComponent: () =>
      import('./components/donor/donor')
        .then(m => m.Donor),
    canActivate: [authGuard]
  },
  {
    path: 'campaigns',
    loadComponent: () =>
      import('./components/campaign/campaign')
        .then(m => m.CampaignComponent),
    canActivate: [authGuard]
  },
  {
    path: 'campaign-details/:id',
    loadComponent: () =>
      import('./components/campaign-details/campaign-details')
        .then(m => m.CampaignDetailsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard')
        .then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./components/admin-dashboard/admin-dashboard')
        .then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  }
];
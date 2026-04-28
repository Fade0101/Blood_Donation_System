import { Routes } from '@angular/router';

export const routes: Routes = [
 {
  path: '',
  redirectTo: 'home',
  pathMatch: 'full'
},
{
  path: 'home',
  loadComponent: () =>
    import('./components/home/home')
      .then(m => m.Home)
},

  {
    path: 'donors',
    loadComponent: () =>
      import('./components/donor/donor')
        .then(m => m.Donor)
  },
  
  {
    path: 'campaigns',
    loadComponent: () =>
      import('./components/campaign/campaign')
        .then(m => m.Campaign)
  },
    {
    path: 'campaignDetails',
    loadComponent: () =>
      import('./components/campaign-details/campaign-details')
        .then(m => m.CampaignDetails)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard')
        .then(m => m.Dashboard)
  }
];
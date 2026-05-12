import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// 🔥 Chart.js setup
import { Chart, registerables } from 'chart.js';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { offlineInterceptor } from './core/interceptors/offline-interceptor';
Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes,withHashLocation()),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, errorInterceptor, offlineInterceptor])
    ),
    // 1. انقل الـ Service Worker هنا وخلي الاستراتيجية دي:
    provideServiceWorker('ngsw-worker.js', {
      enabled: true, 
      registrationStrategy: 'registerWhenStable:3000' // استنى 3 ثواني الاستقرار وبعدين سجل
    }),
    // 2. الـ Hydration يفضل في الآخر
    provideClientHydration(withEventReplay()),
provideToastr({
      timeOut: 2500,
      extendedTimeOut: 1000,
      progressBar: true,
      progressAnimation: 'decreasing',
      closeButton: true,
      positionClass: 'toast-top-right',
      newestOnTop: true,
      preventDuplicates: true,
      tapToDismiss: true,
      easeTime: 300
    })
    ,    provideBrowserGlobalErrorListeners(),
  ]
};
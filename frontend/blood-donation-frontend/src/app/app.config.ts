import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// 🔥 Chart.js setup
import { Chart, registerables } from 'chart.js';
import { offlineInterceptor } from './core/interceptors/offline-interceptor';
Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ✅ HttpClient مرة واحدة بس
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor,offlineInterceptor])
    ),provideServiceWorker('ngsw-worker.js', {
  enabled: true, // خليها true إجبارياً للتجربة
  registrationStrategy: 'registerImmediately' // خليه يسجل فوراً أول ما الموقع يفتح
}),

    provideRouter(routes),
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
  ]
};

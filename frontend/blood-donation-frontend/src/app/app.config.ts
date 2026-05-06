import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideToastr } from 'ngx-toastr';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// 🔥 Chart.js setup
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ✅ HttpClient مرة واحدة بس
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor])
    ),

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
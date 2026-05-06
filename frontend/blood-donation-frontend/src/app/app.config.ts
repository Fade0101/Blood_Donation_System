import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideToastr } from "ngx-toastr";

import { routes } from "./app.routes";
import { provideClientHydration, withEventReplay } from "@angular/platform-browser";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, errorInterceptor])),
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

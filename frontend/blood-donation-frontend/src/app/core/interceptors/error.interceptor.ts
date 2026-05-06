import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { catchError, throwError } from "rxjs";

interface BackendErrorResponse {
  message?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((err: unknown) => {
      let message = "حدث خطأ في الاتصال بالسيرفر.";

      if (err instanceof HttpErrorResponse) {
        const backendError = err.error as BackendErrorResponse | null;
        if (backendError?.message && backendError.message.trim().length > 0) {
          message = backendError.message;
        }
      }

      toastr.error(message);
      return throwError(() => err);
    })
  );
};

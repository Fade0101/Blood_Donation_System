import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { OfflineManagerService } from '../../services/offline-manager-service';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const offlineService = inject(OfflineManagerService);
  const toastr = inject(ToastrService);

  const isDataChange = ['POST', 'PUT', 'DELETE'].includes(req.method);

  if (!navigator.onLine && isDataChange) {
    offlineService.enqueueRequest(req.url, req.method, req.body);
    toastr.info('لا يوجد اتصال.. تم حفظ البيانات محلياً وسيتم رفعها تلقائياً عند عودة النت');
    
    return of(new Error('OFFLINE_MODE') as any);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0 && isDataChange) {
        offlineService.enqueueRequest(req.url, req.method, req.body);
        toastr.warning('انقطع الاتصال.. تم تأمين البيانات في المخزن المؤقت');
      }
      return throwError(() => error);
    })
  );
};
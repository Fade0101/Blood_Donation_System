import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { OfflineManagerService } from '../../services/offline-manager-service';

export const offlineInterceptor: HttpInterceptorFn = (req, next) => {
  const offlineService = inject(OfflineManagerService);
  const toastr = inject(ToastrService);

  // نحن نهتم فقط بالعمليات التي تغير البيانات (Create, Update, Delete)
  const isDataChange = ['POST', 'PUT', 'DELETE'].includes(req.method);

  if (!navigator.onLine && isDataChange) {
    // حفظ الطلب في الداتابيز المحلية بدلاً من إرساله
    offlineService.enqueueRequest(req.url, req.method, req.body);
    toastr.info('لا يوجد اتصال.. تم حفظ البيانات محلياً وسيتم رفعها تلقائياً عند عودة النت');
    
    // نرجع Response وهمي للـ Component عشان م يضربش Error
    return of(new Error('OFFLINE_MODE') as any);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // لو النت فصل والطلب لسه بيتبعت
      if (error.status === 0 && isDataChange) {
        offlineService.enqueueRequest(req.url, req.method, req.body);
        toastr.warning('انقطع الاتصال.. تم تأمين البيانات في المخزن المؤقت');
      }
      return throwError(() => error);
    })
  );
};
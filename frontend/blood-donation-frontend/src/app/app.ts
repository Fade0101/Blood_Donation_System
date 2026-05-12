import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Navbar } from "./components/navbar/navbar";
import { UiService } from './services/ui-service';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { OfflineManagerService } from './services/offline-manager-service';
import { isPlatformBrowser } from '@angular/common'
@Component({
  selector: 'app-root',
  standalone: true, // تأكد أنها موجودة لو بتستخدم Angular 17+
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  // 1. التحرير (Signals & Injections)
  protected readonly title = signal('blood-donation-frontend');
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private ui = inject(UiService);
  private offlineService = inject(OfflineManagerService);
  private toastr = inject(ToastrService);

  // 2. الـ Constructor لإضافة الـ Listener
  constructor() {
if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => this.syncData());
    }
    }

  // 3. الـ OnInit لمحاولة المزامنة عند فتح التطبيق
async ngOnInit() {
    // نتأكد إننا في المتصفح قبل ما ننادي الـ sync
    if (isPlatformBrowser(this.platformId)) {
      if (navigator.onLine) {
        await this.syncData();
      }
    }
  }
  // 4. دالة المزامنة (محسنة بـ lastValueFrom لضمان الترتيب)
  async syncData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const requests = await this.offlineService.pendingRequests.toArray();
    
    if (requests.length > 0) {
      this.toastr.info(`جاري مزامنة ${requests.length} سجل مع السيرفر...`);

      for (const req of requests) {
        try {
          // ننتظر الطلب يخلص بنجاح قبل ما ندخل في اللي بعده
          await lastValueFrom(this.http.request(req.method, req.url, { body: req.body }));
          
          // نمسحه من الداتابيز المحلية
          await this.offlineService.pendingRequests.delete(req.id!);
          console.log('✅ Synced successfully:', req.url);
        } catch (err) {
          console.error('❌ Sync failed for:', req.url, err);
          // لا نحذفه في حالة الفشل عشان يحاول تاني لما النت يستقر
        }
      }
      this.toastr.success('تم تحديث جميع البيانات بنجاح');
    }
    
  }
  
}
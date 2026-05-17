import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Navbar } from "./components/navbar/navbar";
import { UiService } from './services/ui-service';
import { ToastrService } from 'ngx-toastr';
import { lastValueFrom } from 'rxjs';
import { OfflineManagerService } from './services/offline-manager-service';
import { isPlatformBrowser } from '@angular/common'
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('blood-donation-frontend');
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private ui = inject(UiService);
  private offlineService = inject(OfflineManagerService);
  private toastr = inject(ToastrService);

  constructor() {
if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => this.syncData());
    }
    }

async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (navigator.onLine) {
        await this.syncData();
      }
    }
  }
  async syncData() {
    if (!isPlatformBrowser(this.platformId)) return;
    const requests = await this.offlineService.pendingRequests.toArray();
    
    if (requests.length > 0) {
      this.toastr.info(`جاري مزامنة ${requests.length} سجل مع السيرفر...`);

      for (const req of requests) {
        try {
          await lastValueFrom(this.http.request(req.method, req.url, { body: req.body }));
          
          await this.offlineService.pendingRequests.delete(req.id!);
          console.log('✅ Synced successfully:', req.url);
        } catch (err) {
          console.error('❌ Sync failed for:', req.url, err);
        }
      }
      this.toastr.success('تم تحديث جميع البيانات بنجاح');
    }
    
  }
  
}
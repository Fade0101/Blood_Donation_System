import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { OfflineService } from '../../services/offline';

@Component({
  selector: 'app-campaign-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './campaign-details.html',
  styleUrl: './campaign-details.css',
})
export class CampaignDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService);
  private opsService = inject(CampaignOperationsService);
  private toastr = inject(ToastrService);
  private offlineService = inject(OfflineService);
  private platformId = inject(PLATFORM_ID);

  // --- Signals ---
  loading = signal(false);
  isOnline = signal(true);
  campaign = signal<any>(null);
  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');
  campaignId!: string;
  submittingIds = signal<Set<string>>(new Set());

  // --- Pagination Signals ---
  currentPage = signal(1);
  pageSize = signal(10);
  totalPages = signal(1);
  totalDonorsCount = signal(0);

  // --- Computed Properties ---
  campaignDonorIds = computed(() => {
    const ids = new Set<string>();
    this.campaignDonors().forEach(d => {
      const id = d.nationalId || d.donorId || d.id || d._id;
      if (id) ids.add(id.toString());
    });
    this.submittingIds().forEach(id => ids.add(id.toString()));
    return ids;
  });

  // --- Initialization ---
  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isOnline.set(navigator.onLine);
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.toastr.info('تم استعادة الاتصال، جاري المزامنة...');
        this.syncOfflineData();
      });
      window.addEventListener('offline', () => this.isOnline.set(false));
    }

    this.route.params.subscribe(params => {
      this.campaignId = params['id'];
      if (this.campaignId) this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    this.loadCampaign();
    this.loadAllDonors(); // استدعاء دالة التحميل المطورة
    this.loadCampaignDonors();
  }

  // --- Data Loading Methods ---
  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId).subscribe((res: any) => {
      this.campaign.set(res?.data || res);
    });
  }
// ضيف ده تحت الـ Signals في ملف الـ .ts
filteredDonors = computed(() => {
  const term = this.searchTerm().toLowerCase();
  // لو السيرفر بعت الداتا، وإحنا لسه عايزين نفلترها في الـ UI احتياطاً
  return this.allDonors().filter(d =>
    d.name?.toLowerCase().includes(term) ||
    d.nationalId?.toString().includes(term) ||
    d.phone?.includes(term)
  );
});
  async loadAllDonors() {
    // 1. جلب بيانات الأوفلاين (التي لم ترفع بعد)
    let offlineList: any[] = [];
    if (isPlatformBrowser(this.platformId)) {
      offlineList = await this.offlineService.getAllPendingDonors();
    }

    // 2. طلب السيرفر مع البارامترات (Pagination + Search)
    this.campaignService.getAllDonors(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res: any) => {
        // فك تشفير الـ Response (دعم كائن السيرفر أو المصفوفة المباشرة)
        const serverList = res?.data || (Array.isArray(res) ? res : []);
        
        if (res?.meta) {
          this.totalPages.set(res.meta.totalPages || 1);
          this.totalDonorsCount.set(res.meta.total || 0);
        }

        let merged = [...serverList];

        // دمج الأوفلاين في الصفحة الأولى فقط لتجنب التكرار
        if (this.currentPage() === 1) {
          offlineList.forEach((off: any) => {
            const exists = merged.some(s => s.nationalId?.toString() === off.nationalId?.toString());
            if (!exists) merged.unshift(off);
          });
        }

        this.allDonors.set(merged);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        if (this.currentPage() === 1) this.allDonors.set(offlineList);
        this.toastr.error('فشل في تحديث قائمة المتبرعين');
      }
    });
  }

  loadCampaignDonors() {
    this.opsService.getCampaignDonors(this.campaignId).subscribe((res: any) => {
      this.campaignDonors.set(res?.data || res || []);
    });
  }

  // --- Pagination & Search Actions ---
  onSearch(event: any) {
    this.searchTerm.set(event.target.value ?? '');
    this.currentPage.set(1); // العودة للصفحة الأولى عند البحث
    this.loadAllDonors();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadAllDonors();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadAllDonors();
    }
  }

  // --- Operations ---
  async selectDonor(donor: any) {
    const donorId = donor.nationalId?.toString() || donor.id?.toString();
    if (!donorId || this.isInCampaign(donor)) return;

    this.submittingIds.update(prev => new Set(prev).add(donorId));

    const payload: any = {
      nationalId: donor.nationalId,
      name: donor.name,
      phone: donor.phone,
      address: donor.address || '',
      offlineSyncId: this.generateId()
    };

    if (donor.dateOfBirth) {
      const dateObj = new Date(donor.dateOfBirth);
      if (!isNaN(dateObj.getTime())) payload.dateOfBirth = dateObj.toISOString();
    }

    if (this.isOnline()) {
      this.opsService.registerDonorToCampaign(this.campaignId, payload)
        .pipe(finalize(() => this.removeFromSubmitting(donorId)))
        .subscribe({
          next: () => {
            this.toastr.success('تمت الإضافة بنجاح');
            this.loadCampaignDonors();
          },
          error: (err) => this.toastr.error(err?.error?.message || 'خطأ في الإضافة')
        });
    } else {
      try {
        await this.offlineService.saveStep({ ...payload, campaignId: this.campaignId, syncType: 'CAMPAIGN_ADD' });
        this.toastr.info('تم الحفظ أوفلاين');
        this.campaignDonors.update(list => [...list, payload]);
      } finally {
        this.removeFromSubmitting(donorId);
      }
    }
  }

  async syncOfflineData() {
    const pendingActions = await this.offlineService.getAllSteps();
    if (pendingActions.length === 0) return;

    for (const action of pendingActions) {
      this.opsService.registerDonorToCampaign(this.campaignId, action.data).subscribe({
        next: () => {
          this.offlineService.deleteStep(action.id!);
          this.loadCampaignDonors();
        }
      });
    }
  }

  // --- Helpers ---
  isInCampaign(donor: any): boolean {
    if (!donor) return false;
    const dId = donor.nationalId?.toString() || donor.id?.toString() || donor._id?.toString();
    return this.campaignDonorIds().has(dId);
  }

  private removeFromSubmitting(id: string) {
    this.submittingIds.update(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  private generateId(): string {
    return 'offline-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now();
  }

  exportCSV() {
    this.opsService.exportCampaignDonors(this.campaignId).subscribe(response => {
      const blob = response.body;
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
a.download = `campaign_${this.campaignId}_donors.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }
}
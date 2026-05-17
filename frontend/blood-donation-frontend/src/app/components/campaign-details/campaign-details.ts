import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize, lastValueFrom } from 'rxjs';
import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { OfflineService } from '../../services/offline';
import { Validators } from '@angular/forms';
import { DonorsService } from '../../services/donorsService';
import { CreateDonorRequest } from '../../interfaces/donor-interface';
import Swal from 'sweetalert2';
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
private fb = inject(FormBuilder);
private donorsService = inject(DonorsService);
  // --- Signals ---
  loading = signal(false);
  isOnline = signal(true);
  campaign = signal<any>(null);
  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');
  campaignId!: string;
  submittingIds = signal<Set<string>>(new Set());
  genderFilter = signal<string>('ALL');

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

  maleCount = computed(() => this.campaignDonors().filter((d: any) => d.gender === 'MALE').length);
  femaleCount = computed(() => this.campaignDonors().filter((d: any) => d.gender === 'FEMALE').length);

  filteredCampaignDonors = computed(() => {
    const filter = this.genderFilter();
    const donors = this.campaignDonors();
    if (filter === 'ALL') return donors;
    return donors.filter(d => d.gender === filter);
  });

  setGenderFilter(filter: string) {
    this.genderFilter.set(filter);
  }

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
    this.loadAllDonors();
    this.loadCampaignDonors();
  }

  // --- Data Loading Methods ---
  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId).subscribe((res: any) => {
      this.campaign.set(res?.data || res);
    });
  }
  filteredDonors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.allDonors().filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.nationalId?.toString().includes(term) ||
      d.phone?.includes(term)
    );
  });
  async loadAllDonors() {
    let offlineList: any[] = [];
    if (isPlatformBrowser(this.platformId)) {
      offlineList = await this.offlineService.getAllPendingDonors();
    }

    this.campaignService.getAllDonors(this.currentPage(), this.pageSize(), this.searchTerm()).subscribe({
      next: (res: any) => {
        const serverList = res?.data || (Array.isArray(res) ? res : []);

        if (res?.meta) {
          this.totalPages.set(res.meta.totalPages || 1);
          this.totalDonorsCount.set(res.meta.total || 0);
        }

        let merged = [...serverList];

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
    this.currentPage.set(1);
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
      bloodType: donor.bloodType || undefined,
      gender: donor.gender || undefined,
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

  async removeDonor(donor: any) {
    const donorId = donor.nationalId?.toString() || donor.id?.toString();
    if (!donorId) return;
  const result = await Swal.fire({
    title: 'هل تريد إزالة المتبرع؟',
    text: `سيتم إزالة ${donor.name} من الحملة`,
    imageUrl: '/HabashyBblood.jpg',
    imageWidth: 120,
    imageHeight: 120,
    imageAlt: 'Habashy Blood',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#9ca3af',
    confirmButtonText: 'إزالة',
    cancelButtonText: 'إلغاء',
    background: '#fff',
  });

  if (!result.isConfirmed) return;

    // If offline, try to see if it's an offline addition and just remove it locally
    if (!this.isOnline()) {
      if (donor.isOffline || donor.offlineSyncId) {
        // Find it in offline DB and delete it
        const pendingActions = await this.offlineService.getAllSteps();
        const action = pendingActions.find(a => 
          a.data?.nationalId === donor.nationalId && a.data?.syncType === 'CAMPAIGN_ADD'
        );
        
        if (action?.id) {
          await this.offlineService.deleteStep(action.id);
          this.campaignDonors.update(list => list.filter((d: any) => d.nationalId !== donor.nationalId));
          this.toastr.success('تمت الإزالة (أوفلاين)');
          return;
        }
      }

      // If it's an already synced donor, register a REMOVE action
      try {
        await this.offlineService.saveStep({ 
          nationalId: donor.nationalId, 
          campaignId: this.campaignId, 
          syncType: 'CAMPAIGN_REMOVE' 
        });
        this.campaignDonors.update(list => list.filter((d: any) => d.nationalId !== donor.nationalId));
        this.toastr.info('تم تسجيل الإزالة أوفلاين');
      } catch (err) {
        this.toastr.error('فشل في حفظ إجراء الإزالة أوفلاين');
      }
      return;
    }

    // Online Removal
    this.opsService.removeDonorFromCampaign(this.campaignId, donor.nationalId).subscribe({
      next: () => {
        this.toastr.success('تمت الإزالة بنجاح');
        this.loadCampaignDonors();
      },
      error: (err) => this.toastr.error(err?.error?.message || 'خطأ في الإزالة')
    });
  }

 async syncOfflineData() {
  const pendingActions = await this.offlineService.getAllSteps();
  if (pendingActions.length === 0) return;

  let syncCount = 0;

  for (const action of pendingActions) {
    try {
      if (action.data.syncType === 'CAMPAIGN_REMOVE') {
        await lastValueFrom(this.opsService.removeDonorFromCampaign(this.campaignId, action.data.nationalId));
      } else {
        // محاولة تسجيل المتبرع في الحملة
        await lastValueFrom(this.opsService.registerDonorToCampaign(this.campaignId, action.data));
      }
      
      // لو الخطوة نجحت، امسحها من الـ Offline DB
      await this.offlineService.deleteStep(action.id!);
      syncCount++;

    } catch (err: any) {
      // لو المتبرع موجود فعلاً (Conflict 409)، امسحه من الـ Offline DB بصمت
      if (err.status === 409 || (err.status === 400 && err.error?.message?.includes('exists'))) {
        await this.offlineService.deleteStep(action.id!);
      } else {
        console.error('Sync failed for item:', action.id, err);
      }
    }
  }

  if (syncCount > 0) {
    this.loadCampaignDonors();
    this.toastr.success(`تم مزامنة ${syncCount} من الإجراءات المعلقة`);
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


      const campaignNum = this.campaign()?.campaignNumber || this.campaignId;
      a.download = `campaign_${campaignNum}_donors.csv`;

      a.click();
      window.URL.revokeObjectURL(url);
    });




  }

showAddDonorModal = false;

donorForm = this.fb.group({
  nationalId: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
  name: ['', Validators.required],
  phone: ['', Validators.required],
  address: [''],
  dateOfBirth: [null],
  bloodType: [''],
  gender: [''],
  church: [''],
  confessionFather: [''],
});

openAddDonorModal() {
  this.showAddDonorModal = true;
}

closeAddDonorModal() {
  this.showAddDonorModal = false;
  this.donorForm.reset();
}

saveNewDonor() {
  if (this.donorForm.invalid) {
    this.donorForm.markAllAsTouched();
    this.toastr.warning('من فضلك أكمل البيانات المطلوبة');
    return;
  }

  const v = this.donorForm.value;
  const payload: any = {
    ...v,
    dateOfBirth: v.dateOfBirth ? new Date(v.dateOfBirth).toISOString() : undefined,
    syncType: 'CAMPAIGN_ADD', // مهم جداً للمزامنة لاحقاً
    isOffline: true           // عشان تميزه في الـ UI لو حبيت
  };

  if (this.isOnline()) {
    // كود الـ Online بتاعك سليم
    this.donorsService.createDonor(payload).subscribe({
      next: (newDonor: any) => {
        this.opsService.registerDonorToCampaign(this.campaignId, payload).subscribe({
          next: () => {
            this.toastr.success('تم الإضافة والتسجيل بالحملة 🎉');
            this.loadData(); // تحديث الكل
            this.closeAddDonorModal();
          },
          error: () => {
            this.loadAllDonors();
            this.closeAddDonorModal();
          }
        });
      },
      error: (err: any) => this.toastr.error(err?.error?.error || 'فشل إضافة المتبرع')
    });
  } else {
    // تحسين الـ Offline: احفظه كخطوة مزامنة
    this.offlineService.saveStep({ ...payload, campaignId: this.campaignId }).then(() => {
      this.toastr.info('تم الحفظ أوفلاين وسيتم الرفع عند توفر الإنترنت');
      
      // تحديث القوائم محلياً فوراً
      this.allDonors.update(list => [payload, ...list]);
      this.campaignDonors.update(list => [payload, ...list]);
      
      this.closeAddDonorModal();
    });
  }
}

  
}

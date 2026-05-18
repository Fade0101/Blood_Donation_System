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
  allDonors = signal<any[]>([]);  // ✅ هنا نخزن جميع المتبرعين
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');
  campaignId!: string;
  submittingIds = signal<Set<string>>(new Set());
  genderFilter = signal<string>('ALL');

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

  // ✅ البحث يعمل على allDonors المخزنة (بدون pagination)
  filteredDonors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.allDonors().filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.nationalId?.toString().includes(term) ||
      d.phone?.includes(term)
    );
  });

  setGenderFilter(filter: string) {
    this.genderFilter.set(filter);
  }

  // --- Initialization ---
// أضف هذا الجزء في الـ ngOnInit لضمان تحميل البيانات أول ما نفتح
ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    this.isOnline.set(navigator.onLine);
    
    // Auto sync when online
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncOfflineData();
      this.loadAllDonorsOnce(); // تحديث تلقائي عند عودة النت
    });
  }

  this.route.params.subscribe(params => {
    this.campaignId = params['id'];
    if (this.campaignId) {
      this.loadData();
    }
  });
}

  loadData() {
    this.loading.set(true);
    this.loadCampaign();
    this.loadAllDonorsOnce();  // ✅ تحمل جميع المتبرعين مرة واحدة فقط
    this.loadCampaignDonors();
  }

  // --- Data Loading Methods ---
  loadCampaign() {
    if (this.isOnline()) {
      this.campaignService.getCampaignById(this.campaignId).subscribe((res: any) => {
        this.campaign.set(res?.data || res);
      });
    }
  }

  // ✅ NEW: تحمل جميع المتبرعين مرة واحدة بدون pagination
  loadAllDonorsOnce() {
    this.loading.set(true);

    // أولاً: حمل البيانات المحفوظة offline
    if (isPlatformBrowser(this.platformId)) {
      this.offlineService.getAllPendingDonors().then((offlineList: any[]) => {
        // إذا كان online، احمل من السيرفر
        if (this.isOnline()) {
          // احمل جميع المتبرعين (بدون pagination - حط pageSize كبير جداً أو استخدم endpoint بدون pagination)
          this.campaignService.getAllDonors(1, 10000).subscribe({
            next: (res: any) => {
              let serverList = res?.data || (Array.isArray(res) ? res : []);

              // ادمج مع البيانات offline
              let merged = [...serverList];
              offlineList.forEach((off: any) => {
                const exists = merged.some(s => s.nationalId?.toString() === off.nationalId?.toString());
                if (!exists) merged.unshift(off);
              });

              this.allDonors.set(merged);
              this.loading.set(false);
            },
            error: (err) => {
              console.error('Failed to load donors:', err);
              // إذا فشل، استخدم البيانات المحفوظة
              this.allDonors.set(offlineList);
              this.loading.set(false);
              this.toastr.error('فشل تحميل قائمة المتبرعين من السيرفر');
            }
          });
        } else {
          // إذا كان offline، استخدم البيانات المحفوظة فقط
          this.allDonors.set(offlineList);
          this.loading.set(false);
          this.toastr.info('أنت في وضع أوفلاين - البيانات المعروضة محفوظة محلياً');
        }
      });
    }
  }

  loadCampaignDonors() {
    if (this.isOnline()) {
      this.opsService.getCampaignDonors(this.campaignId).subscribe((res: any) => {
        this.campaignDonors.set(res?.data || res || []);
        this.loading.set(false);
      });
    } else {
      this.loading.set(false);
    }
  }

  // --- Search Actions ---
  // ✅ البحث يعمل على البيانات المحفوظة مباشرة (بدون requests)
  onSearch(event: any) {
    this.searchTerm.set(event.target.value ?? '');
    // filteredDonors computed يتحدث تلقائياً!
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

    if (!this.isOnline()) {
      if (donor.isOffline || donor.offlineSyncId) {
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
          await lastValueFrom(this.opsService.registerDonorToCampaign(this.campaignId, action.data));
        }

        await this.offlineService.deleteStep(action.id!);
        syncCount++;

      } catch (err: any) {
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
    if (!this.isOnline()) {
      this.toastr.warning('لا يمكن تصدير البيانات في وضع أوفلاين');
      return;
    }

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
      syncType: 'CAMPAIGN_ADD',
      isOffline: true
    };

    if (this.isOnline()) {
      this.donorsService.createDonor(payload).subscribe({
        next: (newDonor: any) => {
          this.opsService.registerDonorToCampaign(this.campaignId, payload).subscribe({
            next: () => {
              this.toastr.success('تم الإضافة والتسجيل بالحملة 🎉');
              // أضف للقائمة المحفوظة
              this.allDonors.update(list => [newDonor || payload, ...list]);
              this.loadCampaignDonors();
              this.closeAddDonorModal();
            },
            error: () => {
              this.closeAddDonorModal();
            }
          });
        },
        error: (err: any) => this.toastr.error(err?.error?.error || 'فشل إضافة المتبرع')
      });
    } else {
      this.offlineService.saveStep({ ...payload, campaignId: this.campaignId }).then(() => {
        this.toastr.info('تم الحفظ أوفلاين وسيتم الرفع عند توفر الإنترنت');

        // أضف للقوائم المحلية مباشرة
        this.allDonors.update(list => [payload, ...list]);
        this.campaignDonors.update(list => [payload, ...list]);

        this.closeAddDonorModal();
      });
    }
  }
}
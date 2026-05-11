import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass, DatePipe, isPlatformBrowser } from '@angular/common';
import { DonorsService } from '../../services/donorsService';
import { CreateDonorRequest } from '../../interfaces/donor-interface';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { OfflineService } from '../../services/offline';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-donor',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, DatePipe],
  templateUrl: './donor.html',
  styleUrl: './donor.css',
})
export class Donor implements OnInit {
private offlineService = inject(OfflineService);
  private donorService = inject(DonorsService);
  private fb = inject(FormBuilder);
  private platformId = inject(PLATFORM_ID);
  private toastr = inject(ToastrService);
currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalPages = signal<number>(1);
  totalDonorsCount = signal<number>(0);
  donors = signal<any[]>([]);
  searchText = signal<string>('');
  selectedBloodFilter = signal<string>('ALL');
  bloodStats = signal<any>({});

  donorForm = this.fb.group({
    nationalId: ['', [Validators.required, Validators.minLength(14), Validators.maxLength(14)]],
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: [''],
    dateOfBirth: [null],
    bloodType: [''],
    church: [''],
    confessionFather: [''],
  });

  showModal = false;
  isEditMode = false;
  selectedDonorId: string | null = null;

  filteredDonors = computed(() => {
    const list = this.donors();
    const search = this.searchText().toLowerCase();
    const blood = this.selectedBloodFilter();

    return list.filter(d => {
      const matchesBlood = blood === 'ALL' || d.bloodType === blood;
      const matchesSearch = !search || d.name.toLowerCase().includes(search);
      return matchesBlood && matchesSearch;
    });
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('online', () => this.syncData());
    }
  }

async ngOnInit() {
  if (isPlatformBrowser(this.platformId)) {
    // 1. أول حاجة اظهر البيانات اللي موجودة حالياً (سواء كاش أو سيرفر)
    this.getDonors();

    // 2. لو أونلاين، اعمل مزامنة للداتا المعلقة
    if (navigator.onLine) {
      await this.syncData();
      // 3. بعد المزامنة، حدث الجدول تاني عشان تظهر البيانات الجديدة اللي اترفعت
      this.getDonors(); 
    }
  }
}
async syncData() {
    if (!isPlatformBrowser(this.platformId)) return;

    // 2. نجيب البيانات من Dexie
    const pending = await this.offlineService.getAllPending();
    
    if (pending.length > 0) {
      this.toastr.info(`جاري رفع ${pending.length} متبرع للسيرفر...`);

      for (const item of pending) {
        try {
          // 3. نستخدم الـ donorService لرفع البيانات
          await lastValueFrom(this.donorService.createDonor(item.data));
          
          // 4. لو نجح، نمسحه من الـ Dexie
          await this.offlineService.clearPending(item.id!);
          console.log('✅ Synced donor:', item.data.name);
        } catch (err) {
          console.error('❌ Sync failed for:', item.data.name, err);
        }
      }
      this.toastr.success('تم مزامنة جميع البيانات المعلقة');
    }
  }
getDonors() {

    this.donorService.getAllDonors(this.currentPage(), this.pageSize(), this.searchText(), this.selectedBloodFilter())
      .subscribe({
        next: (res: any) => {
          const donorsArray = res?.data || [];
          this.donors.set(Array.isArray(donorsArray) ? donorsArray : []);

          if (res?.meta) {
            this.totalPages.set(res.meta.totalPages);
            this.totalDonorsCount.set(res.meta.total);
          }
          if (res?.stats) {
            this.bloodStats.set(res.stats);
          }
        },
        error: () => this.toastr.error('فشل تحميل المتبرعين', 'Error')
      });
  }

  onSearch(event: any) {
    this.searchText.set(event.target.value ?? '');
    this.currentPage.set(1);
    this.getDonors();
  }

  filterByBlood(type: string) {
    this.selectedBloodFilter.set(type);
    this.currentPage.set(1);
    this.getDonors();
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.getDonors();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.getDonors();
    }
  }



  count(type: string): number {
    return this.donors().filter(d => d.bloodType === type).length;
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.selectedDonorId = null;
    this.donorForm.reset();
  }

  // createDonor() {
  //   if (this.donorForm.invalid) {
  //     this.markAllTouched();
  //     this.toastr.warning('من فضلك أكمل البيانات المطلوبة', 'Warning');
  //     return;
  //   }

  //   const v = this.donorForm.value;

  //   const payload: CreateDonorRequest = {
  //     nationalId: v.nationalId!,
  //     name: v.name!,
  //     phone: v.phone!,
  //     address: v.address || '',
  //   bloodType: v.bloodType ? v.bloodType : undefined,
  //     church: v.church || '',
  //     confessionFather: v.confessionFather || '',
  //     dateOfBirth: this.formatDate(v.dateOfBirth),
  //   };

  //   this.donorService.createDonor(payload).subscribe({
  //     next: (newDonor) => {
  //       this.donors.update(list => [newDonor, ...list]);
  //       this.toastr.success('تم إضافة المتبرع بنجاح 🎉', 'Success', { timeOut: 2000 });
  //       this.closeModal();
  //     },
  //     error: err =>
  //       this.toastr.error(err?.error?.error || 'فشل إضافة المتبرع', 'Error')
  //   });
  // }
  

  deleteDonor(id: string) {
    Swal.fire({
     title: 'هل تريد حذف المتبرع؟',
  text: 'لا يمكن التراجع بعد الحذف',
  imageUrl: '/HabashyBblood.jpg',
  imageWidth: 120,
  imageHeight: 120,
  imageAlt: 'Habashy Blood',
  showCancelButton: true,
  confirmButtonColor: '#dc2626',
  cancelButtonColor: '#9ca3af',
  confirmButtonText: 'حذف',
  cancelButtonText: 'إلغاء',
  background: '#fff',
    }).then(result => {
      if (!result.isConfirmed) return;

      this.donorService.deleteDonor(id).subscribe({
        next: () => {
          this.donors.update(list => list.filter(d => d.id !== id));
          this.toastr.success('تم حذف المتبرع', 'Deleted');
        },
        error: () => this.toastr.error('فشل الحذف', 'Error')
      });
    });
  }

  openEditModal(donor: any) {
    this.isEditMode = true;
    this.selectedDonorId = donor.id;

    this.donorForm.patchValue({
      nationalId: donor.nationalId,
      name: donor.name,
      phone: donor.phone,
      address: donor.address,
      dateOfBirth: donor.dateOfBirth ? donor.dateOfBirth.split('T')[0] : null,
      bloodType: donor.bloodType,
      church: donor.church,
      confessionFather: donor.confessionFather,
    });

    this.showModal = true;
  }

saveDonor() {
    if (this.donorForm.invalid) {
      this.markAllTouched();
      this.toastr.warning('من فضلك أكمل البيانات المطلوبة', 'Warning');
      return;
    }

    const v = this.donorForm.value;

    const payload: CreateDonorRequest = {
      nationalId: v.nationalId!,
      name: v.name!,
      phone: v.phone!,
      address: v.address || '',
      bloodType: v.bloodType ? v.bloodType : undefined,
      church: v.church || '',
      confessionFather: v.confessionFather || '',
      dateOfBirth: this.formatDate(v.dateOfBirth),
    };

    if (this.isEditMode && this.selectedDonorId) {
      // حالة التعديل (Edit)
      this.donorService.updateDonor(this.selectedDonorId, payload).subscribe({
        next: updated => {
          if (!updated) return;
          this.donors.update(list =>
            list.map(d => (d.id === updated.id ? updated : d))
          );
          this.toastr.info('تم تحديث بيانات المتبرع', 'Updated');
          this.closeModal();
        },
        error: () => this.toastr.error('فشل التحديث', 'Error')
      });
    } else {
      // حالة الإضافة (Create) - بننادي الدالة اللي تحتها
      this.createDonor(payload);
    }
  }

  // الدالة اللي كانت ناقصة أو فيها مشكلة في الاسم
  createDonor(payload: CreateDonorRequest) {
    if (navigator.onLine) {
      // لو أونلاين: ابعت للسيرفر
      this.donorService.createDonor(payload).subscribe({
        next: (newDonor) => {
          this.donors.update(list => [newDonor, ...list]);
          this.toastr.success('تم إضافة المتبرع بنجاح 🎉', 'Success');
          this.closeModal();
        },
        error: err => this.toastr.error(err?.error?.error || 'فشل إضافة المتبرع', 'Error')
      });
    } else {
      // لو أوفلاين: احفظ في IndexedDB (Dexie)
      this.offlineService.saveStep(payload).then(() => {
        this.toastr.info('تم الحفظ أوفلاين.. سيتم الرفع عند عودة الإنترنت', 'Offline');
        this.donors.update(list => [payload as any, ...list]); // تحديث شكلي للقائمة
        this.closeModal();
      });
    }
  }

  private formatDate(date: any): string | undefined {
    if (!date) return undefined;

    const d = new Date(date);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  getBloodClass(type: string): string {
    switch (type) {
      case 'A_POS': return 'blood-a-pos';
      case 'A_NEG': return 'blood-a-neg';
      case 'B_POS': return 'blood-b-pos';
      case 'B_NEG': return 'blood-b-neg';
      case 'AB_POS': return 'blood-ab-pos';
      case 'AB_NEG': return 'blood-ab-neg';
      case 'O_POS': return 'blood-o-pos';
      case 'O_NEG': return 'blood-o-neg';
      default: return 'blood-default';
    }
  }

  markAllTouched() {
    this.donorForm.markAllAsTouched();
  }
}

import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass, DatePipe } from '@angular/common';
import { DonorsService } from '../../services/donorsService';
import { CreateDonorRequest } from '../../interfaces/donor-interface';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-donor',
  standalone: true,
  imports: [ReactiveFormsModule, NgClass, DatePipe],
  templateUrl: './donor.html',
  styleUrl: './donor.css',
})
export class Donor implements OnInit {

  private donorService = inject(DonorsService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  donors = signal<any[]>([]);
  searchText = signal<string>('');
  selectedBloodFilter = signal<string>('ALL');

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

  ngOnInit(): void {
    this.getDonors();
  }

  getDonors() {
    this.donorService.getAllDonors().subscribe({
      next: (res: any[]) => this.donors.set(Array.isArray(res) ? res : []),
      error: () => this.toastr.error('فشل تحميل المتبرعين', 'Error')
    });
  }

  onSearch(event: any) {
    this.searchText.set(event.target.value ?? '');
  }

  filterByBlood(type: string) {
    this.selectedBloodFilter.set(type);
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

  createDonor() {
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
      bloodType: v.bloodType || '',
      church: v.church || '',
      confessionFather: v.confessionFather || '',
      dateOfBirth: this.formatDate(v.dateOfBirth),
    };

    this.donorService.createDonor(payload).subscribe({
      next: (newDonor) => {
        this.donors.update(list => [newDonor, ...list]);
        this.toastr.success('تم إضافة المتبرع بنجاح 🎉', 'Success', { timeOut: 2000 });
        this.closeModal();
      },
      error: err =>
        this.toastr.error(err?.error?.error || 'فشل إضافة المتبرع', 'Error')
    });
  }

  deleteDonor(id: string) {
    Swal.fire({
      title: 'هل أنت متأكد؟',
      text: 'لن يمكنك التراجع بعد الحذف!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'نعم احذف',
      cancelButtonText: 'إلغاء'
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
      bloodType: v.bloodType || '',
      church: v.church || '',
      confessionFather: v.confessionFather || '',
      dateOfBirth: this.formatDate(v.dateOfBirth),
    };

    if (this.isEditMode && this.selectedDonorId) {
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
      this.createDonor();
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
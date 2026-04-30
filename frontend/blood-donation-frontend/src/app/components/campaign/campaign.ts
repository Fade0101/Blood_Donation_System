import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Campaign } from '../../interfaces/campaign';
import { CampaignService } from '../../services/campaignService';
import { CreateCampaignRequest } from '../../interfaces/campaign';

@Component({
  selector: 'app-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaign.html',
  styleUrl: './campaign.css',
})
export class CampaignComponent implements OnInit {

  private router = inject(Router);
  private toastr = inject(ToastrService);
  private campaignService = inject(CampaignService);
  private fb = inject(FormBuilder);

  // ================= STATE =================
  campaigns = signal<Campaign[]>([]);
  searchText = signal('');
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  showModal = signal(false);
  submitting = signal(false);
isEditMode = signal(false);
selectedId = signal<string | null>(null);
  // ================= FORM =================
  campaignForm = this.fb.group({
campaignNumber: this.fb.control<number | null>(null, Validators.required),
bloodBankName: this.fb.control<string>('', Validators.required),
supervisorName: this.fb.control<string>('', Validators.required),
startDate: this.fb.control<string>(''),
endDate: this.fb.control<string>(''),
});

  ngOnInit(): void {
    this.loadCampaigns();
  }

  // ================= LOAD =================
  loadCampaigns() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.campaignService.getAllCampaigns().subscribe({
      next: (res) => {
        this.campaigns.set(res ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('فشل تحميل الحملات');
      },
    });
  }

  // ================= FILTER =================
  filteredCampaigns = computed(() => {
    const search = this.searchText().toLowerCase();

    return this.campaigns().filter(c =>
      c.bloodBankName?.toLowerCase().includes(search) ||
      c.campaignNumber?.toString().includes(search)
    );
  });

  onSearch(event: Event) {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  // ================= NAV =================
  openCampaign(id: string) {
    this.router.navigate(['/campaign-details', id]);
  }

  // ================= MODAL =================
  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.campaignForm.reset();
  }

  // ================= CREATE =================
submitCampaign() {

  if (this.campaignForm.invalid) return;

  this.submitting.set(true);

  const v = this.campaignForm.value;

  const payload: CreateCampaignRequest = {
    campaignNumber: Number(v.campaignNumber),
    bloodBankName: v.bloodBankName!,
    supervisorName: v.supervisorName!,
    startDate: v.startDate ? new Date(v.startDate).toISOString() : undefined,
    endDate: v.endDate ? new Date(v.endDate).toISOString() : undefined,
  };

  // ================= EDIT MODE =================
  if (this.isEditMode()) {

    this.campaignService.updateCampaign(this.selectedId()!, payload).subscribe({
      next: (res) => {

        this.toastr.success('تم التعديل بنجاح');

        this.campaigns.update(list =>
          list.map(c => c.id === res.id ? res : c)
        );

        this.resetForm();
      },
      error: () => this.toastr.error('فشل التعديل')
    });

    return;
  }

  // ================= CREATE MODE =================
  this.campaignService.createCampaign(payload).subscribe({
    next: (res) => {

      this.toastr.success('تم الإنشاء');

      this.campaigns.update(list => [res, ...list]);

      this.resetForm();
    },
    error: (err) => {
      this.toastr.error(err.error?.message || 'فشل الإنشاء');
    }
  });
}
resetForm() {
  this.submitting.set(false);
  this.showModal.set(false);
  this.campaignForm.reset();
  this.isEditMode.set(false);
  this.selectedId.set(null);
}
  // ================= DELETE (NEW) =================
  deleteCampaign(id: string) {

    if (!confirm('هل أنت متأكد؟')) return;

    this.campaignService.deleteCampaign(id).subscribe({
      next: () => {
        this.campaigns.update(list => list.filter(c => c.id !== id));
        this.toastr.success('تم الحذف');
      },
      error: () => {
        this.toastr.error('فشل الحذف');
      }
    });
  }
editCampaign(c: Campaign) {

  this.isEditMode.set(true);
  this.selectedId.set(c.id);

  this.showModal.set(true);

  this.campaignForm.patchValue({
    campaignNumber: c.campaignNumber,
    bloodBankName: c.bloodBankName,
    supervisorName: c.supervisorName,
    startDate: c.startDate ? c.startDate.split('T')[0] : '',
    endDate: c.endDate ? c.endDate.split('T')[0] : '',
  });
}
}
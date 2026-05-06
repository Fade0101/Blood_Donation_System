import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { Campaign, CreateCampaignRequest } from '../../interfaces/campaign';
import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { DonorsService } from '../../services/donorsService';

@Component({
  selector: 'app-campaign',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaign.html',
  styleUrl: './campaign.css',
})
export class CampaignComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private campaignService = inject(CampaignService);
  private campaignOperationsService = inject(CampaignOperationsService);
  private donorsService = inject(DonorsService);
  private fb = inject(FormBuilder);

  campaigns = signal<Campaign[]>([]);
  searchText = signal('');
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  showModal = signal(false);
  submitting = signal(false);
  isEditMode = signal(false);
  selectedId = signal<string | null>(null);

  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  filteredDonors = signal<any[]>([]);

  campaignForm = this.fb.group({
    campaignNumber: this.fb.control<number | null>(null, Validators.required),
    bloodBankName: this.fb.control('', Validators.required),
    supervisorName: this.fb.control('', Validators.required),
    startDate: this.fb.control(''),
    endDate: this.fb.control(''),
  });

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadAllDonors();

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadCampaignDonors(id);
    });
  }

  loadCampaigns() {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.campaignService.getAllCampaigns().subscribe({
      next: (res) => {
        this.campaigns.set(res ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Load Campaigns Error:', err);
        this.errorMessage.set('فشل تحميل الحملات');
      },
    });
  }

  loadAllDonors() {
    this.campaignService.getAllDonors().subscribe({
      next: (res) => {
        this.allDonors.set(res);
        this.filteredDonors.set(res);
      }
    });
  }

  loadCampaignDonors(campaignId: string) {
    this.campaignOperationsService.getCampaignDonors(campaignId).subscribe({
      next: (res) => this.campaignDonors.set(res),
      error: (err) => console.error('Load Campaign Donors Error:', err)
    });
  }

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

  openCampaign(id: string) {
    this.router.navigate(['/campaign-details', id]);
  }

  openModal() {
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.campaignForm.reset();
  }

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

    if (this.isEditMode()) {
      this.campaignService.updateCampaign(this.selectedId()!, payload).subscribe({
        next: (res) => {
          this.toastr.success('تم التعديل بنجاح');
          this.campaigns.update(list =>
            list.map(c => c.id === res.id ? res : c)
          );
          this.resetForm();
        },
        error: (err) => {
          console.error('Update Campaign Error:', err);
          this.toastr.error('فشل التعديل');
        }
      });

      return;
    }

    this.campaignService.createCampaign(payload).subscribe({
      next: (res) => {
        this.toastr.success('تم الإنشاء');
        this.campaigns.update(list => [res, ...list]);
        this.resetForm();
      },
      error: (err) => {
        console.error('Create Campaign Error:', err);
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

  deleteCampaign(id: string) {
    if (!confirm('هل أنت متأكد؟')) return;

    this.campaignService.deleteCampaign(id).subscribe({
      next: () => {
        this.toastr.success('تم الحذف');
        this.loadCampaigns();
      },
      error: (err) => {
        console.error('Delete Campaign Error:', err);
        this.toastr.error(
          err?.error?.message || 'فشل الحذف (غالبًا الحملة مرتبطة بمتبرعين)'
        );
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
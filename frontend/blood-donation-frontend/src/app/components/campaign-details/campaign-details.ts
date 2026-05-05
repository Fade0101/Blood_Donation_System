import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';

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
  private fb = inject(FormBuilder);

  loading = signal(false);
  campaign = signal<any>(null);

  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');

  campaignId!: string;

  filteredDonors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.allDonors().filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.nationalId?.includes(term) ||
      d.phone?.includes(term)
    );
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.campaignId = params['id'];
      if (this.campaignId) {
        this.loadInitialData();
      }
    });
  }

  loadInitialData() {
    this.loading.set(true);

    this.loadCampaign();

    this.campaignService.getAllDonors().subscribe({
      next: (donors) => {
        this.allDonors.set(donors);

        this.opsService.getCampaignDonors(this.campaignId).subscribe({
          next: (campaignDonors) => {
            this.campaignDonors.set(campaignDonors);
            this.loading.set(false);
          },
          error: () => {
            this.campaignDonors.set([]);
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.allDonors.set([]);
        this.loading.set(false);
      }
    });
  }

  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId)
      .subscribe(res => this.campaign.set(res));
  }

  isInCampaign(donorId: string): boolean {
    return this.campaignDonors().some(d => d.id === donorId);
  }

  selectDonor(donor: any) {
    if (this.isInCampaign(donor.id)) {
      this.toastr.warning('المتبرع موجود بالفعل');
      return;
    }

    if (!donor.name || !donor.phone) {
      this.toastr.error('لازم الاسم والموبايل');
      return;
    }

    const payload = {
      nationalId: donor.nationalId,
      name: donor.name,
      phone: donor.phone,
      address: donor.address || '',
      dateOfBirth: donor.dateOfBirth
        ? new Date(donor.dateOfBirth).toISOString()
        : undefined,
      offlineSyncId: crypto.randomUUID()
    };

    this.opsService.registerDonorToCampaign(this.campaignId, payload)
      .subscribe({
        next: () => {
          this.loadInitialData();
          this.toastr.success('تمت الإضافة');
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || 'فشل الإضافة'
          );
        }
      });
  }

  exportCSV() {
    this.opsService.exportCampaignDonors(this.campaignId)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign-${this.campaignId}.csv`;
        a.click();
      });
  }
}
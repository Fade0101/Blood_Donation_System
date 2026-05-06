import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { link } from 'fs';

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

  // ================= STATE =================
  loading = signal(false);

  campaign = signal<any>(null);
  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');

  campaignId!: string;

  // ================= DERIVED =================
  campaignDonorIds = computed(() => {
    return new Set(
      this.campaignDonors().map(d => d.donorId || d.id || d._id)
    );
  });

  isInCampaign = (id: string) => {
    return this.campaignDonorIds().has(id);
  };

  filteredDonors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const donors = this.allDonors() || [];

    return donors.filter(d =>
      d.name?.toLowerCase().includes(term) ||
      d.nationalId?.includes(term) ||
      d.phone?.includes(term)
    );
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.campaignId = params['id'];
      this.loadData();
    });
  }

  // ================= LOAD =================
  loadData() {
    this.loading.set(true);
    this.loadCampaign();
    this.loadAllDonors();
    this.loadCampaignDonors();
  }

  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId)
      .subscribe((res: any) => {
        this.campaign.set(res.data || res);
      });
  }

  loadAllDonors() {
    this.campaignService.getAllDonors(10000)
      .subscribe((res: any) => {
        const data = res.data || res;
        this.allDonors.set(Array.isArray(data) ? data : []);
      });
  }

  loadCampaignDonors() {
    this.opsService.getCampaignDonors(this.campaignId)
      .subscribe({
        next: (res: any) => {
          const data = res.data || res;
          this.campaignDonors.set(Array.isArray(data) ? data : []);
          this.loading.set(false);
        },
        error: () => {
          this.campaignDonors.set([]);
          this.loading.set(false);
        }
      });
  }

  // ================= ACTIONS =================
  selectDonor(donor: any) {

    if (this.isInCampaign(donor.id)) {
      this.toastr.warning('المتبرع موجود بالفعل');
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
          this.toastr.success('تمت الإضافة بنجاح');
          this.loadCampaignDonors();
        }
      });
  }

  exportCSV() {
    this.opsService.exportCampaignDonors(this.campaignId)
      .subscribe((response: HttpResponse<Blob>) => {
        const blob = response.body;
        if (!blob) {
          this.toastr.error('تعذر تصدير الملف حالياً');
          return;
        }

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign_${this.campaign()?.campaignNumber || this.campaignId}.csv`;
        a.click();

        window.URL.revokeObjectURL(url);
      });
  }
}

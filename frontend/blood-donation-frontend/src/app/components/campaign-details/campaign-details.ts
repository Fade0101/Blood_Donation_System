import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { HttpResponse } from '@angular/common/http'; 

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

  loading = signal(false);
  campaign = signal<any>(null);


  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  searchTerm = signal('');

  campaignId!: string;


  filteredDonors = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const donors = this.allDonors();

    if (!Array.isArray(donors)) return [];

    return donors.filter(d =>
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





  }

  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId)
      .subscribe((res: any) => {
        this.campaign.set(res.data || res);
      });
  }

  isInCampaign(donorId: string): boolean {
    const donors = this.campaignDonors();

    return donors.some(d => (d.donorId === donorId || d.id === donorId));
  }

  selectDonor(donor: any) {
    if (this.isInCampaign(donor.id)) {
      this.toastr.warning('المتبرع موجود بالفعل في هذه الحملة');
      return;
    }

    const payload = {
      nationalId: donor.nationalId,
      name: donor.name,
      phone: donor.phone,
      address: donor.address || '',
      dateOfBirth: donor.dateOfBirth ? new Date(donor.dateOfBirth).toISOString() : undefined,
      offlineSyncId: crypto.randomUUID()
    };

    this.opsService.registerDonorToCampaign(this.campaignId, payload)
      .subscribe({
        next: () => {
          this.loadInitialData();
          this.toastr.success('تمت إضافة المتبرع للحملة بنجاح');
        }

      });
  }

  exportCSV() {
  this.opsService.exportCampaignDonors(this.campaignId)
    .subscribe({
      next: (response) => {
        const blobData = response.body as Blob;
        if (!blobData) return;

        const contentDisposition = response.headers.get('content-disposition');


        const campNumber = this.campaign()?.campaignNumber || this.campaignId;
        const fileName = contentDisposition
          ?.split('filename=')[1]
          ?.replace(/"/g, '') || `campaign_${campNumber}_donors.csv`;

        const url = window.URL.createObjectURL(blobData);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
}
}

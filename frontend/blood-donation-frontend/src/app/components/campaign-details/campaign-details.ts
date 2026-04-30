import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
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

  // ================= INJECT =================
  private route = inject(ActivatedRoute);
  private campaignService = inject(CampaignService);
  private opsService = inject(CampaignOperationsService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  // ================= STATE =================
  campaign = signal<any>(null);

  allDonors = signal<any[]>([]);
  campaignDonors = signal<any[]>([]);
  filteredDonors = signal<any[]>([]);

  loading = signal(false);
  submitting = signal(false);

  campaignId!: string;

  // ================= SEARCH =================
  searchTerm: string = '';

  // ================= FORM =================
  donorForm = this.fb.group({
    nationalId: ['', Validators.required],
    name: [''],
    phone: [''],
    address: [''],
    dateOfBirth: [''],
  });

  // ================= INIT =================
  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id')!;

    this.loadCampaign();
    this.loadAllDonors();
    this.loadCampaignDonors();
  }

  // ================= LOAD CAMPAIGN =================
  loadCampaign() {
    this.campaignService.getCampaignById(this.campaignId)
      .subscribe(res => this.campaign.set(res));
  }

  // ================= LOAD ALL DONORS =================
  loadAllDonors() {
    this.campaignService.getAllDonors().subscribe({
      next: (res) => {
        this.allDonors.set(res);
        this.applyFilter(); // 👈 مهم
      },
      error: () => {
        this.allDonors.set([]);
        this.filteredDonors.set([]);
      }
    });
  }

  // ================= LOAD CAMPAIGN DONORS =================
  loadCampaignDonors() {
    this.opsService.getCampaignDonors(this.campaignId).subscribe({
      next: (res) => this.campaignDonors.set(res),
      error: () => this.campaignDonors.set([])
    });
  }

  // ================= FILTER LOGIC =================
  applyFilter() {
    const term = this.searchTerm.trim().toLowerCase();

    let baseList = this.allDonors();

    // ❗ نشيل اللي موجودين في الحملة الحالية
    const campaignIds = new Set(
      this.campaignDonors().map(d => d.id)
    );

    baseList = baseList.filter(d => !campaignIds.has(d.id));

    // 🔍 search filter
    if (term) {
      baseList = baseList.filter(d =>
        d.name?.toLowerCase().includes(term) ||
        d.nationalId?.includes(term) ||
        d.phone?.includes(term)
      );
    }

    this.filteredDonors.set(baseList);
  }

  // ================= SEARCH INPUT =================
  onSearchChange(value: string) {
    this.searchTerm = value;
    this.applyFilter();
  }

  // ================= SELECT DONOR =================
  selectDonor(donor: any) {

    const payload = {
      nationalId: donor.nationalId,
      name: donor.name,
      phone: donor.phone,
      address: donor.address,
      dateOfBirth: donor.dateOfBirth
        ? new Date(donor.dateOfBirth).toISOString()
        : undefined
    };

    this.opsService.registerDonorToCampaign(this.campaignId, payload)
      .subscribe({
        next: (res) => {

          // ✔ add to campaign
          this.campaignDonors.update(list => [
            res.donor,
            ...list
          ]);

          // ✔ remove from filtered list
          this.filteredDonors.update(list =>
            list.filter(d => d.id !== donor.id)
          );

          // ✔ remove from all donors (optional UI sync)
          this.allDonors.update(list =>
            list.filter(d => d.id !== donor.id)
          );

          this.toastr.success('تم إضافة المتبرع للحملة');

        },
        error: (err) => {
          console.log("REGISTER ERROR:", err);
          this.toastr.error(err.error?.error || 'فشل الإضافة');
        }
      });
  }

  // ================= EXPORT =================
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
import { Component, inject, signal, computed, OnInit, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignService } from '../../services/campaignService';
import { ImportService } from '../../services/import';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private campaignService = inject(CampaignService);
  private importService = inject(ImportService);
fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');  donors = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  loading = signal(false);
  importLoading = signal(false);
private toastr = inject(ToastrService);
  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard() {
    this.loading.set(true);

    this.campaignService.getAllDonors().subscribe({
      next: (res: any) => {
        this.donors.set(res?.data ?? res ?? []);
      },
    });

    this.campaignService.getAllCampaigns().subscribe({
      next: (res: any) => {
        this.campaigns.set(res?.data ?? res ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

onFileSelected(event: any) {
  const file: File = event.target.files[0];

  if (!file) {
    console.log('❌ No file selected');
    return;
  }

  console.log('🚀 [UI] Blood Bank Import Started');
  console.log('📄 File:', {
    name: file.name,
    size: file.size,
    type: file.type,
  });

  this.importLoading.set(true);

  this.importService.importBloodBank(file).subscribe({
    next: (res: any) => {
      console.log('✅ [UI] IMPORT SUCCESS');
      console.log('📦 Full Response:', res);

      console.log('📊 Inserted:', res?.data?.inserted);
      console.log('♻️ Updated:', res?.data?.updated);
      console.log('⏭️ Skipped:', res?.data?.skipped);
      console.log('❌ Errors:', res?.data?.errors);

      this.importLoading.set(false);

      this.toastr.success(
        `تم استيراد ${res?.data?.inserted ?? 0} متبرع بنجاح`
      );

      this.refreshDashboard();
    },

    error: (err) => {
      console.log('❌ [UI] IMPORT FAILED');
      console.log('🔥 Full Error Object:', err);
      console.log('📩 Backend Error:', err?.error);
      console.log('📩 Message:', err?.error?.message || err?.message);
      console.log('📩 Status:', err?.status);

      this.importLoading.set(false);

      this.toastr.error(
        err?.error?.message ||
        err?.error?.error ||
        'حدث خطأ أثناء الاستيراد'
      );
    },
  });
}

  totalDonors = computed(() => this.donors().length);
  totalCampaigns = computed(() => this.campaigns().length);

  newDonors = computed(() =>
    this.donors().filter(
      (d) =>
        d.createdAt &&
        new Date(d.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    ).length
  );
  onLegacyFileSelected(event: any) {
  const file: File = event.target.files[0];

  if (!file) return;

  this.importLoading.set(true);

  this.importService.importLegacy(file).subscribe({
    next: (res: any) => {
      this.importLoading.set(false);

      this.toastr.success(
        `تم استيراد البيانات القديمة بنجاح`
      );

      console.log('LEGACY IMPORT RESPONSE:', res);

      this.refreshDashboard();
    },

    error: (err) => {
      this.importLoading.set(false);

      const message =
        err?.error?.error ||
        err?.error?.message ||
        err?.message ||
        'حدث خطأ أثناء استيراد البيانات القديمة';

      this.toastr.error(message);

      console.error(err);
    },
  });
}
}
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignService } from '../../services/campaignService';
import { ImportService } from '../../services/import';

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

  donors = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  loading = signal(false);
  importLoading = signal(false);

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

    if (!file) return;

    this.importLoading.set(true);

    this.importService.importBloodBank(file).subscribe({
      next: (res: any) => {
        console.log('IMPORT SUCCESS RESPONSE:', res);

        this.importLoading.set(false);

        if (res?.success === true) {
          alert(
            `تم الاستيراد بنجاح\nعدد المستورد: ${
              res?.data?.successCount ?? 'غير معروف'
            }`
          );
        } else {
          alert('تم التنفيذ لكن بدون تأكيد نجاح واضح');
        }

        this.refreshDashboard();
      },

      error: (err) => {
        console.error('IMPORT ERROR RESPONSE:', err);

        this.importLoading.set(false);

        const message =
          err?.error?.error ||
          err?.error?.message ||
          err?.message ||
          'حدث خطأ أثناء الاستيراد';

        alert(`فشل الاستيراد:\n${message}`);
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
}
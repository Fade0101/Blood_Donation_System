import { Component, inject, signal, computed, OnInit, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignService } from '../../services/campaignService';
import { ImportService } from '../../services/import';
import { ToastrService } from 'ngx-toastr';
import * as Papa from 'papaparse';

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
  private toastr = inject(ToastrService);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
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
      error: () => this.loading.set(false),
    });
  }

private fixBloodType(type: string): any {
  if (!type || type.trim() === '' || type === '-') return null;

  const clean = type.trim().toUpperCase().replace(/\s+/g, '').replace('ـــ', '');
  
  const map: { [key: string]: string } = {
    'A+': 'A_POS',  'A-': 'A_NEG',
    'B+': 'B_POS',  'B-': 'B_NEG',
    'AB+': 'AB_POS', 'AB-': 'AB_NEG',
    'O+': 'O_POS',  'O-': 'O_NEG',
    'A_POS': 'A_POS', 'A_NEG': 'A_NEG',
    'B_POS': 'B_POS', 'B_NEG': 'B_NEG',
    'AB_POS': 'AB_POS', 'AB_NEG': 'AB_NEG',
    'O_POS': 'O_POS', 'O_NEG': 'O_NEG'
  };

  return map[clean] || null;
}

onFileSelected(event: any) {
  const file: File = event.target.files[0];
  if (!file) return;

  this.importLoading.set(true);

  const reader = new FileReader();
  reader.onload = (e: any) => {
    const content = e.target.result;
    
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        const cleanedData = results.data.map((row: any) => ({
          ...row,
          name: String(row.name || row['الاسم'] || '').replace(/[^\u0600-\u06FF\s]/g, '').trim(),
          nationalId: String(row.nationalId || row['الرقم القومي'] || '').trim(),
          bloodType: this.fixBloodType(row.bloodType || row['فصيلة الدم'] || ''),
          campaignNumber: Number(row.campaignNumber || row['رقم الحملة'] || 1)
        }));

        const csvString = Papa.unparse(cleanedData);
        const blob = new Blob([`\ufeff${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const cleanedFile = new File([blob], file.name, { type: 'text/csv' });

        this.importService.importBloodBank(cleanedFile).subscribe({
          next: (res: any) => {
            this.importLoading.set(false);
            this.toastr.success(`تم الاستيراد بنجاح`);
            this.refreshDashboard();
          },
          error: (err) => {
            this.importLoading.set(false);
            this.toastr.error('فشل الاستيراد.. تأكد من تنسيق الملف');
          }
        });
      }
    });
  };
  reader.readAsText(file, 'utf-8');
}

  onLegacyFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.importLoading.set(true);
    this.importService.importLegacy(file).subscribe({
      next: (res: any) => {
        this.importLoading.set(false);
        this.toastr.success(`تم استيراد البيانات القديمة بنجاح`);
        this.refreshDashboard();
      },
      error: (err) => {
        this.importLoading.set(false);
        this.toastr.error(err?.error?.message || 'حدث خطأ أثناء استيراد البيانات القديمة');
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
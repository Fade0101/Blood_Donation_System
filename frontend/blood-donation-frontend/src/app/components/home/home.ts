import { Component, inject, signal, computed, OnInit, viewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../services/campaignService';
import { ImportService } from '../../services/import';
import { ToastrService } from 'ngx-toastr';
import * as Papa from 'papaparse';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { Campaign, Donor } from '../../interfaces/campaign';
import { Slider, SliderModule } from 'ngx-slider';
import { DashboardComponent } from "../dashboard/dashboard";
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Home implements OnInit {
  private campaignService = inject(CampaignService);
  private importService = inject(ImportService);
  private toastr = inject(ToastrService);
  private opsService = inject(CampaignOperationsService);
private router = inject(Router);

  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  donors = signal<Donor[]>([]);
  campaigns = signal<Campaign[]>([]);
  loading = signal(false);
  importLoading = signal(false);
 public slider = new Slider();

  constructor() {
    this.slider.config.loop = true;
    this.slider.config.showPreview = false;
  }
  ngOnInit(): void {
     const slideItems = [
      { src: '/HabashyBblood.jpg', title: 'Title 1' },
      { src: 'https://placeimg.com/600/600/nature', title: 'Title 2' },
      { src: 'https://placeimg.com/600/600/sepia', title: 'Title 3' },
      { src: 'https://placeimg.com/600/600/people', title: 'Title 4' },
      { src: 'https://placeimg.com/600/600/tech', title: 'Title 5' }
    ];

    this.slider.items = slideItems;
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

  // ── Open campaign creation modal ─────────────────────────
  openNewCampaign() {
    this.campaignService.openCampaign();
  }

  // ── Export a single campaign as CSV ──────────────────────
  exportCampaign(campaignId: string) {
    const campaign = this.campaigns().find((c) => c.id === campaignId);
    const campaignNum = campaign?.campaignNumber ?? campaignId;

    this.opsService.exportCampaignDonors(campaignId).subscribe({
      next: (response) => {
        const blob = response.body;
        if (!blob) return;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campaign_${campaignNum}_donors.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastr.success(`تم تصدير بيانات الحملة #${campaignNum}`);
      },
      error: () => this.toastr.error('فشل في تصدير بيانات الحملة'),
    });
  }

  // ── Delete a campaign ─────────────────────────────────────


  // ── Blood-type normaliser ─────────────────────────────────
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
      'O_POS': 'O_POS', 'O_NEG': 'O_NEG',
    };

    return map[clean] || null;
  }

  // ── Import: campaign CSV ──────────────────────────────────
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
        encoding: 'UTF-8',
        complete: (results) => {
          const cleanedData = results.data.map((row: any) => ({
            ...row,
            name: String(row.name || row['الاسم'] || '').replace(/[^\u0600-\u06FF\s]/g, '').trim(),
            nationalId: String(row.nationalId || row['الرقم القومي'] || '').trim(),
            bloodType: this.fixBloodType(row.bloodType || row['فصيلة الدم'] || ''),
            campaignNumber: Number(row.campaignNumber || row['رقم الحملة'] || 1),
          }));

          const csvString = Papa.unparse(cleanedData);
          const blob = new Blob([`\ufeff${csvString}`], { type: 'text/csv;charset=utf-8;' });
          const cleanedFile = new File([blob], file.name, { type: 'text/csv' });

          this.importService.importBloodBank(cleanedFile).subscribe({
            next: () => {
              this.importLoading.set(false);
              this.toastr.success('تم الاستيراد بنجاح');
              this.refreshDashboard();
            },
            error: () => {
              this.importLoading.set(false);
              this.toastr.error('فشل الاستيراد.. تأكد من تنسيق الملف');
            },
          });
        },
      });
    };
    reader.readAsText(file, 'utf-8');
  }

  // ── Import: legacy donors ─────────────────────────────────
  onLegacyFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.importLoading.set(true);
    this.importService.importLegacy(file).subscribe({
      next: () => {
        this.importLoading.set(false);
        this.toastr.success('تم استيراد البيانات القديمة بنجاح');
        this.refreshDashboard();
      },
      error: (err: any) => {
        this.importLoading.set(false);
        this.toastr.error(err?.error?.message || 'حدث خطأ أثناء استيراد البيانات القديمة');
      },
    });
  }

  // ── Computed ──────────────────────────────────────────────
  totalDonors = computed(() => this.donors().length);
  totalCampaigns = computed(() => this.campaigns().length);

  newDonors = computed(() =>
    this.donors().filter(
      (d) =>
        d.createdAt &&
        new Date(d.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    ).length
  );
  campaignId!: string;
  campaign = signal<any>(null);


// في ملف home.ts

exportCSV(id: string) {
   if (!id) {
    this.toastr.warning('لم يتم العثور على معرف الحملة');
    return;
  }

   const targetCampaign = this.campaigns().find(c => c.id === id);
  const campaignNum = targetCampaign?.campaignNumber || id;

  this.opsService.exportCampaignDonors(id).subscribe({
    next: (response) => {
      const blob = response.body;
      if (!blob) {
        this.toastr.error('الملف فارغ أو غير موجود');
        return;
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
       a.download = `campaign_${campaignNum}_donors.csv`;
      a.click();
      
      window.URL.revokeObjectURL(url);
      this.toastr.success(`تم تصدير بيانات الحملة #${campaignNum}`);
    },
    error: (err) => {
      console.error('Export Error:', err);
      this.toastr.error('خطأ 404: مسار التصدير غير موجود على السيرفر');
    }
  });
}

editCampaign(campaign: Campaign) {
  this.campaignService.openCampaign();
  // لو عندك modal في home نفسها محتاج تعمل logic هنا
  // بس بما إن الـ modal موجود في campaign component
  // الأسهل تروح لصفحة الحملات وتفتح الـ edit modal
  this.router.navigate(['/campaigns'], { 
    state: { editCampaign: campaign } 
  });
}

deleteCampaign(campaignId: string) {
  const campaign = this.campaigns().find(c => c.id === campaignId);
  const campaignNum = campaign?.campaignNumber ?? campaignId;

  Swal.fire({
    title: `هل تريد حذف الحملة #${campaignNum}؟`,
    text: 'لا يمكن التراجع بعد الحذف',
    imageUrl: '/HabashyBblood.jpg',
    imageWidth: 120,
    imageHeight: 120,
    imageAlt: 'Habashy Blood',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#9ca3af',
    confirmButtonText: 'حذف',
    cancelButtonText: 'إلغاء',
    background: '#fff',
  }).then(result => {
    if (!result.isConfirmed) return;

    this.campaignService.deleteCampaign(campaignId).subscribe({
      next: () => {
        this.toastr.success('تم حذف الحملة بنجاح');
        this.campaigns.update(list => list.filter(c => c.id !== campaignId));
      },
      error: (err: any) => this.toastr.error(err?.error?.message || 'فشل الحذف')
    });
  });
}
}
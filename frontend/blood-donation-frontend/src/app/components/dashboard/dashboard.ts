import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private campaignService = inject(CampaignService);
  private campaignOperationsService = inject(CampaignOperationsService);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  isBrowser = isPlatformBrowser(this.platformId);

  loading = signal(true);
  donors = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  campaignDonorsMap = signal<Record<string, any[]>>({});

  ngOnInit(): void {
    if (this.isBrowser) this.loadData();
  }

  loadData() {
    this.loading.set(true);

    this.campaignService.getAllDonors().subscribe((res: any) => {
      this.donors.set(res.data ?? []);
      this.updateCharts();
      this.checkLoadingDone();
    });

    this.campaignService.getAllCampaigns().subscribe((res: any) => {
      const campaigns = res.data ?? res ?? [];
      this.campaigns.set(campaigns);
      this.loadCampaignDonors(campaigns);
      this.checkLoadingDone();
    });
  }

  checkLoadingDone() {
    this.loading.set(false);
    this.cdr.detectChanges();
  }

  loadCampaignDonors(campaigns: any[]) {
    const map: Record<string, any[]> = {};

    if (!campaigns.length) return;

    let loadedCount = 0;

    campaigns.forEach((c) => {
      this.campaignOperationsService.getCampaignDonors(c.id).subscribe((res: any) => {
        map[c.id] = res.data ?? [];
        loadedCount++;

        if (loadedCount === campaigns.length) {
          this.campaignDonorsMap.set({ ...map });
          this.updateCharts();
          this.cdr.detectChanges();
        }
      });
    });
  }

  totalDonors = computed(() => this.donors().length);

  totalCampaigns = computed(() => this.campaigns().length);

  totalCampaignDonors = computed(() =>
    Object.values(this.campaignDonorsMap()).reduce((sum, arr) => sum + (arr?.length || 0), 0),
  );

  newDonors = computed(
    () =>
      this.donors().filter(
        (d) =>
          d.createdAt && new Date(d.createdAt) > new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      ).length,
  );

  bloodPieChartType: ChartType = 'pie';
  campaignBarChartType: ChartType = 'bar';
  growthLineChartType: ChartType = 'line';

  bloodPieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [] }],
  };

  campaignBarChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'عدد المتبرعين' }],
  };

  growthLineChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'المتبرعين الجدد' }],
  };

  updateCharts() {
    if (!this.isBrowser) return;

    const blood: Record<string, number> = {};

    this.donors().forEach((d) => {
      const type = d.bloodType || 'Unknown';
      blood[type] = (blood[type] || 0) + 1;
    });

    this.bloodPieChartData = {
      labels: Object.keys(blood),
      datasets: [
        {
          data: Object.values(blood),
          backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        },
      ],
    };

    const map = this.campaignDonorsMap();

    this.campaignBarChartData = {
      labels: this.campaigns().map((c) => `#${c.campaignNumber || c.id}`),
      datasets: [
        {
          data: this.campaigns().map((c) => map[c.id]?.length || 0),
          label: 'عدد المتبرعين',
          backgroundColor: '#ef4444',
        },
      ],
    };

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    this.growthLineChartData = {
      labels: last7Days.map((d) => d.toLocaleDateString('ar-EG')),
      datasets: [
        {
          data: last7Days.map(
            (date) =>
              this.donors().filter(
                (d) => d.createdAt && new Date(d.createdAt).toDateString() === date.toDateString(),
              ).length,
          ),
          label: 'المتبرعين الجدد',
          borderColor: '#8b5cf6',
          tension: 0.4,
        },
      ],
    };
  }
}

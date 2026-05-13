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
import { ChartConfiguration, ChartType, ChartOptions } from 'chart.js';
import { effect } from '@angular/core';
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

  // ─── Signals ────────────────────────────────────────────────────────────────
  loading = signal(true);
  donors = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  campaignDonorsMap = signal<Record<string, any[]>>({});
  ageGroupChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };
  // ─── Blood color map (used in template for inline styles) ───────────────────
  bloodColorMap: Record<string, string> = {
    A_POS: '#FF6384',
    A_NEG: '#FF9F40',
    B_POS: '#FFCD56',
    B_NEG: '#4BC0C0',
    O_POS: '#36A2EB',
    O_NEG: '#9966FF',
    AB_POS: '#C9CBCF',
    AB_NEG: '#059669',
    'A+': '#FF6384',
    'A-': '#FF9F40',
    'B+': '#FFCD56',
    'B-': '#4BC0C0',
    'O+': '#36A2EB',
    'O-': '#9966FF',
    'AB+': '#C9CBCF',
    'AB-': '#059669',
    'غير معروف': '#4b5563',
  };

  // ─── Blood type compatibility (static data) ─────────────────────────────────
  compatibilityData = [
    { type: 'O−', givesTo: 'الجميع' },
    { type: 'O+', givesTo: 'O+, A+, B+, AB+' },
    { type: 'A−', givesTo: 'A−, A+, AB−, AB+' },
    { type: 'A+', givesTo: 'A+, AB+' },
    { type: 'B−', givesTo: 'B−, B+, AB−, AB+' },
    { type: 'B+', givesTo: 'B+, AB+' },
    { type: 'AB−', givesTo: 'AB−, AB+' },
    { type: 'AB+', givesTo: 'AB+ فقط' },
  ];
  constructor() {

    effect(() => {
      const currentDonors = this.donors();

      if (currentDonors.length > 0) {
        console.log('✅ Effect Detected Data Change!', currentDonors);

        // استدعاء التحديث هنا يضمن أن الرسوم تتبع البيانات دائماً
        if (this.isBrowser) {
          this.updateCharts();
        }
      }
    });
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit fired');
    if (this.isBrowser) {
      console.log('✅ isBrowser = true');
      this.loadData();
    } else {
      console.log('❌ isBrowser = false — SSR context');
    }
  }

  loadData() {
    this.loading.set(true);

    this.campaignService.getAllDonors(1, 5000).subscribe((res: any) => {
      this.donors.set(res.data ?? []);
      console.log('Total donors:', res.data?.length);
      console.log('First donor full object:', res.data?.[0]);
      console.log('dateOfBirth field:', res.data?.[0]?.dateOfBirth);
      this.updateCharts();
    });

    this.campaignService.getAllCampaigns().subscribe((res: any) => {
      const campaignsData = res.data ?? res ?? [];
      this.campaigns.set(campaignsData);
      this.loadCampaignDonors(campaignsData);
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

  // ─── Computed Properties ─────────────────────────────────────────────────────

  totalDonors = computed(() => this.donors().length);
  totalCampaigns = computed(() => this.campaigns().length);

  totalCampaignDonors = computed(() =>
    Object.values(this.campaignDonorsMap()).reduce((sum, arr) => sum + (arr?.length || 0), 0),
  );

  newDonors = computed(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.donors().filter((d) => {
      if (!d.createdAt) return false;
      return new Date(d.createdAt) >= sevenDaysAgo;
    }).length;
  });

  rarestBloodType = computed(() => {
    const blood: Record<string, number> = {};
    this.donors().forEach((d) => {
      if (d.bloodType) blood[d.bloodType] = (blood[d.bloodType] || 0) + 1;
    });
    const entries = Object.entries(blood);
    if (!entries.length) return 'N/A';
    return entries.reduce((a, b) => (a[1] < b[1] ? a : b))[0];
  });

  rarestCount = computed(
    () => this.donors().filter((d) => d.bloodType === this.rarestBloodType()).length,
  );

  maleCount = computed(
    () =>
      this.donors().filter((d) => {
        const g = d.gender?.toString().trim();
        return g === 'ذكر' || g?.toUpperCase().startsWith('M') || g === '1';
      }).length,
  );

  femaleCount = computed(
    () =>
      this.donors().filter((d) => {
        const g = d.gender?.toString().trim();
        return g === 'أنثى' || g?.toUpperCase().startsWith('F') || g === '2';
      }).length,
  );

  malePercentage = computed(() => {
    const total = this.totalDonors();
    return total > 0 ? Math.round((this.maleCount() / total) * 100) : 0;
  });

  femalePercentage = computed(() => {
    const total = this.totalDonors();
    return total > 0 ? Math.round((this.femaleCount() / total) * 100) : 0;
  });

  donorGrowthRate = computed(() => {
    const total = this.donors().length;
    if (total < 2) return 0;
    return Math.round((this.newDonors() / total) * 100);
  });

  campaignParticipationRate = computed(() => {
    const total = this.totalDonors();
    return total === 0 ? 0 : Math.round((this.totalCampaignDonors() / total) * 100);
  });

  campaignSuccessRate = computed(() => {
    const count = this.campaigns().length;
    if (count === 0) return 0;
    const withDonors = this.campaigns().filter(
      (c) => (this.campaignDonorsMap()[c.id]?.length || 0) > 0,
    ).length;
    return Math.round((withDonors / count) * 100);
  });

  averageDonorsPerCampaign = computed(() => {
    const count = this.totalCampaigns();
    return count === 0 ? 0 : Math.round(this.totalCampaignDonors() / count);
  });

  mostCommonBloodType = computed(() => {
    const blood: Record<string, number> = {};
    this.donors().forEach((d) => {
      const type = d.bloodType || 'Unknown';
      blood[type] = (blood[type] || 0) + 1;
    });
    if (!Object.keys(blood).length) return 'N/A';
    return Object.keys(blood).reduce((a, b) => (blood[a] > blood[b] ? a : b));
  });

  bloodTypeStats = computed(() => {
    const blood: Record<string, number> = {};
    const bloodTypeEmojis: Record<string, string> = {
      'O+': '🔴',
      'O-': '🔴',
      'A+': '🟡',
      'A-': '🟡',
      'B+': '🟢',
      'B-': '🟢',
      'AB+': '🔵',
      'AB-': '🔵',
    };
    const total = this.totalDonors();
    this.donors().forEach((d) => {
      const type = d.bloodType || 'Unknown';
      blood[type] = (blood[type] || 0) + 1;
    });
    return Object.entries(blood)
      .map(([type, count]) => ({
        type,
        count,
        emoji: bloodTypeEmojis[type] || '❓',
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  });
  ageStats = computed(() => {
    const donors = this.donors() || [];
    const stats: Record<string, number> = {
      'ناشئ (تحت 20)': 0, 'شباب (20-30)': 0, 'كبار (31-45)': 0, 'مخضرم (فوق 45)': 0, 'غير محدد': 0
    };

    donors.forEach(d => {
      // لو الـ API مش بيبعت تاريخ ميلاد، هنعتبره غير محدد
      if (!d.dateOfBirth && !d.age) {
        stats['غير محدد']++;
      } else {
        const age = d.age ?? (new Date().getFullYear() - new Date(d.dateOfBirth).getFullYear());
        if (age < 20) stats['ناشئ (تحت 20)']++;
        else if (age <= 30) stats['شباب (20-30)']++;
        else if (age <= 45) stats['كبار (31-45)']++;
        else stats['مخضرم (فوق 45)']++;
      }
    });
    return stats;
  });
  // ─── Helper Methods ──────────────────────────────────────────────────────────

  getCampaignDonorCount(campaignId: string): number {
    return this.campaignDonorsMap()[campaignId]?.length || 0;
  }

  /** Returns width % for campaign progress bar relative to the top campaign */
  getCampaignWidthPercent(campaignId: string): number {
    const max = Math.max(
      ...this.campaigns().map((c) => this.campaignDonorsMap()[c.id]?.length || 0),
      1,
    );
    return Math.round((this.getCampaignDonorCount(campaignId) / max) * 100);
  }
  calculateAverageAge() {
    const donorsWithAge = this.donors().filter((d) => d.age !== null && d.age !== undefined);
    if (donorsWithAge.length === 0) return 0;
    const totalAge = donorsWithAge.reduce((sum, d) => sum + d.age, 0);
    return Math.round(totalAge / donorsWithAge.length);
  }
  // ─── Chart Types ─────────────────────────────────────────────────────────────
  bloodDoughnutChartType: ChartType = 'doughnut';
  genderPieChartType: ChartType = 'pie';
  campaignBarChartType: ChartType = 'bar';
  growthLineChartType: ChartType = 'line';
  radarChartType: ChartType = 'radar';

  // ─── Chart Options ───────────────────────────────────────────────────────────

  /** Shared tooltip style */
  private tooltipDefaults = {
    backgroundColor: 'rgba(15,23,42,0.85)',
    titleColor: '#f1f5f9',
    bodyColor: '#cbd5e1',
    padding: 10,
    cornerRadius: 8,
    titleFont: { size: 13 },
    bodyFont: { size: 12 },
  };

  bloodTypeChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false }, // ← custom HTML legend used instead
      tooltip: {
        ...this.tooltipDefaults,
        callbacks: {
          label: (ctx: any) => {
            const total = this.totalDonors();
            const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.raw} متبرع (${pct}%)`;
          },
        },
      },
    },
  };

  campaignChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...this.tooltipDefaults,
        callbacks: { label: (ctx: any) => ` ${ctx.raw} متبرع` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#9ca3af', font: { size: 11 } },
      },
    },
  };

  growthChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...this.tooltipDefaults,
        callbacks: { label: (ctx: any) => ` ${ctx.raw} متبرع جديد` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af', font: { size: 10 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.04)' },
        ticks: { color: '#9ca3af', font: { size: 10 } },
      },
    },
  };

  radarChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        grid: { color: 'rgba(0,0,0,0.06)' },
        ticks: { display: false },
        pointLabels: { color: '#6b7280', font: { size: 11 } },
      },
    },
  };

  // ─── Chart Data (initialised empty, filled by updateCharts) ─────────────────
  bloodDoughnutChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };
  campaignBarChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };
  growthLineChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };
  radarChartData: ChartConfiguration['data'] = { labels: [], datasets: [{ data: [] }] };

  // ─── updateCharts ────────────────────────────────────────────────────────────
  updateCharts(): void {
    if (!this.isBrowser) return;

    // 1. Blood type doughnut
    const bloodData = this.donors().reduce((acc: any, d: any) => {
      const type = d.bloodType || 'غير معروف';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const bloodLabels = Object.keys(bloodData);
    this.bloodDoughnutChartData = {
      labels: bloodLabels,
      datasets: [
        {
          data: Object.values(bloodData),
          backgroundColor: bloodLabels.map((l) => this.bloodColorMap[l] || '#94a3b8'),
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 12,
        },
      ],
    };

    // 2. Campaign bar — sorted descending, top bar highlighted
    const sortedCampaigns = [...this.campaigns()].sort(
      (a, b) => this.getCampaignDonorCount(b.id) - this.getCampaignDonorCount(a.id),
    );
    const campaignCounts = sortedCampaigns.map((c) => this.getCampaignDonorCount(c.id));
    this.campaignBarChartData = {
      labels: sortedCampaigns.map((c) => `#${c.campaignNumber || c.id}`),
      datasets: [
        {
          label: 'عدد المتبرعين',
          data: campaignCounts,
          // Top campaign solid red, others semi-transparent
          backgroundColor: campaignCounts.map((_, i) =>
            i === 0 ? '#dc2626' : 'rgba(220,38,38,0.35)',
          ),
          borderColor: campaignCounts.map((_, i) => (i === 0 ? '#b91c1c' : 'rgba(220,38,38,0.5)')),
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };

    // 3. Growth sparkline (last 7 days)
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    this.growthLineChartData = {
      labels: last7Days.map((d) => d.toLocaleDateString('ar-EG', { weekday: 'short' })),
      datasets: [
        {
          label: 'متبرعون جدد',
          data: last7Days.map(
            (date) =>
              this.donors().filter(
                (d: any) =>
                  d.createdAt && new Date(d.createdAt).toDateString() === date.toDateString(),
              ).length,
          ),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.08)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    };

    // 4. Radar
    const stats = this.bloodTypeStats();
    this.radarChartData = {
      labels: stats.slice(0, 6).map((s) => s.type),
      datasets: [
        {
          label: 'كثافة الفصائل',
          data: stats.slice(0, 6).map((s) => s.count),
          fill: true,
          backgroundColor: 'rgba(239,68,68,0.15)',
          borderColor: '#ef4444',
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
    const ageData = this.ageStats();
    this.ageGroupChartData = {
      labels: Object.keys(ageData),
      datasets: [
        {
          data: Object.values(ageData),
          backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#94a3b8'],
          hoverOffset: 10,
          borderWidth: 0,
        },
      ],
    };

    this.cdr.detectChanges();
  }
}

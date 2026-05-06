import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignService } from '../../services/campaignService';
import { CampaignOperationsService } from '../../services/campaign-operations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {

  private campaignService = inject(CampaignService);
  private campaignOperationsService = inject(CampaignOperationsService);

  // ================= RAW DATA =================
  donors = signal<any[]>([]);
  campaigns = signal<any[]>([]);
  campaignDonorsMap = signal<Record<string, any[]>>({});

  loading = signal(false);

  // ================= INIT =================
  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    // 1. Load donors
    this.campaignService.getAllDonors().subscribe(d => {
      this.donors.set(d);
    });

    // 2. Load campaigns
    this.campaignService.getAllCampaigns().subscribe(c => {
      this.campaigns.set(c);
      this.loadCampaignDonors(c);
    });
  }

  loadCampaignDonors(campaigns: any[]) {
  const map: Record<string, any[]> = {};

  campaigns.forEach(c => {
    this.campaignOperationsService.getCampaignDonors(c.id).subscribe(res => {
      map[c.id] = res; 
      this.campaignDonorsMap.set({ ...map });
    });
  });
}

  // ================= STATS =================

  totalDonors = computed(() => this.donors().length);

  totalCampaigns = computed(() => this.campaigns().length);

  totalCampaignDonors = computed(() => {
    return Object.values(this.campaignDonorsMap())
      .reduce((sum, arr) => sum + arr.length, 0);
  });

  // 🩸 Blood types distribution
  bloodTypes = computed(() => {
    const result: Record<string, number> = {};

    this.donors().forEach(d => {
      const type = d.bloodType || 'Unknown';
      result[type] = (result[type] || 0) + 1;
    });

    return result;
  });

  // 📈 New donors (last 7 days)
  newDonors = computed(() => {
    return this.donors().filter(d => {
      if (!d.createdAt) return false;
      return new Date(d.createdAt) >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }).length;
  });

  // 🏆 Top campaign
  topCampaign = computed(() => {
    const map = this.campaignDonorsMap();
    let max = 0;
    let top: any = null;

    this.campaigns().forEach(c => {
      const count = map[c.id]?.length || 0;
      if (count > max) {
        max = count;
        top = c;
      }
    });

    return { campaign: top, count: max };
  });

  // 🧍 Available donors (not in campaigns)
  availableDonors = computed(() => {
    const usedIds = new Set(
      Object.values(this.campaignDonorsMap())
        .flat()
        .map(d => d.id)
    );

    return this.donors().filter(d => !usedIds.has(d.id)).length;
  });
}
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
  campaignModal = signal(false);

  openCampaignModal() {
    this.campaignModal.set(true);
  }

  closeCampaignModal() {
    this.campaignModal.set(false);
  }
}
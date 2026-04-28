import { Component } from '@angular/core';

@Component({
  selector: 'app-campaign-details',
  imports: [],
  templateUrl: './campaign-details.html',
  styleUrl: './campaign-details.css',
})
export class CampaignDetails {
campaignId = 1;

allDonors = [
  { id: 1, name: "John", bloodType: "A+", phone: "010", address: "Cairo", church: "St Mary" },
  { id: 2, name: "Peter", bloodType: "O-", phone: "011", address: "Giza", church: "St Mark" },
];

campaignDonors = [
  { id: 3, name: "Mary" },
];

addToCampaign() {
  // selected users → move right to left
}

removeFromCampaign(d: any) {
  // move back to all donors
}

}

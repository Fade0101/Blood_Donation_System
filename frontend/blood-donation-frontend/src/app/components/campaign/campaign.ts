import { Component } from '@angular/core';

@Component({
  selector: 'app-campaign',
  imports: [],
  templateUrl: './campaign.html',
  styleUrl: './campaign.css',
})
export class Campaign {
  campaigns: number[] = Array.from({ length: 46 }, (_, i) => i + 1);

}
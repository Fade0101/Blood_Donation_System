import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../services/campaignService';
import { UiService } from '../../services/ui-service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

}

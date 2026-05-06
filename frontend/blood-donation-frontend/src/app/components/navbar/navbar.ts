import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { signal } from '@angular/core';
import { CampaignService } from '../../services/campaignService';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  mobileMenuOpen = signal(false);
  private campaignService = inject(CampaignService);

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(value => !value);
  }

  logout(): void {
    this.authService.logout();
    this.mobileMenuOpen.set(false);
    this.router.navigate(['/login']);
  }

  addCampaign(): void {
    this.router.navigate(['/campaigns']).then(() => {
      this.campaignService.openCampaign();
    });
  }
}



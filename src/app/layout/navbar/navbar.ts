import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { MerchantService } from '../../core/services/merchant.service';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly merchantService = inject(MerchantService);

  readonly merchantName = signal('');
  readonly merchantLoadError = signal(false);

  constructor() {
    this.merchantService.getCurrentMerchant().subscribe({
      next: (merchant) => this.merchantName.set(merchant.name),
      error: () => this.merchantLoadError.set(true),
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }
}

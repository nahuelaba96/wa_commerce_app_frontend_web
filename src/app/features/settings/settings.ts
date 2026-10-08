import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MerchantContextService } from '../../core/services/merchant-context.service';

@Component({
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule
  ],
  selector: 'app-settings',
  styleUrl: './settings.css',
  templateUrl: './settings.html',
})
export class Settings {
  private readonly formBuilder = inject(FormBuilder);
  private readonly merchantContext = inject(MerchantContextService);
  private readonly router = inject(Router);

  merchantForm = this.formBuilder.group({
    merchantId: [this.merchantContext.getMerchantId(), [Validators.required, Validators.min(1)]]
  });

  saveMerchant(): void {
    if (this.merchantForm.invalid) {
      this.merchantForm.markAllAsTouched();
      return;
    }

    this.merchantContext.setMerchantId(Number(this.merchantForm.value.merchantId));
    this.router.navigate(['/products']);
  }
}

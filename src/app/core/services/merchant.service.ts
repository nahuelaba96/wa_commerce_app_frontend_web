import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { MerchantContextService } from './merchant-context.service';

export interface MerchantResponse {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private readonly http = inject(HttpClient);
  private readonly merchantContext = inject(MerchantContextService);

  getCurrentMerchant(): Observable<MerchantResponse> {
    const merchantId = this.merchantContext.getMerchantId();
    return this.http.get<MerchantResponse>(`${apiConfig.baseUrl}/merchants/${merchantId}`);
  }
}

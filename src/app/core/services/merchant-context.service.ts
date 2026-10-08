import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MerchantContextService {
  private readonly storageKey = 'merchantId';
  private readonly defaultMerchantId = 1;

  getMerchantId(): number {
    const storedMerchantId = localStorage.getItem(this.storageKey);
    const merchantId = Number(storedMerchantId);

    return Number.isInteger(merchantId) && merchantId > 0
      ? merchantId
      : this.defaultMerchantId;
  }

  setMerchantId(merchantId: number): void {
    localStorage.setItem(this.storageKey, String(merchantId));
  }

  clearMerchantId(): void {
    localStorage.removeItem(this.storageKey);
  }
}
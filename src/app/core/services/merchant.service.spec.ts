import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiConfig } from '../config/api.config';
import { MerchantContextService } from './merchant-context.service';
import { MerchantService } from './merchant.service';

describe('MerchantService', () => {
  let service: MerchantService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: MerchantContextService,
          useValue: { getMerchantId: () => 42 },
        },
      ],
    });
    service = TestBed.inject(MerchantService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('loads the current merchant details', () => {
    const merchant = { id: 42, name: 'Mi comercio' };

    service.getCurrentMerchant().subscribe((result) => {
      expect(result).toEqual(merchant);
    });

    const request = httpTestingController.expectOne(`${apiConfig.baseUrl}/merchants/42`);
    expect(request.request.method).toBe('GET');
    request.flush(merchant);
    httpTestingController.verify();
  });
});

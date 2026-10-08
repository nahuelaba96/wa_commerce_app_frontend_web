import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiConfig } from '../config/api.config';
import { MerchantContextService } from './merchant-context.service';
import { ProductService } from './ProductService';

describe('ProductService', () => {
  let service: ProductService;
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
    service = TestBed.inject(ProductService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('creates a category for the current merchant', () => {
    const response = { id: 5, name: 'Accesorios', merchantId: 42 };

    service.createCategory('Accesorios').subscribe((category) => {
      expect(category).toEqual(response);
    });

    const request = httpTestingController.expectOne(`${apiConfig.baseUrl}/categories`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Accesorios', merchantId: 42 });
    request.flush(response);
    httpTestingController.verify();
  });

  it('loads the requested product from the current merchant catalog', () => {
    const response = [
      {
        id: 9,
        name: 'Camisa',
        description: 'Algodón',
        brand: 'Marca',
        merchantId: 42,
        category: { id: 4, name: 'Ropa' },
        variants: [
          {
            id: 12,
            sku: 'CAM-M',
            size: 'M',
            color: 'Rojo',
            price: 1250,
            stock: 5,
          },
        ],
      },
    ];

    service.getProduct(9).subscribe((product) => {
      expect(product.id).toBe(9);
      expect(product.category.id).toBe(4);
      expect(product.variants[0].id).toBe(12);
      expect(product.variants[0].productId).toBe(9);
    });

    const request = httpTestingController.expectOne(`${apiConfig.baseUrl}/products?merchantId=42`);
    expect(request.request.method).toBe('GET');
    request.flush(response);
    httpTestingController.verify();
  });

  it('updates products and variants using the merchant-scoped endpoints', () => {
    service
      .updateProduct(9, {
        name: 'Camisa',
        description: 'Algodón',
        brand: 'Marca',
        categoryId: 4,
      })
      .subscribe();
    service
      .updateProductVariant(12, {
        sku: 'CAM-M',
        size: 'M',
        color: 'Rojo',
        price: 1250,
        stock: 5,
      })
      .subscribe();
    service.deleteProductVariant(13).subscribe();

    const productRequest = httpTestingController.expectOne(
      `${apiConfig.baseUrl}/products?merchantId=42&id=9`,
    );
    expect(productRequest.request.method).toBe('PUT');
    expect(productRequest.request.body).toEqual({
      name: 'Camisa',
      description: 'Algodón',
      brand: 'Marca',
      categoryId: 4,
    });
    productRequest.flush({});

    const variantUpdateRequest = httpTestingController.expectOne(
      `${apiConfig.baseUrl}/product-variants?merchantId=42&id=12`,
    );
    expect(variantUpdateRequest.request.method).toBe('PUT');
    variantUpdateRequest.flush({});

    const variantDeleteRequest = httpTestingController.expectOne(
      `${apiConfig.baseUrl}/product-variants?merchantId=42&id=13`,
    );
    expect(variantDeleteRequest.request.method).toBe('DELETE');
    variantDeleteRequest.flush(null);

    httpTestingController.verify();
  });

  it('creates a variant with its product and current merchant IDs', () => {
    service
      .createProductVariant(9, {
        sku: 'CAM-L',
        size: 'L',
        color: 'Azul',
        price: 1400,
        stock: 3,
      })
      .subscribe();

    const request = httpTestingController.expectOne(`${apiConfig.baseUrl}/product-variants`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      sku: 'CAM-L',
      size: 'L',
      color: 'Azul',
      price: 1400,
      stock: 3,
      productId: 9,
      merchantId: 42,
    });
    request.flush({});
    httpTestingController.verify();
  });
});

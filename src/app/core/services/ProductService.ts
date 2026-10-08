import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, mergeMap, Observable, of, throwError } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { MerchantContextService } from './merchant-context.service';
import {
  Category,
  CategoryResponse,
  CreateCategoryRequest,
  Product,
  ProductResponse,
  ProductVariant,
} from '../models/ProductModel';

export interface CreateProductData {
  name: string;
  description: string;
  brand: string | null;
  categoryId: number | null;
  variants: Omit<ProductVariant, 'id' | 'productId'>[];
}

export interface UpdateProductData {
  name: string;
  description: string;
  brand: string | null;
  categoryId: number;
}

export interface SaveProductVariantData {
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly merchantContext = inject(MerchantContextService);
  private readonly productsUrl = `${apiConfig.baseUrl}/products`;
  private readonly variantsUrl = `${apiConfig.baseUrl}/product-variants`;
  private readonly categoriesUrl = `${apiConfig.baseUrl}/categories`;

  getProducts(): Observable<Product[]> {
    const params = this.merchantParams();

    return this.http.get<ProductResponse[]>(this.productsUrl, { params }).pipe(
      map((products) =>
        products.map((product) => ({
          ...product,
          category: {
            ...product.category,
            merchantId: product.merchantId,
          },
          variants: product.variants.map((variant) => ({
            ...variant,
            productId: product.id,
          })),
        })),
      ),
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.getProducts().pipe(
      mergeMap((products) => {
        const product = products.find((item) => item.id === id);
        return product
          ? of(product)
          : throwError(() => new Error(`No se encontró el producto con ID ${id}.`));
      }),
    );
  }

  getCategories(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.categoriesUrl, {
      params: this.merchantParams(),
    });
  }

  createCategory(name: string): Observable<CategoryResponse> {
    const request: CreateCategoryRequest = {
      name,
      merchantId: this.merchantContext.getMerchantId(),
    };
    return this.http.post<CategoryResponse>(this.categoriesUrl, request);
  }

  createProduct(product: CreateProductData): Observable<Product> {
    return this.http.post<Product>(this.productsUrl, {
      ...product,
      merchantId: this.merchantContext.getMerchantId(),
    });
  }

  updateProduct(id: number, product: UpdateProductData): Observable<ProductResponse> {
    const params = this.merchantParams().set('id', id);
    return this.http.put<ProductResponse>(this.productsUrl, product, { params });
  }

  createProductVariant(productId: number, variant: SaveProductVariantData): Observable<unknown> {
    return this.http.post(this.variantsUrl, {
      ...variant,
      productId,
      merchantId: this.merchantContext.getMerchantId(),
    });
  }

  updateProductVariant(id: number, variant: SaveProductVariantData): Observable<unknown> {
    const params = this.merchantParams().set('id', id);
    return this.http.put(this.variantsUrl, variant, { params });
  }

  deleteProductVariant(id: number): Observable<void> {
    const params = this.merchantParams().set('id', id);
    return this.http.delete<void>(this.variantsUrl, { params });
  }

  private merchantParams(): HttpParams {
    return new HttpParams().set('merchantId', this.merchantContext.getMerchantId());
  }
}

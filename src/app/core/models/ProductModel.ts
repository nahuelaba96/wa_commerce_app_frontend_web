export interface ProductVariant {
  id: number;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
  productId?: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  brand: string | null;
  merchantId: number;
  category: Category;
  variants: ProductVariant[];
}

export interface Category {
  id: number;
  name: string;
  merchantId: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  brand: string | null;
  merchantId: number;
  category: CategoryResponse;
  variants: ProductVariantResponse[];
}

export interface ProductVariantResponse {
  id: number;
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
}

export interface CategoryResponse {
  id: number;
  name: string;
  merchantId?: number;
}

export interface CreateCategoryRequest {
  name: string;
  merchantId: number;
}

export interface CreateProductData {
  name: string;
  description: string;
  brand: string | null;
  categoryId: number;
  variants: CreateProductVariantData[];
}

export interface CreateProductVariantData {
  sku?: string;
  size?: string;
  color?: string;
  price: number;
  stock?: number;
}

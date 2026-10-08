import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of, switchMap } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryResponse, ProductVariant } from '../../../core/models/ProductModel';
import {
  CreateProductData,
  ProductService,
  SaveProductVariantData,
  UpdateProductData,
} from '../../../core/services/ProductService';
import { CreateCategoryDialog } from './create-category-dialog';

@Component({
  selector: 'app-new-product',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDialogModule,
  ],
  templateUrl: './new-product.html',
  styleUrl: './new-product.scss',
})
export class NewProduct {
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);

  categories: CategoryResponse[] = [];
  categoryError = '';
  productError = '';
  saving = false;
  readonly createCategoryOption = '__create_category__';
  private readonly routeProductId = this.route.snapshot.paramMap.get('id');
  readonly productId = this.parseProductId(this.routeProductId);
  readonly isEditMode = this.routeProductId !== null;
  private previousCategoryId: string | null = null;
  private originalVariantIds = new Set<number>();

  productForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(2)]],

    category: ['', [Validators.required]],

    brand: [''],

    description: [''],

    variants: this.formBuilder.array([this.createVariantForm()]),
  });

  constructor() {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.categoryError = 'No se pudieron cargar las categorías. Inténtalo de nuevo.';
      },
    });
    if (this.isEditMode && this.productId === null) {
      this.productError = 'El identificador del producto no es válido.';
    } else if (this.productId !== null) {
      this.loadProduct(this.productId);
    }
  }

  onCategorySelectionChange(categoryId: string): void {
    this.categoryError = '';
    if (categoryId !== this.createCategoryOption) {
      this.previousCategoryId = categoryId;
      return;
    }

    this.productForm.controls.category.setValue(this.previousCategoryId ?? '');
    this.openCreateCategoryDialog();
  }

  private openCreateCategoryDialog(): void {
    this.dialog
      .open(CreateCategoryDialog, { width: 'min(420px, calc(100vw - 32px))' })
      .afterClosed()
      .subscribe((name) => {
        if (!name) {
          return;
        }

        this.productService.createCategory(name).subscribe({
          next: (category) => {
            this.categories = [...this.categories, category];
            const categoryId = category.id.toString();
            this.previousCategoryId = categoryId;
            this.productForm.controls.category.setValue(categoryId);
          },
          error: () => {
            this.categoryError = 'No se pudo crear la categoría. Inténtalo de nuevo.';
          },
        });
      });
  }

  get variants() {
    return this.productForm.controls.variants;
  }

  createVariantForm(variant?: ProductVariant) {
    return this.formBuilder.group({
      id: [variant?.id ?? null],
      sku: [variant?.sku ?? '', Validators.required],
      size: [variant?.size ?? ''],
      color: [variant?.color ?? ''],
      price: [variant?.price ?? 0, [Validators.required, Validators.min(0)]],
      stock: [variant?.stock ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  addVariant(): void {
    this.variants.push(this.createVariantForm());
  }

  removeVariant(index: number): void {
    this.variants.removeAt(index);
  }

  saveProduct(): void {
    this.productError = '';
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.getRawValue();
    if (this.isEditMode && this.productId === null) {
      this.productError = 'El identificador del producto no es válido.';
      return;
    }
    const productFields = {
      name: formValue.name ?? '',
      description: formValue.description ?? '',
      brand: formValue.brand?.trim() || null,
      categoryId: Number(formValue.category),
    };

    if (this.productId !== null) {
      this.updateExistingProduct(this.productId, productFields, formValue.variants);
      return;
    }

    const product: CreateProductData = {
      ...productFields,
      variants: formValue.variants.map((variant) => this.toVariantData(variant)),
    };
    this.saving = true;
    this.productService.createProduct(product).subscribe(
      () => {
        this.saving = false;
        void this.router.navigate(['/products']);
      },
      () => {
        this.saving = false;
        this.productError = 'No se pudo crear el producto. Inténtalo de nuevo.';
      },
    );
  }

  private updateExistingProduct(
    productId: number,
    product: UpdateProductData,
    variants: ReturnType<typeof this.productForm.getRawValue>['variants'],
  ): void {
    const currentVariantIds = new Set(
      variants.flatMap((variant) => (variant.id === null ? [] : [variant.id])),
    );
    const variantOperations = variants.map((variant) => {
      const data = this.toVariantData(variant);
      return variant.id === null
        ? this.productService.createProductVariant(productId, data)
        : this.productService.updateProductVariant(variant.id, data);
    });
    for (const variantId of this.originalVariantIds) {
      if (!currentVariantIds.has(variantId)) {
        variantOperations.push(this.productService.deleteProductVariant(variantId));
      }
    }

    this.saving = true;
    this.productService
      .updateProduct(productId, product)
      .pipe(switchMap(() => (variantOperations.length ? forkJoin(variantOperations) : of([]))))
      .subscribe({
        next: () => {
          this.saving = false;
          void this.router.navigate(['/products']);
        },
        error: () => {
          this.saving = false;
          this.productError = 'No se pudieron guardar los cambios. Inténtalo de nuevo.';
        },
      });
  }

  private toVariantData(variant: {
    sku: string | null;
    size: string | null;
    color: string | null;
    price: number | null;
    stock: number | null;
  }): SaveProductVariantData {
    return {
      sku: variant.sku ?? '',
      size: variant.size ?? '',
      color: variant.color ?? '',
      price: Number(variant.price ?? 0),
      stock: Number(variant.stock ?? 0),
    };
  }

  private loadProduct(productId: number): void {
    this.productService.getProduct(productId).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          category: product.category.id.toString(),
          brand: product.brand,
          description: product.description ?? '',
        });
        this.previousCategoryId = product.category.id.toString();
        this.originalVariantIds = new Set(product.variants.map((variant) => variant.id));
        this.variants.clear();
        for (const variant of product.variants) {
          this.variants.push(this.createVariantForm(variant));
        }
      },
      error: () => {
        this.productError = 'No se pudo cargar el producto. Inténtalo de nuevo.';
      },
    });
  }

  private parseProductId(value: string | null): number | null {
    if (value === null) {
      return null;
    }
    const productId = Number(value);
    return Number.isInteger(productId) && productId > 0 ? productId : null;
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}

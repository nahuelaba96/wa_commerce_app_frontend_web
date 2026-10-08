import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { DecimalPipe } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, CategoryResponse } from '../../core/models/ProductModel';
import { ProductService } from '../../core/services/ProductService';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-confirm-delete-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Eliminar producto</h2>
    <mat-dialog-content>
      ¿Querés eliminar el producto <strong>{{ data.productName }}</strong
      >?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close(false)">Cancelar</button>
      <button mat-flat-button color="warn" (click)="dialogRef.close(true)">Eliminar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDeleteDialog {
  readonly dialogRef = inject(MatDialogRef<ConfirmDeleteDialog>);
  readonly data = inject(MAT_DIALOG_DATA) as { productName: string };
}

@Component({
  selector: 'app-products',
  imports: [
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class Products {
  private productService = inject(ProductService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: CategoryResponse[] = [];

  dataSource = new MatTableDataSource<Product>([]);
  expandedElement: Product | null = null;

  get displayedColumns(): string[] {
    if (!this.products.length) {
      return ['name', 'brand', 'category', 'stock', 'actions'];
    }

    const fields: Array<[string, (product: Product) => unknown]> = [
      ['name', (product) => product.name],
      ['brand', (product) => product.brand],
      ['category', (product) => product.category?.name],
      ['stock', (product) => product.variants?.some((variant) => this.hasValue(variant.stock))],
    ];
    return [
      ...fields
        .filter(([, getValue]) =>
          this.products.some((product) => {
            const value = getValue(product);
            return typeof value === 'boolean' ? value : this.hasValue(value);
          }),
        )
        .map(([column]) => column),
      'actions',
    ];
  }

  get columnsToDisplayWithExpand(): string[] {
    return [...this.displayedColumns, 'expand'];
  }

  getVariantDisplayedColumns(product: Product): string[] {
    if (!product.variants.length) {
      return ['sku', 'size', 'color', 'price', 'stock'];
    }

    const fields: Array<[string, (variant: Product['variants'][number]) => unknown]> = [
      ['sku', (variant) => variant.sku],
      ['size', (variant) => variant.size],
      ['color', (variant) => variant.color],
      ['price', (variant) => variant.price],
      ['stock', (variant) => variant.stock],
    ];
    return fields
      .filter(([, getValue]) =>
        product.variants.some((variant) => this.hasValue(getValue(variant))),
      )
      .map(([column]) => column);
  }

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.productService.getProducts().subscribe((products) => {
      this.products = products;
      this.dataSource.data = products;
      this.cdr.detectChanges();
    });
  }

  /** Checks whether an element is expanded. */
  isExpanded(element: Product) {
    return this.expandedElement === element;
  }

  /** Toggles the expanded state of an element. */
  toggle(element: Product) {
    this.expandedElement = this.isExpanded(element) ? null : element;
  }

  deleteProduct(product: Product, event: MouseEvent): void {
    event.stopPropagation();

    this.dialog
      .open(ConfirmDeleteDialog, {
        data: { productName: product.name },
        width: 'min(420px, calc(100vw - 32px))',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.products = this.products.filter((item) => item.id !== product.id);
        this.dataSource.data = this.products;
        this.cdr.detectChanges();
        this.expandedElement = null;
      });
  }

  getTotalStock(product: Product): number {
    return product.variants?.reduce((total, variant) => total + (variant.stock ?? 0), 0) ?? 0;
  }

  private hasValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    return true;
  }
}

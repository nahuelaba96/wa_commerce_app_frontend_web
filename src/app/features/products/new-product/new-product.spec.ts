import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryResponse, Product } from '../../../core/models/ProductModel';
import { ProductService } from '../../../core/services/ProductService';
import { NewProduct } from './new-product';
import { CreateCategoryDialog } from './create-category-dialog';

describe('NewProduct', () => {
  let component: NewProduct;
  let fixture: ComponentFixture<NewProduct>;
  let productServiceMock: {
    getCategories: ReturnType<typeof vi.fn>;
    getProduct: ReturnType<typeof vi.fn>;
    createCategory: ReturnType<typeof vi.fn>;
    createProduct: ReturnType<typeof vi.fn>;
    updateProduct: ReturnType<typeof vi.fn>;
    updateProductVariant: ReturnType<typeof vi.fn>;
    createProductVariant: ReturnType<typeof vi.fn>;
    deleteProductVariant: ReturnType<typeof vi.fn>;
  };
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let routeId: string | null;

  beforeEach(async () => {
    routeId = null;
    productServiceMock = {
      getCategories: vi.fn().mockReturnValue(of([])),
      getProduct: vi.fn(),
      createCategory: vi.fn(),
      createProduct: vi.fn().mockReturnValue(of({})),
      updateProduct: vi.fn(),
      updateProductVariant: vi.fn(),
      createProductVariant: vi.fn(),
      deleteProductVariant: vi.fn(),
    };
    dialogMock = {
      open: vi.fn().mockReturnValue({ afterClosed: () => of('Accesorios') }),
    };
    await TestBed.configureTestingModule({
      imports: [NewProduct],
      providers: [
        {
          provide: Router,
          useValue: { navigate: vi.fn().mockResolvedValue(true) },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => routeId } } },
        },
        {
          provide: ProductService,
          useValue: productServiceMock,
        },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialogMock })
      .compileComponents();

    fixture = TestBed.createComponent(NewProduct);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates and selects a category from the selector', () => {
    const category: CategoryResponse = { id: 7, name: 'Accesorios', merchantId: 1 };
    productServiceMock.createCategory.mockReturnValue(of(category));

    component.onCategorySelectionChange(component.createCategoryOption);

    expect(dialogMock.open).toHaveBeenCalledWith(CreateCategoryDialog, {
      width: 'min(420px, calc(100vw - 32px))',
    });
    expect(productServiceMock.createCategory).toHaveBeenCalledWith('Accesorios');
    expect(component.categories).toContain(category);
    expect(component.productForm.controls.category.value).toBe('7');
  });

  it('keeps the previous selection if category creation fails', () => {
    component.categories = [{ id: 2, name: 'Bebidas' }];
    component.productForm.controls.category.setValue('2');
    component.onCategorySelectionChange('2');
    productServiceMock.createCategory.mockReturnValue(
      throwError(() => new Error('request failed')),
    );

    component.onCategorySelectionChange(component.createCategoryOption);

    expect(component.productForm.controls.category.value).toBe('2');
    expect(component.categories).toEqual([{ id: 2, name: 'Bebidas' }]);
    expect(component.categoryError).toContain('No se pudo crear');
  });

  it('does not create a category when the dialog is cancelled', () => {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(undefined) });

    component.onCategorySelectionChange(component.createCategoryOption);

    expect(productServiceMock.createCategory).not.toHaveBeenCalled();
  });

  it('loads the selected product and fills all fields and variants', () => {
    routeId = '9';
    const product: Product = {
      id: 9,
      name: 'Camisa',
      description: 'Camisa de algodón',
      brand: 'Marca',
      merchantId: 1,
      category: { id: 4, name: 'Ropa', merchantId: 1 },
      variants: [
        {
          id: 12,
          sku: 'CAM-ROJ-M',
          size: 'M',
          color: 'Rojo',
          price: 1250,
          stock: 5,
          productId: 9,
        },
      ],
    };
    productServiceMock.getProduct.mockReturnValue(of(product));

    fixture = TestBed.createComponent(NewProduct);
    component = fixture.componentInstance;

    expect(component.isEditMode).toBe(true);
    expect(productServiceMock.getProduct).toHaveBeenCalledWith(9);
    expect(component.productForm.getRawValue()).toEqual({
      name: 'Camisa',
      category: '4',
      brand: 'Marca',
      description: 'Camisa de algodón',
      variants: [{ id: 12, sku: 'CAM-ROJ-M', size: 'M', color: 'Rojo', price: 1250, stock: 5 }],
    });
  });

  it('updates product fields and existing variants when saving in edit mode', () => {
    routeId = '9';
    const product: Product = {
      id: 9,
      name: 'Camisa',
      description: 'Camisa de algodón',
      brand: 'Marca',
      merchantId: 1,
      category: { id: 4, name: 'Ropa', merchantId: 1 },
      variants: [{ id: 12, sku: 'CAM-ROJ-M', size: 'M', color: 'Rojo', price: 1250, stock: 5 }],
    };
    productServiceMock.getProduct.mockReturnValue(of(product));
    productServiceMock.updateProduct.mockReturnValue(of(product));
    productServiceMock.updateProductVariant.mockReturnValue(of({}));
    fixture = TestBed.createComponent(NewProduct);
    component = fixture.componentInstance;
    component.productForm.patchValue({ name: 'Camisa clásica', brand: '   ' });
    component.saveProduct();

    expect(productServiceMock.updateProduct).toHaveBeenCalledWith(9, {
      name: 'Camisa clásica',
      description: 'Camisa de algodón',
      brand: null,
      categoryId: 4,
    });
    expect(productServiceMock.updateProductVariant).toHaveBeenCalledWith(12, {
      sku: 'CAM-ROJ-M',
      size: 'M',
      color: 'Rojo',
      price: 1250,
      stock: 5,
    });
    expect(productServiceMock.createProductVariant).not.toHaveBeenCalled();
  });

  it('sends a null brand when creating a product with an empty brand', () => {
    component.productForm.patchValue({
      name: 'Producto',
      category: '4',
      brand: '   ',
    });
    component.variants.at(0).patchValue({ sku: 'PROD-1' });

    component.saveProduct();

    expect(component.productForm.controls.brand.valid).toBe(true);
    expect(productServiceMock.createProduct).toHaveBeenCalledWith({
      name: 'Producto',
      description: '',
      brand: null,
      categoryId: 4,
      variants: [{ sku: 'PROD-1', size: '', color: '', price: 0, stock: 0 }],
    });
  });

  it('creates new variants and deletes removed variants when saving edits', () => {
    routeId = '9';
    const product: Product = {
      id: 9,
      name: 'Camisa',
      description: '',
      brand: 'Marca',
      merchantId: 1,
      category: { id: 4, name: 'Ropa', merchantId: 1 },
      variants: [{ id: 12, sku: 'CAM-M', price: 1250, stock: 5 }],
    };
    productServiceMock.getProduct.mockReturnValue(of(product));
    productServiceMock.updateProduct.mockReturnValue(of(product));
    productServiceMock.createProductVariant.mockReturnValue(of({}));
    productServiceMock.deleteProductVariant.mockReturnValue(of(undefined));
    fixture = TestBed.createComponent(NewProduct);
    component = fixture.componentInstance;
    component.removeVariant(0);
    component.addVariant();
    component.variants.at(0).patchValue({
      sku: 'CAM-L',
      size: 'L',
      color: 'Azul',
      price: 1400,
      stock: 3,
    });

    component.saveProduct();

    expect(productServiceMock.createProductVariant).toHaveBeenCalledWith(9, {
      sku: 'CAM-L',
      size: 'L',
      color: 'Azul',
      price: 1400,
      stock: 3,
    });
    expect(productServiceMock.deleteProductVariant).toHaveBeenCalledWith(12);
  });
});

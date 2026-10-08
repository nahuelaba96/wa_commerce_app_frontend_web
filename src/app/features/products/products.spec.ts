import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { Product } from '../../core/models/ProductModel';
import { ProductService } from '../../core/services/ProductService';
import { Products } from './products';

describe('Products', () => {
  let component: Products;
  let fixture: ComponentFixture<Products>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Products],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: { getProducts: () => EMPTY },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Products);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides product columns when every listed product is missing that field', () => {
    component.products = [
      {
        id: 1,
        name: 'Pizza',
        description: '',
        brand: null,
        merchantId: 1,
        category: { id: 1, name: 'Comida', merchantId: 1 },
        variants: [{ id: 1, price: 0, stock: 0 }],
      },
      {
        id: 2,
        name: 'Empanada',
        description: '',
        brand: '   ',
        merchantId: 1,
        category: { id: 1, name: 'Comida', merchantId: 1 },
        variants: [{ id: 2, price: 0, stock: 0 }],
      },
    ];
    component.dataSource.data = component.products;

    expect(component.displayedColumns).toEqual(['name', 'category', 'stock', 'actions']);
    expect(component.columnsToDisplayWithExpand).toContain('expand');
  });

  it('keeps a product column when at least one product has its value', () => {
    component.products = [
      {
        id: 1,
        name: 'Pizza',
        description: '',
        brand: null,
        merchantId: 1,
        category: { id: 1, name: 'Comida', merchantId: 1 },
        variants: [],
      },
      {
        id: 2,
        name: 'Empanada',
        description: '',
        brand: 'La marca',
        merchantId: 1,
        category: { id: 1, name: 'Comida', merchantId: 1 },
        variants: [],
      },
    ];

    expect(component.displayedColumns).toContain('brand');
  });

  it('hides optional variant columns missing from every variant but retains numeric zeroes', () => {
    const product: Product = {
      id: 1,
      name: 'Pizza',
      description: '',
      brand: null,
      merchantId: 1,
      category: { id: 1, name: 'Comida', merchantId: 1 },
      variants: [
        { id: 1, sku: 'PIZZA-1', size: '', color: '  ', price: 0, stock: 0 },
        { id: 2, sku: 'PIZZA-2', price: 0, stock: 0 },
      ],
    };

    expect(component.getVariantDisplayedColumns(product)).toEqual(['sku', 'price', 'stock']);
  });

  it('hides the product stock column when no variant has a stock value', () => {
    component.products = [
      {
        id: 1,
        name: 'Producto',
        description: '',
        brand: null,
        merchantId: 1,
        category: { id: 1, name: 'General', merchantId: 1 },
        variants: [{ id: 1, price: 10 }],
      },
    ];

    expect(component.displayedColumns).not.toContain('stock');
  });

  it('renders only columns with values in the product and expanded variant tables', () => {
    const product: Product = {
      id: 1,
      name: 'Pizza',
      description: '',
      brand: null,
      merchantId: 1,
      category: { id: 1, name: 'Comida', merchantId: 1 },
      variants: [{ id: 1, sku: 'PIZZA-1', price: 0, stock: 0 }],
    };
    component.products = [product];
    component.dataSource.data = [product];
    component.expandedElement = product;

    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const productHeaders = Array.from(
      host.querySelectorAll<HTMLElement>('table:not(.variants-table) > thead th'),
    ).map((header) => header.textContent?.trim());
    const variantHeaders = Array.from(host.querySelectorAll<HTMLElement>('.variants-table th')).map(
      (header) => header.textContent?.trim(),
    );

    expect(productHeaders).toEqual(['Producto', 'Categoria', 'Stock', 'Acciones', '']);
    expect(variantHeaders).toEqual(['SKU', 'Precio', 'Stock']);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { MerchantService } from '../../core/services/merchant.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let merchantServiceMock: { getCurrentMerchant: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    merchantServiceMock = {
      getCurrentMerchant: vi.fn().mockReturnValue(of({ id: 1, name: 'Mi tienda' })),
    };
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: MerchantService, useValue: merchantServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the current merchant name', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mi tienda');
    expect(merchantServiceMock.getCurrentMerchant).toHaveBeenCalled();
  });

  it('shows an error message when the merchant name cannot be loaded', () => {
    merchantServiceMock.getCurrentMerchant.mockReturnValue(
      throwError(() => new Error('request failed')),
    );
    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudo cargar el nombre del comercio');
  });
});

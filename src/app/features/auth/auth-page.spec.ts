import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { AuthPage } from './auth-page';

describe('AuthPage', () => {
  let authServiceMock: { register: ReturnType<typeof vi.fn>; login: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = { register: vi.fn(), login: vi.fn() };
    TestBed.configureTestingModule({
      imports: [AuthPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  function setRegistrationRoute(returnUrl: string | null = null): void {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          data: { mode: 'register' },
          queryParamMap: { get: () => returnUrl },
        },
      },
    });
  }

  function fillRegistrationForm(
    fixture: ReturnType<typeof TestBed.createComponent<AuthPage>>,
  ): void {
    fixture.componentInstance.form.patchValue({
      personalName: 'Ana García',
      merchantName: 'Tienda de Ana',
      email: 'ana@example.com',
      password: 'Password!',
    });
  }

  it('renders login and rejects incomplete credentials', () => {
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Inicia sesión');
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('renders registration fields and allows revealing the password', () => {
    setRegistrationRoute();
    const fixture = TestBed.createComponent(AuthPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Crea tu cuenta');
    expect(fixture.nativeElement.querySelector('#personalName')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#merchantName')).not.toBeNull();
    expect(fixture.componentInstance.form.controls.personalName.invalid).toBe(true);

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#password').type).toBe('text');
  });

  it('logs in and navigates after a completed registration', () => {
    setRegistrationRoute('/settings');
    authServiceMock.register.mockReturnValue(
      of({ registrationId: 'registration-1', status: 'COMPLETE' }),
    );
    authServiceMock.login.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(AuthPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fillRegistrationForm(fixture);

    fixture.componentInstance.submit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'Password!',
      personalName: 'Ana García',
      merchantName: 'Tienda de Ana',
    });
    expect(authServiceMock.login).toHaveBeenCalledWith('ana@example.com', 'Password!');
    expect(navigateSpy).toHaveBeenCalledWith('/settings');
    expect(fixture.componentInstance.noticeMessage()).toBe('');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('navigates to the dashboard after login when there is no return URL', () => {
    setRegistrationRoute();
    authServiceMock.register.mockReturnValue(
      of({ registrationId: 'registration-1', status: 'COMPLETE' }),
    );
    authServiceMock.login.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(AuthPage);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fillRegistrationForm(fixture);

    fixture.componentInstance.submit();

    expect(navigateSpy).toHaveBeenCalledWith('/dashboard');
  });

  it('does not log in while registration is pending', () => {
    setRegistrationRoute();
    authServiceMock.register.mockReturnValue(
      of({ registrationId: 'registration-1', status: 'PENDING' }),
    );
    const fixture = TestBed.createComponent(AuthPage);
    fillRegistrationForm(fixture);

    fixture.componentInstance.submit();

    expect(authServiceMock.login).not.toHaveBeenCalled();
    expect(fixture.componentInstance.noticeMessage()).toContain('preparando el comercio');
    expect(fixture.componentInstance.submitting()).toBe(false);
  });

  it('asks the user to log in manually if automatic login fails', () => {
    setRegistrationRoute();
    authServiceMock.register.mockReturnValue(
      of({ registrationId: 'registration-1', status: 'COMPLETE' }),
    );
    authServiceMock.login.mockReturnValue(throwError(() => new Error('login failed')));
    const fixture = TestBed.createComponent(AuthPage);
    fillRegistrationForm(fixture);

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.noticeMessage()).toContain(
      'no pudimos iniciar sesión automáticamente',
    );
    expect(fixture.componentInstance.submitting()).toBe(false);
  });
});

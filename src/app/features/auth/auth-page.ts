import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
})
export class AuthPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isRegister = this.route.snapshot.data['mode'] === 'register';
  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly errorMessage = signal('');
  readonly noticeMessage = signal('');

  readonly form = this.formBuilder.group({
    personalName: [''],
    merchantName: [''],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', [Validators.required, Validators.minLength(8), passwordPolicyValidator]],
  });

  constructor() {
    if (this.isRegister) {
      this.form.controls.personalName.setValidators([
        Validators.required,
        Validators.maxLength(200),
      ]);
      this.form.controls.merchantName.setValidators([
        Validators.required,
        Validators.maxLength(200),
      ]);
    }
  }

  submit(): void {
    this.errorMessage.set('');
    this.noticeMessage.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const { email, password, personalName, merchantName } = this.form.getRawValue();

    if (this.isRegister) {
      this.auth
        .register({
          email: email!,
          password: password!,
          personalName: personalName!,
          merchantName: merchantName!,
        })
        .subscribe({
          next: (response) => {
            if (response.status === 'PENDING') {
              this.submitting.set(false);
              this.noticeMessage.set(
                'Tu cuenta se creó y estamos preparando el comercio. Intenta iniciar sesión en unos instantes.',
              );
              return;
            }
            this.auth.login(email!, password!).subscribe({
              next: () => {
                this.submitting.set(false);
                this.navigateAfterLogin();
              },
              error: () => {
                this.submitting.set(false);
                this.noticeMessage.set(
                  'Cuenta creada, pero no pudimos iniciar sesión automáticamente. Inicia sesión con tus datos.',
                );
              },
            });
          },
          error: (error: HttpErrorResponse) => this.showError(error),
        });
      return;
    }

    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.submitting.set(false);
        this.navigateAfterLogin();
      },
      error: (error: HttpErrorResponse) => this.showError(error),
    });
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  private showError(error: HttpErrorResponse): void {
    this.submitting.set(false);
    this.errorMessage.set(
      error.status === 401
        ? 'Email o contraseña incorrectos.'
        : error.status === 409
          ? 'Ya existe una cuenta con ese email.'
          : error.status === 429
            ? 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
            : error.status === 503
              ? 'La configuración de tu cuenta sigue pendiente. Inténtalo de nuevo en unos instantes.'
              : 'No se pudo completar la solicitud. Inténtalo de nuevo.',
    );
  }
}

function passwordPolicyValidator(control: { value: string | null }) {
  const password = control.value ?? '';
  return /\p{Lu}/u.test(password) && /[^\p{L}\p{N}\s]/u.test(password)
    ? null
    : { passwordPolicy: true };
}

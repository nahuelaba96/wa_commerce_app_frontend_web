import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { AuthService } from '../services/auth.service';
import { AuthTokenStore } from '../services/auth-token.store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStore = inject(AuthTokenStore);
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = tokenStore.get();
  if (!token || !request.url.startsWith(apiConfig.baseUrl)) {
    return next(request);
  }
  const authenticatedRequest = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(authenticatedRequest).pipe(
    catchError((error: { status?: number }) => {
      const isAuthEndpoint = request.url.startsWith(apiConfig.authBaseUrl);
      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((refreshedToken) => next(request.clone({
          setHeaders: { Authorization: `Bearer ${refreshedToken}` }
        }))),
        catchError((refreshError: unknown) => {
          tokenStore.clear();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};

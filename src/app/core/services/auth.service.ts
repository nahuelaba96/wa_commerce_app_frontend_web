import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { apiConfig } from '../config/api.config';
import { AuthTokenStore } from './auth-token.store';
import { MerchantContextService } from './merchant-context.service';

export interface RegistrationRequest {
  email: string;
  password: string;
  personalName: string;
  merchantName: string;
}

export interface RegistrationResponse {
  registrationId: string;
  status: 'PENDING' | 'COMPLETE';
}

interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  merchantId: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStore = inject(AuthTokenStore);
  private readonly merchantContext = inject(MerchantContextService);
  private refreshRequest?: Observable<string>;

  register(request: RegistrationRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${apiConfig.authBaseUrl}/register`, request);
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<TokenResponse>(
      `${apiConfig.authBaseUrl}/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap((response) => this.setSession(response)),
      map(() => undefined)
    );
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.tokenStore.get()) {
      return of(true);
    }
    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        this.tokenStore.clear();
        return of(false);
      })
    );
  }

  refreshAccessToken(): Observable<string> {
    if (!this.refreshRequest) {
      this.refreshRequest = this.http.post<TokenResponse>(
        `${apiConfig.authBaseUrl}/refresh`,
        {},
        { withCredentials: true }
      ).pipe(
        tap((response) => this.setSession(response)),
        map((response) => response.accessToken),
        catchError((error: unknown) => {
          this.tokenStore.clear();
          this.merchantContext.clearMerchantId();
          throw error;
        }),
        finalize(() => {
          this.refreshRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.refreshRequest;
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${apiConfig.authBaseUrl}/logout`,
      {},
      { withCredentials: true }
    ).pipe(finalize(() => {
      this.tokenStore.clear();
      this.merchantContext.clearMerchantId();
    }));
  }

  private setSession(response: TokenResponse): void {
    this.tokenStore.set(response.accessToken);
    this.merchantContext.setMerchantId(response.merchantId);
  }
}

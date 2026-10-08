import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthTokenStore {
  private readonly accessToken = signal<string | null>(null);

  get(): string | null {
    return this.accessToken();
  }

  set(token: string): void {
    this.accessToken.set(token);
  }

  clear(): void {
    this.accessToken.set(null);
  }
}

import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

const authenticate = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.ensureAuthenticated().pipe(
    map((authenticated) => authenticated || router.createUrlTree(['/login']))
  );
};

export const authGuard: CanActivateFn = authenticate;
export const authChildGuard: CanActivateChildFn = authenticate;

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AdminDataService } from './admin-data.service';

export const loginGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated && auth.isStaff) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated || !auth.isStaff) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const data = inject(AdminDataService);
    const router = inject(Router);
    if (!auth.isAuthenticated) {
      router.navigate(['/login']);
      return false;
    }
    if (!data.hasPermission(permission)) {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  };
};

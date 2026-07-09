import { Injectable, signal, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from './firebase.service';
import { AuthUser } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  constructor() {
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch {
        localStorage.removeItem('admin_user');
      }
    }

    effect(() => {
      const fbUser = this.firebase.currentFirebaseUser();
      if (fbUser) {
        this.firebase.getUser(fbUser.uid).subscribe({
          next: (userData) => {
            if (userData) {
              const authUser: AuthUser = {
                id: fbUser.uid,
                name: userData.name,
                email: userData.email,
                avatar: userData.avatar ?? userData.name.slice(0, 2).toUpperCase(),
                role: userData.role,
              };
              this.currentUser.set(authUser);
              localStorage.setItem('admin_user', JSON.stringify(authUser));
            }
          },
          error: () => {
            const fallback: AuthUser = {
              id: fbUser.uid,
              name: fbUser.displayName || fbUser.email!.split('@')[0],
              email: fbUser.email!,
              avatar: fbUser.email!.slice(0, 2).toUpperCase(),
              role: 'Admin',
            };
            this.currentUser.set(fallback);
            localStorage.setItem('admin_user', JSON.stringify(fallback));
          },
        });
      }
    });


  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.firebase.login(email, password);
      this.loading.set(false);
    } catch {
      this.error.set('Email 或密碼錯誤，或 Firebase 尚未設定');
      this.loading.set(false);
    }
  }

  logout(): void {
    this.firebase.logout();
    this.currentUser.set(null);
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }
}

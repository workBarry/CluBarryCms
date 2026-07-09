import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User, UserRole } from '../types/admin.models';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');

  private readonly mockUsers: AuthUser[] = [
    { id: 3, name: 'Kevin Wu', email: 'kevin@example.com', avatar: 'KW', role: 'Admin' },
    { id: 5, name: 'Peter Jiang', email: 'peter@example.com', avatar: 'PJ', role: 'Vice President' },
    { id: 2, name: 'Amy Lin', email: 'amy@example.com', avatar: 'AL', role: 'Activity Leader' },
  ];

  constructor(private readonly router: Router) {
    const saved = localStorage.getItem('admin_user');
    if (saved) {
      try {
        this.currentUser.set(JSON.parse(saved));
      } catch {
        localStorage.removeItem('admin_user');
      }
    }
  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
  }

  login(email: string, password: string): void {
    this.loading.set(true);
    this.error.set('');

    setTimeout(() => {
      const user = this.mockUsers.find((u) => u.email === email);
      if (user && password === 'password') {
        this.currentUser.set(user);
        localStorage.setItem('admin_user', JSON.stringify(user));
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set('Email 或密碼錯誤');
      }
      this.loading.set(false);
    }, 600);
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem('admin_user');
    this.router.navigate(['/login']);
  }
}

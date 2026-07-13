import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import { User as FirebaseUser } from 'firebase/auth';
import { filter, firstValueFrom, take } from 'rxjs';
import { User, UserRole } from '../types/admin.models';
import { FirebaseService } from './firebase.service';
import { AuthUser } from './auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebase = inject(FirebaseService);
  private readonly router = inject(Router);
  private readonly profileResolved = signal(false);

  readonly currentUser = signal<AuthUser | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly ready = computed(() => this.firebase.authReady() && this.profileResolved());
  private readonly ready$ = toObservable(this.ready);

  constructor() {
    effect((onCleanup) => {
      if (!this.firebase.authReady()) return;

      const firebaseUser = this.firebase.currentFirebaseUser();
      this.profileResolved.set(false);

      if (!firebaseUser) {
        this.currentUser.set(null);
        this.profileResolved.set(true);
        return;
      }

      const subscription = this.firebase.getUser(firebaseUser.uid).subscribe({
        next: (profile) => this.acceptProfile(firebaseUser, profile),
        error: () => this.rejectProfile('無法讀取後台使用者資料，請稍後再試。'),
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  get isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
  }

  get isStaff(): boolean {
    return this.isStaffRole(this.currentUser()?.role);
  }

  async waitUntilReady(): Promise<void> {
    if (this.ready()) return;
    await firstValueFrom(this.ready$.pipe(filter(Boolean), take(1)));
  }

  async login(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.profileResolved.set(false);

    try {
      await this.firebase.login(email, password);
      await this.waitUntilReady();
      if (this.currentUser()) await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.error.set(this.authErrorMessage(error, '登入失敗，請確認 Email 與密碼。'));
      this.profileResolved.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    await this.firebase.logout();
    this.currentUser.set(null);
    this.error.set('');
    this.profileResolved.set(true);
    await this.router.navigate(['/login']);
  }

  private acceptProfile(firebaseUser: FirebaseUser, profile: User | undefined): void {
    if (!profile || !this.isStaffRole(profile.role)) {
      this.rejectProfile('此帳號尚未設定後台角色，請聯絡系統管理員。');
      return;
    }

    const email = profile.email || firebaseUser.email || '';
    const name = profile.name?.trim()
      || firebaseUser.displayName?.trim()
      || email.split('@')[0]
      || '未命名使用者';
    this.currentUser.set({
      id: firebaseUser.uid,
      name,
      email,
      avatar: profile.avatar || name.slice(0, 2).toUpperCase(),
      role: profile.role,
      permissionsOverride: profile.permissionsOverride,
    });
    this.profileResolved.set(true);
  }

  private rejectProfile(message: string): void {
    this.currentUser.set(null);
    this.error.set(message);
    this.profileResolved.set(true);
    void this.firebase.logout();
  }

  private authErrorMessage(error: unknown, fallback: string): string {
    if (!(error instanceof FirebaseError)) return fallback;
    const messages: Record<string, string> = {
      'auth/invalid-email': 'Email 格式不正確。',
      'auth/invalid-credential': 'Email 或密碼錯誤。',
      'auth/network-request-failed': '網路連線失敗，請稍後再試。',
    };
    return messages[error.code] ?? fallback;
  }

  private isStaffRole(role: UserRole | undefined): boolean {
    return role === 'Activity Leader' || role === 'Vice President' || role === 'Admin';
  }
}

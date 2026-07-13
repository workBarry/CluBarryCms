import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subscription, filter, firstValueFrom, take } from 'rxjs';
import {
  ClubSettings,
  PERMISSION_KEYS,
  PermissionGroup,
  PermissionKey,
  PermissionLog,
} from '../types/admin.models';
import { AuthService } from './auth.service';
import { FirebaseService } from './firebase.service';

const EMPTY_SETTINGS: ClubSettings = {
  logo: '',
  clubName: 'Club Management System',
  email: '',
  phone: '',
  fb: '',
  ig: '',
  discord: '',
  recruitmentUrl: '',
};

@Injectable({ providedIn: 'root' })
export class AdminConfigService {
  private readonly firebase = inject(FirebaseService);
  private readonly auth = inject(AuthService);
  private readonly permissionsReady = signal(false);
  private readonly permissionReadyState = computed(() => this.permissionsReady());
  private readonly permissionReady$ = toObservable(this.permissionReadyState);
  private subscription?: Subscription;

  readonly permissions = signal<PermissionGroup[]>([]);
  readonly permissionLogs = signal<PermissionLog[]>([]);
  readonly settings = signal<ClubSettings>(EMPTY_SETTINGS);

  startSync(): void {
    if (this.subscription && !this.subscription.closed) return;
    this.permissionsReady.set(false);
    this.subscription = new Subscription();
    this.subscription.add(this.firebase.watchPermissions().subscribe({
      next: (permissions) => {
        this.permissions.set(permissions);
        this.permissionsReady.set(true);
      },
      error: (error) => {
        console.warn('Firebase permissions sync failed:', error);
        this.permissionsReady.set(true);
      },
    }));
    this.subscription.add(this.firebase.watchSettings().subscribe({
      next: (settings) => this.settings.set(settings ?? EMPTY_SETTINGS),
      error: (error) => console.warn('Firebase settings sync failed:', error),
    }));
    if (this.auth.isAdmin) this.startPermissionLogSync();
  }

  stopSync(): void {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.permissions.set([]);
    this.permissionLogs.set([]);
    this.settings.set(EMPTY_SETTINGS);
    this.permissionsReady.set(false);
  }

  async waitUntilPermissionsReady(): Promise<void> {
    this.startSync();
    if (this.permissionsReady()) return;
    await firstValueFrom(this.permissionReady$.pipe(filter(Boolean), take(1)));
  }

  hasPermission(permission: PermissionKey): boolean {
    const user = this.auth.currentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true;
    const override = user.permissionsOverride?.[permission];
    if (override !== undefined) return override;
    return this.permissions().find((group) => group.role === user.role)?.permissions[permission] ?? false;
  }

  setPermission(role: string, permission: PermissionKey, value: boolean): void {
    this.permissions.update((groups) => groups.map((group) => (
      group.role === role
        ? { ...group, permissions: { ...group.permissions, [permission]: value } }
        : group
    )));
    const group = this.permissions().find((item) => item.role === role);
    if (group) this.report('permission update', this.firebase.updatePermission(role, group));
    this.logChange('update', role, permission, value);
  }

  createRole(role: string): void {
    const permissions = Object.fromEntries(PERMISSION_KEYS.map((key) => [key, false])) as Record<PermissionKey, boolean>;
    const group: PermissionGroup = { role, permissions };
    this.permissions.update((groups) => [...groups, group]);
    this.report('permission group create', this.firebase.createPermission(group));
    this.logChange('create', role);
  }

  updateSettings(settings: ClubSettings): void {
    this.settings.set({ ...settings });
    this.report('settings update', this.firebase.updateSettings(settings));
  }

  private startPermissionLogSync(): void {
    this.subscription?.add(this.firebase.watchPermissionLogs().subscribe({
      next: (logs) => this.permissionLogs.set(logs),
      error: (error) => console.warn('Firebase permission logs sync failed:', error),
    }));
  }

  private logChange(
    action: PermissionLog['action'],
    role: string,
    permission?: PermissionKey,
    value?: boolean,
  ): void {
    const actor = this.auth.currentUser()?.name ?? 'system';
    const createdAt = new Date().toISOString();
    this.report('permission log create', this.firebase.addPermissionLog({
      action,
      role,
      permission,
      value,
      actor,
      createdAt,
    }));
  }

  private report(action: string, operation: Promise<unknown>): void {
    void operation.catch((error) => console.warn(`Firebase ${action} failed:`, error));
  }
}

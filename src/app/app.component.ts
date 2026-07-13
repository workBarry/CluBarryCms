import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminConfigService } from './services/admin-config.service';
import { AdminSyncService } from './services/admin-sync.service';
import { ClubDataService } from './services/club-data.service';
import { ClubContextService } from './services/club-context.service';
import { PermissionKey } from './types/admin.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  readonly clubs = inject(ClubDataService);
  readonly config = inject(AdminConfigService);
  readonly clubContext = inject(ClubContextService);
  private readonly sync = inject(AdminSyncService);

  readonly navItems: { label: string; path: string; icon: string; perm: PermissionKey | null }[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'D', perm: 'Dashboard' },
    { label: '社團管理', path: '/clubs', icon: 'C', perm: '社團管理' },
    { label: '社員管理', path: '/users', icon: 'U', perm: '社員管理' },
    { label: '活動管理', path: '/events', icon: 'E', perm: '活動管理' },
    { label: '場次管理', path: '/sessions', icon: 'T', perm: '活動管理' },
    { label: '公告管理', path: '/announcements', icon: 'A', perm: '公告管理' },
    { label: '報名管理', path: '/registrations', icon: 'R', perm: '報名管理' },
    { label: '幹部管理', path: '/officers', icon: 'O', perm: '幹部管理' },
    { label: '權限管理', path: '/permissions', icon: 'P', perm: '權限管理' },
    { label: '系統設定', path: '/settings', icon: 'S', perm: '系統設定' },
  ];

  sidebarOpen = false;

  canView(item: { perm: PermissionKey | null }): boolean {
    if (this.auth.isAdmin) return true;
    return item.perm === null ? this.auth.isStaff : this.config.hasPermission(item.perm);
  }

  trackNav(_index: number, item: { path: string }): string {
    return item.path;
  }

  trackClub(_index: number, club: { id: string }): string {
    return club.id;
  }

  onSelectClub(id: string): void {
    this.clubContext.selectClub(id);
    this.sidebarOpen = false;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  constructor() {
    effect(() => {
      if (this.auth.currentUser()) this.sync.start();
      else this.sync.stop();
    });
  }
}

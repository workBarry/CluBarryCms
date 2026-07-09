import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminDataService } from './services/admin-data.service';
import { FirebaseService } from './services/firebase.service';
import { PermissionKey } from './types/admin.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly data = inject(AdminDataService);
  private readonly firebase = inject(FirebaseService);
  private synced = false;

  readonly navItems: { label: string; path: string; icon: string; perm: PermissionKey | null }[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'D', perm: 'Dashboard' },
    { label: '社員管理', path: '/users', icon: 'U', perm: '社員管理' },
    { label: '活動管理', path: '/events', icon: 'E', perm: '活動管理' },
    { label: '公告管理', path: '/announcements', icon: 'A', perm: '公告管理' },
    { label: '報名管理', path: '/registrations', icon: 'R', perm: '報名管理' },
    { label: '幹部管理', path: '/officers', icon: 'O', perm: '幹部管理' },
    { label: '權限管理', path: '/permissions', icon: 'P', perm: '權限管理' },
    { label: '系統設定', path: '/settings', icon: 'S', perm: '系統設定' },
  ];

  canView(item: { perm: PermissionKey | null }): boolean {
    if (this.auth.isAdmin) return true;
    return item.perm === null ? this.auth.isStaff : this.data.hasPermission(item.perm);
  }

  constructor() {
    effect(() => {
      const fbUser = this.firebase.currentFirebaseUser();
      if (fbUser) {
        if (!this.synced) {
          this.synced = true;
          this.data.syncFromFirebase();
        }
      } else {
        this.synced = false;
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminDataService } from './services/admin-data.service';
import { ClubContextService } from './services/club-context.service';
import { FirebaseService } from './services/firebase.service';
import { Club, PermissionKey } from './types/admin.models';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  readonly auth = inject(AuthService);
  private readonly data = inject(AdminDataService);
  readonly clubContext = inject(ClubContextService);
  private readonly firebase = inject(FirebaseService);
  private synced = false;

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

  canView(item: { perm: PermissionKey | null }): boolean {
    if (this.auth.isAdmin) return true;
    return item.perm === null ? this.auth.isStaff : this.data.hasPermission(item.perm);
  }

  readonly manageableClubs = (): Club[] => {
    const all = this.data.clubs();
    if (this.auth.isAdmin) return all;
    const myIds = new Set(
      this.data.clubMembers().filter((m) => m.userId === this.auth.currentUser()?.id && m.roleInClub !== 'Member' && m.status === 'active').map((m) => m.clubId),
    );
    return all.filter((c) => myIds.has(c.id));
  };

  onSelectClub(id: string): void {
    this.clubContext.selectClub(id);
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

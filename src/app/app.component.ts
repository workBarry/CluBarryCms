import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { AdminDataService } from './services/admin-data.service';
import { FirebaseService } from './services/firebase.service';

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

  readonly navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'D' },
    { label: '社員管理', path: '/users', icon: 'U' },
    { label: '活動管理', path: '/events', icon: 'E' },
    { label: '公告管理', path: '/announcements', icon: 'A' },
    { label: '報名管理', path: '/registrations', icon: 'R' },
    { label: '幹部管理', path: '/officers', icon: 'O' },
    { label: '權限管理', path: '/permissions', icon: 'P' },
    { label: '系統設定', path: '/settings', icon: 'S' },
  ];

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

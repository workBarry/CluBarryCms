import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { PERMISSION_KEYS, PermissionKey } from '../../types/admin.models';

@Component({
  selector: 'app-permissions-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Permissions</span>
        <h1>權限管理</h1>
      </div>
      <form class="role-creator" (ngSubmit)="addRole()">
        <input type="text" [(ngModel)]="newRole" name="newRole" placeholder="新增角色名稱" />
        <button class="btn primary" type="submit" [disabled]="!newRole.trim()">新增角色</button>
      </form>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>角色</th>
            <th *ngFor="let permission of permissionKeys">{{ permission }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let group of data.permissions()">
            <td><strong>{{ group.role }}</strong></td>
            <td *ngFor="let permission of permissionKeys">
              <input
                type="checkbox"
                [checked]="group.permissions[permission]"
                (change)="change(group.role, permission, $any($event.target).checked)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="table-card">
      <h2 class="log-title">變更紀錄</h2>
      <ul class="log-list">
        <li *ngFor="let log of data.permissionLogs() | slice: 0 : 20">
          <span class="log-actor">{{ log.actor }}</span>
          <span *ngIf="log.action === 'update'">{{ log.role }} 的「{{ log.permission }}」設為 {{ log.value ? '開' : '關' }}</span>
          <span *ngIf="log.action === 'create'">建立新角色「{{ log.role }}」</span>
          <span class="log-time">{{ log.createdAt | date: 'MM/dd HH:mm' }}</span>
        </li>
        <li *ngIf="data.permissionLogs().length === 0" class="log-empty">尚無變更紀錄</li>
      </ul>
    </section>
  `,
  styles: [`
    .role-creator { display: flex; gap: 0.5rem; }
    .role-creator input { min-height: auto; }
    .log-title { margin: 0 0 0.75rem; }
    .log-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.4rem; }
    .log-list li { display: flex; gap: 0.5rem; align-items: center; font-size: 0.875rem; color: var(--muted); }
    .log-actor { font-weight: 600; color: var(--text); }
    .log-time { margin-left: auto; }
    .log-empty { color: var(--muted); }
  `],
})
export class PermissionsAdminPage {
  readonly data = inject(AdminDataService);
  readonly permissionKeys = PERMISSION_KEYS;
  newRole = '';

  change(role: string, permission: PermissionKey, checked: boolean): void {
    this.data.setPermission(role, permission, checked);
  }

  addRole(): void {
    const role = this.newRole.trim();
    if (!role) return;
    if (this.data.permissions().some((g) => g.role === role)) return;
    this.data.createRole(role);
    this.newRole = '';
  }
}

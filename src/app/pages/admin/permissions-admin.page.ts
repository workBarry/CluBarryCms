import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { AdminConfigService } from '../../services/admin-config.service';
import { PERMISSION_KEYS, PermissionKey } from '../../types/admin.models';

@Component({
  selector: 'app-permissions-admin-page',
  imports: [CommonModule, FormsModule, EmptyState, PageHeader],
  template: `
    <app-page-header eyebrow="Permissions" title="權限管理">
      <form class="role-creator" (ngSubmit)="addRole()">
        <input type="text" [(ngModel)]="newRole" name="newRole" placeholder="新增角色名稱" />
        <button class="btn primary" type="submit" [disabled]="!newRole.trim()">新增角色</button>
      </form>
    </app-page-header>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>角色</th>
            @for (permission of permissionKeys; track permission) { <th>{{ permission }}</th> }
          </tr>
        </thead>
        <tbody>
          @for (group of config.permissions(); track group.role) {
            <tr>
              <td><strong>{{ group.role }}</strong></td>
              @for (permission of permissionKeys; track permission) {
                <td>
                  <input
                    type="checkbox"
                    [checked]="group.permissions[permission]"
                    (change)="change(group.role, permission, $any($event.target).checked)"
                  />
                </td>
              }
            </tr>
          } @empty {
            <tr><td [attr.colspan]="permissionKeys.length + 1"><app-empty-state title="尚無權限群組" /></td></tr>
          }
        </tbody>
      </table>
    </section>

    <section class="table-card">
      <h2 class="log-title">變更紀錄</h2>
      <ul class="log-list">
        @for (log of config.permissionLogs() | slice: 0 : 20; track log.id || $index) {
          <li>
            <span class="log-actor">{{ log.actor }}</span>
            @if (log.action === 'update') {
              <span>{{ log.role }} 的「{{ log.permission }}」設為 {{ log.value ? '開' : '關' }}</span>
            } @else {
              <span>建立新角色「{{ log.role }}」</span>
            }
            <span class="log-time">{{ log.createdAt | date: 'MM/dd HH:mm' }}</span>
          </li>
        } @empty {
          <li class="log-empty">尚無變更紀錄</li>
        }
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
  readonly config = inject(AdminConfigService);
  readonly permissionKeys = PERMISSION_KEYS;
  newRole = '';

  change(role: string, permission: PermissionKey, checked: boolean): void {
    this.config.setPermission(role, permission, checked);
  }

  addRole(): void {
    const role = this.newRole.trim();
    if (!role) return;
    if (this.config.permissions().some((group) => group.role === role)) return;
    this.config.createRole(role);
    this.newRole = '';
  }
}

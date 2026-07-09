import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-permissions-admin-page',
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <span class="eyebrow">Permissions</span>
      <h1>權限管理</h1>
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
              <input type="checkbox" [checked]="group.permissions[permission]" (change)="change(group.role, permission, $any($event.target).checked)" />
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
})
export class PermissionsAdminPage {
  readonly data = inject(AdminDataService);
  readonly permissionKeys = ['Dashboard', '公告', '活動', '社員', '報名', '系統'];

  change(role: string, permission: string, checked: boolean): void {
    this.data.setPermission(role, permission, checked);
  }
}

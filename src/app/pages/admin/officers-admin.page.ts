import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { User, UserRole } from '../../types/admin.models';

@Component({
  selector: 'app-officers-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Officers</span>
        <h1>幹部管理</h1>
      </div>
      <button class="btn primary" type="button" (click)="message = '新增幹部會開啟社員選擇 modal。'">新增幹部</button>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>Email</th>
            <th>職位</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let officer of officers">
            <td><span class="avatar">{{ officer.avatar }}</span>{{ officer.name }}</td>
            <td>{{ officer.email }}</td>
            <td>
              <select [(ngModel)]="officer.role" (ngModelChange)="saveOfficer(officer)">
                <option *ngFor="let role of officerRoles" [value]="role">{{ role }}</option>
              </select>
            </td>
            <td><span class="status">{{ officer.status }}</span></td>
            <td class="actions">
              <button type="button" (click)="saveOfficer(officer)">修改</button>
              <button type="button" (click)="suspend(officer)">停權</button>
              <button type="button" (click)="message = officer.name + ' 的權限可至權限管理調整。'">設定權限</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>
  `,
})
export class OfficersAdminPage {
  readonly data = inject(AdminDataService);
  readonly officerRoles: UserRole[] = ['Activity Leader', 'Vice President', 'Admin'];
  message = '';

  get officers(): User[] {
    return this.data.users().filter((user) => user.role !== 'Member');
  }

  saveOfficer(user: User): void {
    this.data.upsertUser({ ...user });
    this.message = `${user.name} 的幹部資料已更新。`;
  }

  suspend(user: User): void {
    this.data.upsertUser({ ...user, status: 'suspended' });
    this.message = `${user.name} 已停權。`;
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { User, UserRole, UserStatus, PERMISSION_KEYS, PermissionKey } from '../../types/admin.models';

@Component({
  selector: 'app-users-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Users</span>
        <h1>社員管理</h1>
      </div>
      
    </section>

    <section class="toolbar">
      <input type="search" [(ngModel)]="keyword" placeholder="搜尋姓名、學號、Email" />
      <select [(ngModel)]="status">
        <option value="all">全部狀態</option>
        <option value="active">啟用</option>
        <option value="pending">待審核</option>
        <option value="suspended">停權</option>
      </select>
      <select [(ngModel)]="sortKey">
        <option value="createdAt">依建立時間</option>
        <option value="name">依姓名</option>
        <option value="studentId">依學號</option>
      </select>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>學號</th>
            <th>Email</th>
            <th>職位</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let user of pagedUsers">
            <td><span class="avatar">{{ user.avatar }}</span>{{ user.name }}</td>
            <td>{{ user.studentId }}</td>
            <td>{{ user.email }}</td>
            <td><span class="pill">{{ user.role }}</span></td>
            <td><span class="status">{{ user.status }}</span></td>
            <td class="actions" *ngIf="data.hasPermission('社員管理')">
              <button type="button" (click)="openEdit(user)">修改</button>
              <button type="button" class="danger" (click)="data.deleteUser(user.id)">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button type="button" (click)="page = page - 1" [disabled]="page === 1">上一頁</button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button type="button" (click)="page = page + 1" [disabled]="page === totalPages">下一頁</button>
      </div>
    </section>

    <section class="modal-backdrop" *ngIf="modalOpen">
      <form class="modal form-grid" (ngSubmit)="save()">
        <h2>修改社員</h2>
        <label>姓名<input name="name" [(ngModel)]="draft.name" /></label>
        <label>Email<input type="email" name="email" [(ngModel)]="draft.email" /></label>
        <label>電話<input name="phone" [(ngModel)]="draft.phone" /></label>
        <label>學號<input name="studentId" [(ngModel)]="draft.studentId" /></label>
        <label>系級<input name="department" [(ngModel)]="draft.department" /></label>
        <label>角色
          <select name="role" [(ngModel)]="draft.role">
            <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
          </select>
        </label>
        <label>狀態
          <select name="status" [(ngModel)]="draft.status">
            <option *ngFor="let item of statuses" [value]="item">{{ item }}</option>
          </select>
        </label>
        <fieldset class="override-fieldset">
          <legend>權限例外（覆蓋角色預設）</legend>
          <label class="override-row" *ngFor="let key of permissionKeys">
            <input type="checkbox" [checked]="draft.permissionsOverride?.[key]" (change)="toggleOverride(key, $any($event.target).checked)" />
            {{ key }}
          </label>
        </fieldset>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="modalOpen = false">取消</button>
          <button class="btn primary" type="submit">儲存</button>
        </div>
      </form>
    </section>
  `,
})
export class UsersAdminPage {
  readonly data = inject(AdminDataService);
  readonly roles: UserRole[] = ['Member', 'Activity Leader', 'Vice President', 'Admin'];
  readonly statuses: UserStatus[] = ['active', 'pending', 'suspended'];
  readonly permissionKeys = PERMISSION_KEYS;

  keyword = '';
  status = 'all';
  sortKey: keyof User = 'createdAt';
  page = 1;
  pageSize = 5;
  modalOpen = false;
  draft: User = this.emptyDraft;

  get filteredUsers(): User[] {
    const keyword = this.keyword.trim().toLowerCase();
    return [...this.data.users()]
      .filter((user) => {
        const matchKeyword = !keyword || `${user.name} ${user.studentId} ${user.email}`.toLowerCase().includes(keyword);
        const matchStatus = this.status === 'all' || user.status === this.status;
        return matchKeyword && matchStatus;
      })
      .sort((a, b) => String(b[this.sortKey]).localeCompare(String(a[this.sortKey])));
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pagedUsers(): User[] {
    this.page = Math.min(this.page, this.totalPages);
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  private get emptyDraft(): User {
    return { id: '', avatar: '', name: '', studentId: '', department: '', grade: '', email: '', phone: '', role: 'Member', status: 'pending', createdAt: '' };
  }

  openEdit(user: User): void {
    this.draft = { ...user, permissionsOverride: { ...user.permissionsOverride } };
    this.modalOpen = true;
  }

  toggleOverride(key: PermissionKey, value: boolean): void {
    this.draft.permissionsOverride = { ...this.draft.permissionsOverride, [key]: value };
  }

  save(): void {
    this.data.upsertUser(this.draft);
    this.modalOpen = false;
  }
}

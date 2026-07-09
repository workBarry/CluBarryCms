import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { User, UserRole } from '../../types/admin.models';

@Component({
  selector: 'app-officers-admin-page',
  imports: [CommonModule, FormsModule],
  styles: [`
    .member-selector {
      display: grid;
      gap: 1rem;
    }
    .member-list {
      display: grid;
      gap: 0.5rem;
      max-height: 24rem;
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 0.45rem;
      padding: 0.5rem;
    }
    .member-row {
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      gap: 0.65rem;
      align-items: center;
      padding: 0.45rem 0.65rem;
      border-radius: 0.35rem;
      cursor: pointer;
    }
    .member-row:hover {
      background: var(--hover);
    }
    .member-row .avatar {
      width: 2rem;
      height: 2rem;
      font-size: 0.75rem;
    }
    .member-row input[type="checkbox"] {
      width: auto;
      min-height: auto;
    }
    .muted {
      color: var(--muted);
      font-size: 0.875rem;
    }
  `],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Officers</span>
        <h1>幹部管理</h1>
      </div>
      <button class="btn primary" type="button" (click)="openAddOfficer()">新增幹部</button>
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

    <section class="modal-backdrop" *ngIf="modalOpen">
      <form class="modal member-selector" (ngSubmit)="addOfficers()">
        <h2>新增幹部</h2>
        <label>搜尋社員<input type="search" [(ngModel)]="search" name="search" placeholder="輸入姓名或 Email" /></label>
        <label>指派職位
          <select name="targetRole" [(ngModel)]="targetRole">
            <option *ngFor="let role of officerRoles" [value]="role">{{ role }}</option>
          </select>
        </label>
        <div class="member-list">
          <label class="member-row" *ngFor="let member of filteredMembers">
            <input type="checkbox" [checked]="selectedIds.has(member.id)" (change)="toggleMember(member.id)" />
            <span class="avatar">{{ member.avatar }}</span>
            <span>{{ member.name }}</span>
            <span class="muted">{{ member.email }}</span>
          </label>
          <p class="muted" *ngIf="filteredMembers.length === 0">沒有符合的社員</p>
        </div>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="modalOpen = false">取消</button>
          <button class="btn primary" type="submit" [disabled]="selectedIds.size === 0">
            將 {{ selectedIds.size }} 人設為幹部
          </button>
        </div>
      </form>
    </section>
  `,
})
export class OfficersAdminPage {
  readonly data = inject(AdminDataService);
  readonly officerRoles: UserRole[] = ['Activity Leader', 'Vice President', 'Admin'];
  message = '';
  modalOpen = false;
  search = '';
  targetRole: UserRole = 'Activity Leader';
  selectedIds = new Set<string>();

  get officers(): User[] {
    return this.data.users().filter((user) => user.role !== 'Member');
  }

  get members(): User[] {
    return this.data.users().filter((user) => user.role === 'Member');
  }

  get filteredMembers(): User[] {
    const keyword = this.search.trim().toLowerCase();
    return this.members.filter((m) => !keyword || `${m.name} ${m.email}`.toLowerCase().includes(keyword));
  }

  openAddOfficer(): void {
    this.search = '';
    this.targetRole = 'Activity Leader';
    this.selectedIds.clear();
    this.modalOpen = true;
  }

  toggleMember(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  addOfficers(): void {
    for (const id of this.selectedIds) {
      const member = this.members.find((m) => m.id === id);
      if (member) {
        this.data.upsertUser({ ...member, role: this.targetRole, status: 'active' });
      }
    }
    this.message = `已將 ${this.selectedIds.size} 位社員設為 ${this.targetRole}`;
    this.selectedIds.clear();
    this.modalOpen = false;
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

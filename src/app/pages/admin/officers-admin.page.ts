import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { ClubContextService } from '../../services/club-context.service';
import { ClubMember, RoleInClub, User } from '../../types/admin.models';

@Component({
  selector: 'app-officers-admin-page',
  imports: [CommonModule, FormsModule],
  styles: [`
    .member-selector { display: grid; gap: 1rem; }
    .member-list {
      display: grid; gap: 0.5rem; max-height: 24rem; overflow: auto;
      border: 1px solid var(--line); border-radius: 0.45rem; padding: 0.5rem;
    }
    .member-row {
      display: grid; grid-template-columns: auto auto 1fr auto; gap: 0.65rem;
      align-items: center; padding: 0.45rem 0.65rem; border-radius: 0.35rem; cursor: pointer;
    }
    .member-row:hover { background: var(--hover); }
    .member-row .avatar { width: 2rem; height: 2rem; font-size: 0.75rem; }
    .member-row input[type="checkbox"] { width: auto; min-height: auto; }
    .muted { color: var(--muted); font-size: 0.875rem; }
  `],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Officers</span>
        <h1>幹部管理</h1>
      </div>
      <button class="btn primary" type="button" *ngIf="data.hasPermission('幹部管理')" (click)="openAdd()">新增成員</button>
    </section>

    <p class="notice" *ngIf="!clubContext.selectedClubId()">請先從右上角選擇社團。</p>

    <section class="table-card" *ngIf="clubContext.selectedClubId()">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>Email</th>
            <th>社團內職位</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
            <td>{{ row.user?.email }}</td>
            <td>
              <select [(ngModel)]="row.member.roleInClub" (ngModelChange)="saveRole(row.member)">
                <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
              </select>
            </td>
            <td><span class="status">{{ row.member.status }}</span></td>
            <td class="actions" *ngIf="data.hasPermission('幹部管理')">
              <button type="button" (click)="saveRole(row.member)">修改</button>
              <button type="button" (click)="suspend(row.member)">停權</button>
              <button type="button" class="danger" (click)="remove(row.member)">移除</button>
            </td>
          </tr>
          <tr *ngIf="rows.length === 0">
            <td colspan="5" class="empty">尚無成員</td>
          </tr>
        </tbody>
      </table>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>

    <section class="modal-backdrop" *ngIf="modalOpen">
      <form class="modal member-selector" (ngSubmit)="add()">
        <h2>新增社團成員</h2>
        <label>搜尋使用者<input type="search" [(ngModel)]="search" name="search" placeholder="輸入姓名或 Email" /></label>
        <label>指派職位
          <select name="targetRole" [(ngModel)]="targetRole">
            <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
          </select>
        </label>
        <div class="member-list">
          <label class="member-row" *ngFor="let user of filteredCandidates">
            <input type="checkbox" [checked]="selectedIds.has(user.id)" (change)="toggle(user.id)" />
            <span class="avatar">{{ user.avatar }}</span>
            <span>{{ user.name }}</span>
            <span class="muted">{{ user.email }}</span>
          </label>
          <p class="muted" *ngIf="filteredCandidates.length === 0">沒有可加入的使用者</p>
        </div>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="modalOpen = false">取消</button>
          <button class="btn primary" type="submit" [disabled]="selectedIds.size === 0">
            加入 {{ selectedIds.size }} 人
          </button>
        </div>
      </form>
    </section>
  `,
})
export class OfficersAdminPage {
  readonly data = inject(AdminDataService);
  readonly clubContext = inject(ClubContextService);
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];
  message = '';
  modalOpen = false;
  search = '';
  targetRole: RoleInClub = 'Member';
  selectedIds = new Set<string>();

  get rows(): { member: ClubMember; user?: User }[] {
    const clubId = this.clubContext.selectedClubId();
    return this.data
      .clubMembers()
      .filter((m) => m.clubId === clubId)
      .map((member) => ({ member, user: this.data.users().find((u) => u.id === member.userId) }));
  }

  get candidates(): User[] {
    const clubId = this.clubContext.selectedClubId();
    const existing = new Set(this.data.clubMembers().filter((m) => m.clubId === clubId).map((m) => m.userId));
    return this.data.users().filter((u) => !existing.has(u.id));
  }

  get filteredCandidates(): User[] {
    const keyword = this.search.trim().toLowerCase();
    return this.candidates.filter((u) => !keyword || `${u.name} ${u.email}`.toLowerCase().includes(keyword));
  }

  openAdd(): void {
    this.search = '';
    this.targetRole = 'Member';
    this.selectedIds.clear();
    this.modalOpen = true;
  }

  toggle(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  add(): void {
    const clubId = this.clubContext.selectedClubId();
    if (!clubId) return;
    for (const id of this.selectedIds) {
      this.data.addClubMember({ userId: id, clubId, roleInClub: this.targetRole, status: 'active', joinedAt: new Date().toISOString() });
    }
    this.message = `已加入 ${this.selectedIds.size} 位成員（${this.targetRole}）`;
    this.selectedIds.clear();
    this.modalOpen = false;
  }

  saveRole(member: ClubMember): void {
    this.data.updateClubMemberRole(member.id, member.roleInClub);
    this.message = `成員職位已更新為 ${member.roleInClub}。`;
  }

  suspend(member: ClubMember): void {
    this.data.suspendClubMember(member.id);
    this.message = '該成員已停權。';
  }

  remove(member: ClubMember): void {
    this.data.removeClubMember(member.id);
    this.message = '已將成員移出社團。';
  }
}

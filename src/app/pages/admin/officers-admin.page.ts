import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../components/forms/form-modal.component';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AdminConfigService } from '../../services/admin-config.service';
import { ClubDataService } from '../../services/club-data.service';
import { ClubContextService } from '../../services/club-context.service';
import { UserDataService } from '../../services/user-data.service';
import { ClubMember, RoleInClub } from '../../types/admin.models';

@Component({
  selector: 'app-officers-admin-page',
  imports: [FormsModule, FormModal, EmptyState, PageHeader, StatusBadge],
  styles: [`
    .member-selector { display: grid; gap: 1rem; width: 100%; }
    .member-list {
      display: grid; gap: 0.5rem; max-height: 24rem; overflow: auto;
      border: 1px solid var(--line); border-radius: 0.45rem; padding: 0.5rem;
    }
    .member-row {
      display: grid; grid-template-columns: auto auto 1fr auto; gap: 0.65rem;
      align-items: center; padding: 0.45rem 0.65rem; border-radius: 0.35rem; cursor: pointer;
    }
    .member-row:hover { background: var(--surface-soft); }
    .member-row .avatar { width: 2rem; height: 2rem; font-size: 0.75rem; }
    .member-row input[type="checkbox"] { width: auto; min-height: auto; }
    .muted { color: var(--muted); font-size: 0.875rem; }
  `],
  template: `
    <app-page-header eyebrow="Officers" title="幹部管理">
      @if (config.hasPermission('幹部管理')) {
        <button class="btn primary" type="button" (click)="openAdd()">新增成員</button>
      }
    </app-page-header>

    @if (!clubContext.selectedClubId()) {
      <p class="notice">請先從右上角選擇社團。</p>
    } @else {
      <section class="table-card">
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
            @for (row of rows(); track row.member.id) {
              <tr>
                <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
                <td>{{ row.user?.email }}</td>
                <td>
                  <select [(ngModel)]="row.member.roleInClub" (ngModelChange)="saveRole(row.member)">
                    @for (role of roles; track role) { <option [value]="role">{{ role }}</option> }
                  </select>
                </td>
                <td><app-status-badge [value]="row.member.status" /></td>
                <td class="actions">
                  @if (config.hasPermission('幹部管理')) {
                    <button type="button" (click)="saveRole(row.member)">修改</button>
                    <button type="button" (click)="suspend(row.member)">停權</button>
                    <button type="button" class="danger" (click)="remove(row.member)">移除</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5"><app-empty-state title="尚無成員" /></td></tr>
            }
          </tbody>
        </table>
        @if (message) { <p class="notice">{{ message }}</p> }
      </section>
    }

    <app-form-modal [open]="modalOpen" title="新增社團成員" (save)="add()" (cancel)="modalOpen = false">
      <div class="member-selector wide">
        <label>搜尋使用者
          <input
            type="search"
            [ngModel]="search()"
            (ngModelChange)="search.set($event)"
            name="search"
            placeholder="輸入姓名或 Email"
          />
        </label>
        <label>指派職位
          <select name="targetRole" [(ngModel)]="targetRole">
            @for (role of roles; track role) { <option [value]="role">{{ role }}</option> }
          </select>
        </label>
        <div class="member-list">
          @for (user of filteredCandidates(); track user.id) {
            <label class="member-row">
              <input type="checkbox" [checked]="selectedIds.has(user.id)" (change)="toggle(user.id)" />
              <span class="avatar">{{ user.avatar }}</span>
              <span>{{ user.name }}</span>
              <span class="muted">{{ user.email }}</span>
            </label>
          } @empty {
            <p class="muted">沒有可加入的使用者</p>
          }
        </div>
        <p class="muted">已選擇 {{ selectedIds.size }} 人</p>
      </div>
    </app-form-modal>
  `,
})
export class OfficersAdminPage {
  readonly clubData = inject(ClubDataService);
  readonly userData = inject(UserDataService);
  readonly config = inject(AdminConfigService);
  readonly clubContext = inject(ClubContextService);
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];
  readonly search = signal('');
  readonly rows = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.clubData.clubMembers()
      .filter((member) => member.clubId === clubId)
      .map((member) => ({ member, user: this.userData.findUser(member.userId) }));
  });
  readonly candidates = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    const existing = new Set(
      this.clubData.clubMembers().filter((member) => member.clubId === clubId).map((member) => member.userId),
    );
    return this.userData.users().filter((user) => !existing.has(user.id));
  });
  readonly filteredCandidates = computed(() => {
    const keyword = this.search().trim().toLowerCase();
    return this.candidates().filter((user) => (
      !keyword || `${user.name} ${user.email}`.toLowerCase().includes(keyword)
    ));
  });

  message = '';
  modalOpen = false;
  targetRole: RoleInClub = 'Member';
  selectedIds = new Set<string>();

  openAdd(): void {
    this.search.set('');
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
    if (!clubId || this.selectedIds.size === 0) return;
    for (const userId of this.selectedIds) {
      this.clubData.addClubMember({
        userId,
        clubId,
        roleInClub: this.targetRole,
        status: 'active',
        joinedAt: new Date().toISOString(),
      });
    }
    this.message = `已加入 ${this.selectedIds.size} 位成員（${this.targetRole}）`;
    this.selectedIds.clear();
    this.modalOpen = false;
  }

  saveRole(member: ClubMember): void {
    this.clubData.updateClubMemberRole(member.id, member.roleInClub);
    this.message = `成員職位已更新為 ${member.roleInClub}。`;
  }

  suspend(member: ClubMember): void {
    this.clubData.suspendClubMember(member.id);
    this.message = '該成員已停權。';
  }

  remove(member: ClubMember): void {
    this.clubData.removeClubMember(member.id);
    this.message = '已將成員移出社團。';
  }
}

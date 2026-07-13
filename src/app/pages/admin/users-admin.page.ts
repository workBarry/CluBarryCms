import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AdminConfigService } from '../../services/admin-config.service';
import { ClubContextService } from '../../services/club-context.service';
import { ClubDataService } from '../../services/club-data.service';
import { UserDataService } from '../../services/user-data.service';
import { ClubMember, RoleInClub, User } from '../../types/admin.models';

interface MemberRow {
  member: ClubMember;
  user: User | undefined;
}

@Component({
  selector: 'app-users-admin-page',
  imports: [CommonModule, FormsModule, EmptyState, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Users" title="社員管理" />

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
                  <select [ngModel]="row.member.roleInClub" (ngModelChange)="saveRole(row.member, $event)">
                    @for (role of roles; track role) { <option [value]="role">{{ role }}</option> }
                  </select>
                </td>
                <td><app-status-badge [value]="row.member.status" /></td>
                <td class="actions">
                  @if (config.hasPermission('社員管理')) {
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
  `,
})
export class UsersAdminPage {
  readonly clubContext = inject(ClubContextService);
  readonly clubData = inject(ClubDataService);
  readonly userData = inject(UserDataService);
  readonly config = inject(AdminConfigService);
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];

  message = '';

  readonly rows = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.clubData.clubMembers()
      .filter((member) => member.clubId === clubId)
      .map((member) => ({ member, user: this.userData.findUser(member.userId) }));
  });

  saveRole(member: ClubMember, role: RoleInClub): void {
    this.clubData.updateClubMemberRole(member.id, role);
    this.message = `已將成員職位更新為 ${role}。`;
  }

  remove(member: ClubMember): void {
    this.clubData.removeClubMember(member.id);
    this.message = '已將成員移出社團。';
  }
}
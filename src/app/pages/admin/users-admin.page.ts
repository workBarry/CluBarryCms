import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AdminConfigService } from '../../services/admin-config.service';
import { AuthService } from '../../services/auth.service';
import { ClubContextService } from '../../services/club-context.service';
import { ClubDataService } from '../../services/club-data.service';
import { FirebaseService } from '../../services/firebase.service';
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
      @if (pendingRows().length > 0) {
        <section class="table-card pending-section">
          <div class="table-title">入社申請</div>
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>Email</th>
                <th>申請時間</th>
                <th>功能</th>
              </tr>
            </thead>
            <tbody>
              @for (row of pendingRows(); track row.member.id) {
                <tr>
                  <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
                  <td>{{ row.user?.email }}</td>
                  <td>{{ row.member.joinedAt | date:'yyyy/MM/dd HH:mm' }}</td>
                  <td class="actions">
                    @if (config.hasPermission('社員管理')) {
                      <button type="button" class="btn small primary" (click)="approve(row.member)">同意</button>
                      <button type="button" class="btn small danger" (click)="reject(row.member)">拒絕</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      }

      <section class="table-card">
        <div class="table-title">正式成員</div>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>Email</th>
              <th>社團內職位</th>
              <th>狀態</th>
              <th>審核人</th>
              <th>功能</th>
            </tr>
          </thead>
          <tbody>
            @for (row of activeRows(); track row.member.id) {
              <tr>
                <td><span class="avatar">{{ row.user?.avatar }}</span>{{ row.user?.name }}</td>
                <td>{{ row.user?.email }}</td>
                <td>
                  <select [ngModel]="row.member.roleInClub" (ngModelChange)="saveRole(row.member, $event)">
                    @for (role of roles; track role) { <option [value]="role">{{ role }}</option> }
                  </select>
                </td>
                <td><app-status-badge [value]="row.member.status" /></td>
                <td class="muted">{{ row.member.approvedBy || '-' }}</td>
                <td class="actions">
                  @if (config.hasPermission('社員管理')) {
                    <button type="button" class="danger" (click)="remove(row.member)">移除</button>
                  }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6"><app-empty-state title="尚無正式成員" /></td></tr>
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
  readonly firebase = inject(FirebaseService);
  readonly auth = inject(AuthService);
  readonly roles: RoleInClub[] = ['President', 'Officer', 'Member'];

  message = '';

  readonly pendingRows = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.clubData.clubMembers()
      .filter((member) => member.clubId === clubId && member.status === 'pending')
      .map((member) => ({ member, user: this.userData.findUser(member.userId) }));
  });

  readonly activeRows = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.clubData.clubMembers()
      .filter((member) => member.clubId === clubId && member.status !== 'pending')
      .map((member) => ({ member, user: this.userData.findUser(member.userId) }));
  });

  saveRole(member: ClubMember, role: RoleInClub): void {
    this.clubData.updateClubMemberRole(member.id, role);
    this.message = `已將成員職位更新為 ${role}。`;
  }

  approve(member: ClubMember): void {
    const approverName = this.auth.currentUser()?.name || '管理員';
    this.clubData.approveClubMember(member.id, approverName);
    const userName = this.userData.findUser(member.userId)?.name || '未知用戶';
    this.firebase.createNotification({
      userId: member.userId,
      title: '入社申請已通過',
      content: `你申請的社團已通過審核，歡迎加入！`,
      type: 'review',
    });
    this.message = `已同意 ${userName} 加入社團。`;
  }

  reject(member: ClubMember): void {
    const userName = this.userData.findUser(member.userId)?.name || '未知用戶';
    this.clubData.rejectClubMember(member.id);
    this.firebase.createNotification({
      userId: member.userId,
      title: '入社申請未通過',
      content: `你申請的社團未通過審核，如有疑問請聯繫社團幹部。`,
      type: 'review',
    });
    this.message = `已拒絕 ${userName} 的入社申請。`;
  }

  remove(member: ClubMember): void {
    this.clubData.removeClubMember(member.id);
    this.message = '已將成員移出社團。';
  }
}
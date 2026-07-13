import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormModal } from '../../components/forms/form-modal.component';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AuthService } from '../../services/auth.service';
import { ClubContextService } from '../../services/club-context.service';
import { EventDataService } from '../../services/event-data.service';
import { Announcement, AnnouncementStatus } from '../../types/admin.models';
import { statusLabel } from '../../utils';

@Component({
  selector: 'app-announcements-admin-page',
  imports: [CommonModule, FormsModule, FormModal, EmptyState, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Announcements" title="公告管理">
      <button class="btn primary" type="button" (click)="openCreate()">新增公告</button>
    </app-page-header>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>標題</th>
            <th>發布時間</th>
            <th>置頂</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          @for (item of announcements(); track item.id) {
            <tr>
              <td>
                <strong>{{ item.title }}</strong>
                <small>{{ item.content }}</small>
              </td>
              <td>{{ item.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
              <td>{{ item.isPinned ? '是' : '否' }}</td>
              <td><app-status-badge [value]="item.status" /></td>
              <td class="actions">
                <button type="button" (click)="openEdit(item)">修改</button>
                <button type="button" (click)="eventData.togglePinnedAnnouncement(item.id)">
                  {{ item.isPinned ? '取消置頂' : '置頂' }}
                </button>
                <button type="button" (click)="eventData.toggleAnnouncementStatus(item.id)">
                  {{ item.status === 'published' ? '轉為草稿' : '發布' }}
                </button>
                <button type="button" class="danger" (click)="eventData.deleteAnnouncement(item.id)">刪除</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="5"><app-empty-state title="尚無公告" description="可使用右上角按鈕新增公告。" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <app-form-modal
      [open]="modalOpen"
      [title]="draft.id ? '修改公告' : '新增公告'"
      (save)="save()"
      (cancel)="modalOpen = false"
    >
      <label class="wide">標題<input name="title" [(ngModel)]="draft.title" /></label>
      <label class="wide">內容<textarea name="content" [(ngModel)]="draft.content"></textarea></label>
      <label>附件網址<input name="attachmentUrl" [(ngModel)]="draft.attachmentUrl" /></label>
      <label>圖片<input name="cover" [(ngModel)]="draft.cover" /></label>
      <label>發布日期<input type="datetime-local" name="createdAt" [(ngModel)]="draft.createdAt" /></label>
      <label>狀態
        <select name="status" [(ngModel)]="draft.status">
          @for (item of statuses; track item) {
            <option [value]="item">{{ statusText(item) }}</option>
          }
        </select>
      </label>
      <label class="check"><input type="checkbox" name="isPinned" [(ngModel)]="draft.isPinned" />置頂</label>
    </app-form-modal>
  `,
})
export class AnnouncementsAdminPage {
  readonly eventData = inject(EventDataService);
  readonly clubContext = inject(ClubContextService);
  private readonly auth = inject(AuthService);
  readonly statuses: AnnouncementStatus[] = ['draft', 'published'];
  readonly announcements = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return clubId
      ? this.eventData.announcements().filter((announcement) => announcement.clubId === clubId)
      : this.eventData.announcements();
  });

  modalOpen = false;
  draft = this.blankAnnouncement();

  openCreate(): void {
    this.draft = this.blankAnnouncement();
    this.modalOpen = true;
  }

  openEdit(announcement: Announcement): void {
    this.draft = { ...announcement };
    this.modalOpen = true;
  }

  save(): void {
    if (!this.draft.title.trim()) return;
    this.eventData.upsertAnnouncement({ ...this.draft });
    this.modalOpen = false;
  }

  statusText(status: AnnouncementStatus): string {
    return statusLabel(status);
  }

  private blankAnnouncement(): Announcement {
    return {
      id: '',
      clubId: this.clubContext.selectedClubId() || null,
      title: '',
      content: '',
      attachmentUrl: '',
      cover: 'linear-gradient(135deg, #0f766e, #22c55e)',
      isPinned: false,
      status: 'draft',
      createdBy: this.auth.currentUser()?.id ?? '',
      createdAt: new Date().toISOString(),
    };
  }
}

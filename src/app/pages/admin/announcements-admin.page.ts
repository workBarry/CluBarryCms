import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { Announcement, AnnouncementStatus } from '../../types/admin.models';

@Component({
  selector: 'app-announcements-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Announcements</span>
        <h1>公告管理</h1>
      </div>
      <button class="btn primary" type="button" (click)="openCreate()">新增公告</button>
    </section>

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
          <tr *ngFor="let item of data.announcements()">
            <td>
              <strong>{{ item.title }}</strong>
              <small>{{ item.content }}</small>
            </td>
            <td>{{ item.createdAt | date:'yyyy/MM/dd HH:mm' }}</td>
            <td>{{ item.isPinned ? '是' : '否' }}</td>
            <td><span class="status">{{ item.status }}</span></td>
            <td class="actions">
              <button type="button" (click)="openEdit(item)">修改</button>
              <button type="button" (click)="data.togglePinnedAnnouncement(item.id)">{{ item.isPinned ? '取消置頂' : '置頂' }}</button>
              <button type="button" (click)="data.toggleAnnouncementStatus(item.id)">{{ item.status === 'published' ? '草稿' : '發布' }}</button>
              <button type="button" class="danger" (click)="data.deleteAnnouncement(item.id)">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section class="modal-backdrop" *ngIf="modalOpen">
      <form class="modal form-grid" (ngSubmit)="save()">
        <h2>{{ draft.id ? '修改公告' : '新增公告' }}</h2>
        <label class="wide">標題<input name="title" [(ngModel)]="draft.title" /></label>
        <label class="wide">內容<textarea name="content" [(ngModel)]="draft.content"></textarea></label>
        <label>附件<input name="attachment" placeholder="mock file url" /></label>
        <label>圖片<input name="cover" [(ngModel)]="draft.cover" /></label>
        <label>發布日期<input type="datetime-local" name="createdAt" [(ngModel)]="draft.createdAt" /></label>
        <label>狀態
          <select name="status" [(ngModel)]="draft.status">
            <option *ngFor="let item of statuses" [value]="item">{{ item }}</option>
          </select>
        </label>
        <label class="check"><input type="checkbox" name="isPinned" [(ngModel)]="draft.isPinned" />置頂</label>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="modalOpen = false">取消</button>
          <button class="btn primary" type="submit">儲存</button>
        </div>
      </form>
    </section>
  `,
})
export class AnnouncementsAdminPage {
  readonly data = inject(AdminDataService);
  readonly statuses: AnnouncementStatus[] = ['draft', 'published'];

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
    this.data.upsertAnnouncement({ ...this.draft });
    this.modalOpen = false;
  }

  private blankAnnouncement(): Announcement {
    return {
      id: '',
      title: '',
      content: '',
      cover: 'linear-gradient(135deg, #0f766e, #22c55e)',
      isPinned: false,
      status: 'draft',
      createdBy: '',
      createdAt: new Date().toISOString(),
    };
  }
}

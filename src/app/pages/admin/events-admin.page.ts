import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { Event, EventStatus } from '../../types/admin.models';

@Component({
  selector: 'app-events-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Events</span>
        <h1>活動管理</h1>
      </div>
      <button class="btn primary" type="button" (click)="openCreate()">新增活動</button>
    </section>

    <section class="toolbar">
      <input type="search" [(ngModel)]="keyword" placeholder="搜尋活動名稱、地點、分類" />
      <select [(ngModel)]="status">
        <option value="all">全部狀態</option>
        <option value="draft">草稿</option>
        <option value="published">已上架</option>
        <option value="closed">已截止</option>
        <option value="completed">已完成</option>
      </select>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>圖片</th>
            <th>名稱</th>
            <th>日期</th>
            <th>人數</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let event of filteredEvents">
            <td><span class="cover-chip" [style.background]="event.cover"></span></td>
            <td>
              <strong>{{ event.title }}</strong>
              <small>{{ event.category }} / {{ event.location }}</small>
            </td>
            <td>{{ event.startTime | date:'yyyy/MM/dd HH:mm' }}</td>
            <td>{{ event.currentCount }} / {{ event.capacity }}</td>
            <td><span class="status">{{ event.status }}</span></td>
            <td class="actions">
              <button type="button" (click)="openEdit(event)">修改</button>
              <button type="button" (click)="data.toggleEventStatus(event.id)">{{ event.status === 'published' ? '下架' : '上架' }}</button>
              <button type="button" (click)="viewRegistrations(event)">查看報名</button>
              <button type="button" class="danger" (click)="data.deleteEvent(event.id)">刪除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>

    <section class="modal-backdrop" *ngIf="modalOpen">
      <form class="modal form-grid" (ngSubmit)="save()">
        <h2>{{ draft.id ? '修改活動' : '新增活動' }}</h2>
        <label class="wide">標題<input name="title" [(ngModel)]="draft.title" /></label>
        <label class="wide">內容<textarea name="description" [(ngModel)]="draft.description"></textarea></label>
        <label>開始日期<input type="datetime-local" name="startTime" [(ngModel)]="draft.startTime" /></label>
        <label>結束日期<input type="datetime-local" name="endTime" [(ngModel)]="draft.endTime" /></label>
        <label>地點<input name="location" [(ngModel)]="draft.location" /></label>
        <label>封面<input name="cover" [(ngModel)]="draft.cover" /></label>
        <label>人數限制<input type="number" name="capacity" [(ngModel)]="draft.capacity" /></label>
        <label>報名截止<input type="datetime-local" name="deadline" [(ngModel)]="draft.deadline" /></label>
        <label>分類<input name="category" [(ngModel)]="draft.category" /></label>
        <label>Tag<input name="tags" [(ngModel)]="tagText" /></label>
        <label>狀態
          <select name="status" [(ngModel)]="draft.status">
            <option *ngFor="let item of statuses" [value]="item">{{ item }}</option>
          </select>
        </label>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="modalOpen = false">取消</button>
          <button class="btn primary" type="submit">儲存</button>
        </div>
      </form>
    </section>
  `,
})
export class EventsAdminPage {
  readonly data = inject(AdminDataService);
  readonly statuses: EventStatus[] = ['draft', 'published', 'closed', 'completed'];

  keyword = '';
  status = 'all';
  modalOpen = false;
  message = '';
  tagText = '';
  draft = this.blankEvent();

  get filteredEvents(): Event[] {
    const keyword = this.keyword.trim().toLowerCase();
    return this.data.events().filter((event) => {
      const matchKeyword = !keyword || `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(keyword);
      const matchStatus = this.status === 'all' || event.status === this.status;
      return matchKeyword && matchStatus;
    });
  }

  openCreate(): void {
    this.draft = this.blankEvent();
    this.tagText = '';
    this.modalOpen = true;
  }

  openEdit(event: Event): void {
    this.draft = { ...event, tags: [...event.tags] };
    this.tagText = event.tags.join(', ');
    this.modalOpen = true;
  }

  save(): void {
    this.data.upsertEvent({ ...this.draft, tags: this.tagText.split(',').map((tag) => tag.trim()).filter(Boolean) });
    this.modalOpen = false;
  }

  viewRegistrations(event: Event): void {
    const count = this.data.registrations().filter((item) => item.eventId === event.id).length;
    this.message = `${event.title} 目前有 ${count} 筆報名紀錄。`;
  }

  private blankEvent(): Event {
    return {
      id: '',
      title: '',
      cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: '',
      location: '',
      startTime: '',
      endTime: '',
      deadline: '',
      capacity: 30,
      currentCount: 0,
      category: '',
      tags: [],
      status: 'draft',
      createdBy: '',
      createdAt: new Date().toISOString(),
    };
  }
}

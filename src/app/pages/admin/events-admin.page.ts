import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchToolbar } from '../../components/common/search-toolbar.component';
import { FormModal } from '../../components/forms/form-modal.component';
import { ConfirmDialog } from '../../components/ui/confirm-dialog.component';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';
import { ClubContextService } from '../../services/club-context.service';
import { EventDataService } from '../../services/event-data.service';
import { CreateEventInput, Event, EventStatus } from '../../types/admin.models';
import { statusLabel } from '../../utils';

@Component({
  selector: 'app-events-admin-page',
  imports: [
    CommonModule,
    FormsModule,
    SearchToolbar,
    FormModal,
    ConfirmDialog,
    EmptyState,
    PageHeader,
    StatusBadge,
  ],
  template: `
    <app-page-header eyebrow="Events" title="活動管理">
      <button class="btn primary" type="button" (click)="openCreate()">新增活動</button>
    </app-page-header>

    <app-search-toolbar
      [keyword]="keyword()"
      (keywordChange)="keyword.set($event)"
      placeholder="搜尋活動名稱、地點、分類"
    >
      <select [ngModel]="status()" (ngModelChange)="status.set($event)">
        <option value="all">全部狀態</option>
        @for (item of statuses; track item) {
          <option [value]="item">{{ statusText(item) }}</option>
        }
      </select>
    </app-search-toolbar>

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
          @for (event of filteredEvents(); track event.id) {
            <tr>
              <td><span class="cover-chip" [style.background]="event.cover"></span></td>
              <td>
                <strong>{{ event.title }}</strong>
                <small>{{ event.category }} / {{ event.location }}</small>
              </td>
              <td>{{ event.startTime | date:'yyyy/MM/dd HH:mm' }}</td>
              <td>{{ event.currentCount }} / {{ event.capacity }}</td>
              <td><app-status-badge [value]="event.status" /></td>
              <td class="actions">
                <button type="button" (click)="openEdit(event)">修改</button>
                @if (event.status === 'draft') {
                  <button type="button" (click)="publish(event)">上架</button>
                }
                @if (event.status === 'published') {
                  <button type="button" (click)="close(event)">下架</button>
                }
                @if (event.status !== 'completed') {
                  <button type="button" (click)="complete(event)">結案</button>
                }
                <button type="button" (click)="viewRegistrations(event)">查看報名</button>
                <button type="button" class="danger" (click)="requestDelete(event)">刪除</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6"><app-empty-state title="沒有符合條件的活動" description="可調整篩選條件或新增活動。" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <app-form-modal
      [open]="modalOpen"
      [title]="editingEvent ? '修改活動' : '新增活動'"
      [saving]="saving()"
      [error]="formError()"
      (save)="save()"
      (cancel)="closeModal()"
    >
      <label class="wide">所屬社團
        <select name="clubId" [(ngModel)]="draft.clubId" [disabled]="!!editingEvent">
          <option value="">— 選擇社團 —</option>
          @for (club of activeClubs(); track club.id) {
            <option [value]="club.id">{{ club.name }}</option>
          }
        </select>
      </label>
      <label class="wide">標題<input name="title" [(ngModel)]="draft.title" /></label>
      <label class="wide">內容<textarea name="description" [(ngModel)]="draft.description"></textarea></label>
      <label>開始日期<input type="datetime-local" name="startTime" [(ngModel)]="draft.startTime" /></label>
      <label>結束日期<input type="datetime-local" name="endTime" [(ngModel)]="draft.endTime" /></label>
      <label>地點<input name="location" [(ngModel)]="draft.location" /></label>
      <label>封面<input name="cover" [(ngModel)]="draft.cover" /></label>
      <label>人數限制<input type="number" name="capacity" [(ngModel)]="draft.capacity" min="1" /></label>
      <label>報名截止<input type="datetime-local" name="deadline" [(ngModel)]="draft.deadline" /></label>
      <label>分類<input name="category" [(ngModel)]="draft.category" /></label>
      <label>Tag<input name="tags" [(ngModel)]="tagText" /></label>
    </app-form-modal>

    <app-confirm-dialog
      [open]="pendingDelete !== null"
      title="刪除活動"
      [message]="deleteError() || (pendingDelete ? '確定要刪除「' + pendingDelete.title + '」嗎？' : '')"
      [danger]="true"
      [confirmText]="deleteError() ? '關閉' : '刪除'"
      (confirmed)="confirmDelete()"
      (dismissed)="dismissDelete()"
    />
  `,
})
export class EventsAdminPage {
  readonly eventData = inject(EventDataService);
  readonly clubData = inject(ClubDataService);
  readonly clubContext = inject(ClubContextService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly statuses: EventStatus[] = ['draft', 'published', 'closed', 'completed'];
  readonly keyword = signal('');
  readonly status = signal<EventStatus | 'all'>('all');
  readonly activeClubs = computed(() => this.clubData.manageableClubs());
  readonly filteredEvents = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    const manageableIds = new Set(this.activeClubs().map((c) => c.id));
    const keyword = this.keyword().trim().toLowerCase();
    const status = this.status();
    return this.eventData.events().filter((event) => {
      if (clubId && event.clubId !== clubId) return false;
      if (!clubId && !this.auth.isAdmin && !manageableIds.has(event.clubId)) return false;
      const text = `${event.title} ${event.location} ${event.category}`.toLowerCase();
      return (!keyword || text.includes(keyword)) && (status === 'all' || event.status === status);
    });
  });

  modalOpen = false;
  pendingDelete: Event | null = null;
  editingEvent: Event | null = null;
  tagText = '';
  draft = this.blankEvent();
  saving = signal(false);
  formError = signal('');
  deleteError = signal('');

  openCreate(): void {
    this.editingEvent = null;
    this.draft = this.blankEvent();
    this.tagText = '';
    this.formError.set('');
    this.modalOpen = true;
  }

  openEdit(event: Event): void {
    this.editingEvent = event;
    this.draft = { ...event, tags: [...event.tags] };
    this.tagText = event.tags.join(', ');
    this.formError.set('');
    this.modalOpen = true;
  }

  async save(): Promise<void> {
    this.formError.set('');
    const input = this.buildInput();
    const validation = this.validate(input);
    if (validation) {
      this.formError.set(validation);
      return;
    }

    this.saving.set(true);
    try {
      if (this.editingEvent) {
        await this.eventData.updateEvent(this.editingEvent.id, input);
      } else {
        await this.eventData.createEvent(input as CreateEventInput, this.auth.currentUser()?.id ?? '');
      }
      this.modalOpen = false;
    } catch (e: unknown) {
      this.formError.set(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      this.saving.set(false);
    }
  }

  async publish(event: Event): Promise<void> {
    try {
      await this.eventData.publishEvent(event.id);
    } catch (e: unknown) {
      console.warn('Publish failed:', e);
    }
  }

  async close(event: Event): Promise<void> {
    try {
      await this.eventData.closeEvent(event.id);
    } catch (e: unknown) {
      console.warn('Close failed:', e);
    }
  }

  async complete(event: Event): Promise<void> {
    try {
      await this.eventData.completeEvent(event.id);
    } catch (e: unknown) {
      console.warn('Complete failed:', e);
    }
  }

  viewRegistrations(event: Event): void {
    void this.router.navigate(['/registrations'], { queryParams: { eventId: event.id } });
  }

  requestDelete(event: Event): void {
    this.deleteError.set('');
    this.pendingDelete = event;
  }

  async confirmDelete(): Promise<void> {
    if (!this.pendingDelete) return;
    try {
      await this.eventData.deleteEvent(this.pendingDelete.id);
      this.pendingDelete = null;
    } catch (e: unknown) {
      this.deleteError.set(e instanceof Error ? e.message : '刪除失敗');
    }
  }

  dismissDelete(): void {
    this.pendingDelete = null;
    this.deleteError.set('');
  }

  statusText(status: EventStatus): string {
    return statusLabel(status);
  }

  closeModal(): void {
    this.modalOpen = false;
    this.formError.set('');
  }

  private buildInput(): CreateEventInput & { status?: EventStatus } {
    const tags = this.tagText.split(',').map((tag) => tag.trim()).filter(Boolean);
    return {
      clubId: this.draft.clubId,
      title: this.draft.title,
      cover: this.draft.cover || 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: this.draft.description,
      agenda: this.draft.agenda,
      location: this.draft.location,
      startTime: this.draft.startTime,
      endTime: this.draft.endTime,
      deadline: this.draft.deadline,
      capacity: this.draft.capacity,
      category: this.draft.category,
      tags,
    };
  }

  private validate(input: CreateEventInput): string {
    if (!input.clubId) return '請選擇所屬社團';
    if (!input.title.trim()) return '請輸入活動名稱';
    if (!input.location.trim()) return '請輸入活動地點';
    if (!input.category.trim()) return '請輸入活動分類';
    if (!input.startTime) return '請選擇開始時間';
    if (!input.endTime) return '請選擇結束時間';
    if (!input.deadline) return '請選擇報名截止時間';

    const start = new Date(input.startTime);
    const end = new Date(input.endTime);

    if (end <= start) return '結束時間必須晚於開始時間';
    if (!Number.isFinite(input.capacity) || input.capacity < 1) return '人數限制必須大於 0';

    const club = this.clubData.clubs().find((c) => c.id === input.clubId);
    if (club && club.status !== 'active') return '所屬社團非 active 狀態，無法建立活動';

    return '';
  }

  private blankEvent(): Event {
    return {
      id: '',
      clubId: this.clubContext.selectedClubId(),
      title: '',
      cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: '',
      agenda: [],
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
      createdAt: '',
    };
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { ClubContextService } from '../../services/club-context.service';
import { EventDataService } from '../../services/event-data.service';
import { Session } from '../../types/admin.models';

@Component({
  selector: 'app-sessions-admin-page',
  imports: [CommonModule, FormsModule, EmptyState, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Sessions" title="場次管理" />

    <section class="toolbar">
      <select [ngModel]="selectedEventId()" (ngModelChange)="selectedEventId.set($event)">
        <option value="">全部活動</option>
        @for (event of filteredEvents(); track event.id) {
          <option [value]="event.id">{{ event.title }}</option>
        }
      </select>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>場次</th>
            <th>所屬活動</th>
            <th>時間</th>
            <th>名額</th>
            <th>開放非社員</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          @for (session of sessions(); track session.id) {
            <tr>
              <td><strong>{{ session.title }}</strong></td>
              <td>{{ eventTitle(session.eventId) }}</td>
              <td>{{ session.startTime | date: 'MM/dd HH:mm' }}</td>
              <td>{{ session.currentCount }} / {{ session.capacity }}</td>
              <td>
                <input
                  type="checkbox"
                  [checked]="session.openToNonMember"
                  (change)="setOpen(session, $any($event.target).checked)"
                />
              </td>
              <td><app-status-badge [value]="session.status" /></td>
              <td class="actions">
                @if (session.status !== 'completed') {
                  <button type="button" (click)="eventData.toggleSessionOpen(session.id)">
                    {{ session.status === 'open' ? '關閉報名' : '開放報名' }}
                  </button>
                }
                <button type="button" class="danger" (click)="eventData.removeSession(session.id)">刪除</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7"><app-empty-state title="尚無場次" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <section class="table-card form-card">
      <h2>新增場次</h2>
      <form class="form-grid" (ngSubmit)="create()">
        <label>活動
          <select name="eventId" [(ngModel)]="draft.eventId" required>
            <option value="">選擇活動</option>
            @for (event of filteredEvents(); track event.id) {
              <option [value]="event.id">{{ event.title }}</option>
            }
          </select>
        </label>
        <label>場次名稱<input name="title" [(ngModel)]="draft.title" required /></label>
        <label>開始時間<input type="datetime-local" name="startTime" [(ngModel)]="draft.startTime" required /></label>
        <label>結束時間<input type="datetime-local" name="endTime" [(ngModel)]="draft.endTime" required /></label>
        <label>地點<input name="location" [(ngModel)]="draft.location" /></label>
        <label>名額<input type="number" name="capacity" [(ngModel)]="draft.capacity" /></label>
        <label class="checkbox">
          <input type="checkbox" name="openToNonMember" [(ngModel)]="draft.openToNonMember" /> 開放非社員參加
        </label>
        <div class="modal-actions">
          <button class="btn primary" type="submit" [disabled]="!draft.eventId || !draft.title">建立場次</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .form-card { margin-top: 1rem; }
    .checkbox { display: flex; gap: 0.5rem; align-items: center; }
  `],
})
export class SessionsAdminPage {
  readonly eventData = inject(EventDataService);
  readonly clubContext = inject(ClubContextService);
  readonly selectedEventId = signal('');
  readonly filteredEvents = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.eventData.events().filter((event) => !clubId || event.clubId === clubId);
  });
  readonly sessions = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    const eventId = this.selectedEventId();
    return this.eventData.sessions().filter((session) => {
      if (clubId && session.clubId !== clubId) return false;
      return !eventId || session.eventId === eventId;
    });
  });

  draft: Partial<Session> = this.emptyDraft();

  eventTitle(eventId: string): string {
    return this.eventData.findEvent(eventId)?.title ?? '—';
  }

  create(): void {
    const event = this.eventData.findEvent(this.draft.eventId ?? '');
    const clubId = event?.clubId ?? this.clubContext.selectedClubId();
    if (!clubId || !this.draft.eventId || !this.draft.title) return;
    this.eventData.upsertSession({
      id: '',
      eventId: this.draft.eventId,
      clubId,
      title: this.draft.title.trim(),
      startTime: this.draft.startTime ?? '',
      endTime: this.draft.endTime ?? '',
      location: this.draft.location?.trim() ?? '',
      capacity: Number(this.draft.capacity) || 0,
      currentCount: 0,
      openToNonMember: !!this.draft.openToNonMember,
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    this.draft = this.emptyDraft();
  }

  setOpen(session: Session, openToNonMember: boolean): void {
    this.eventData.upsertSession({ ...session, openToNonMember });
  }

  private emptyDraft(): Partial<Session> {
    return {
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      capacity: 30,
      openToNonMember: false,
    };
  }
}

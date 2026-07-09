import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { ClubContextService } from '../../services/club-context.service';
import { Event, Session } from '../../types/admin.models';

@Component({
  selector: 'app-sessions-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title">
      <div>
        <span class="eyebrow">Sessions</span>
        <h1>場次管理</h1>
      </div>
    </section>

    <p class="notice" *ngIf="!clubContext.selectedClubId()">請先從右上角選擇社團。</p>

    <ng-container *ngIf="clubContext.selectedClubId()">
      <section class="toolbar">
        <select [(ngModel)]="selectedEventId">
          <option value="">全部活動</option>
          <option *ngFor="let ev of eventsOfClub" [value]="ev.id">{{ ev.title }}</option>
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
            <tr *ngFor="let s of sessions">
              <td><strong>{{ s.title }}</strong></td>
              <td>{{ eventTitle(s.eventId) }}</td>
              <td>{{ s.startTime | date: 'MM/dd HH:mm' }}</td>
              <td>{{ s.currentCount }} / {{ s.capacity }}</td>
              <td>
                <input type="checkbox" [checked]="s.openToNonMember" (change)="setOpen(s, $any($event.target).checked)" />
              </td>
              <td><span class="status">{{ s.status === 'open' ? '報名中' : s.status === 'closed' ? '已關閉' : '已結束' }}</span></td>
              <td class="actions">
                <button type="button" (click)="toggleOpen(s)">開關報名</button>
                <button type="button" class="danger" (click)="remove(s)">刪除</button>
              </td>
            </tr>
            <tr *ngIf="sessions.length === 0">
              <td colspan="7" class="empty">尚無場次</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="table-card form-card">
        <h2>新增場次</h2>
        <form class="form-grid" (ngSubmit)="create()">
          <label>活動
            <select name="eventId" [(ngModel)]="draft.eventId" required>
              <option value="">選擇活動</option>
              <option *ngFor="let ev of eventsOfClub" [value]="ev.id">{{ ev.title }}</option>
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
    </ng-container>
  `,
  styles: [`
    .notice { color: var(--muted); }
    .empty { text-align: center; color: var(--muted); padding: 1.5rem; }
    .form-card { margin-top: 1rem; }
    .checkbox { display: flex; gap: 0.5rem; align-items: center; }
  `],
})
export class SessionsAdminPage {
  readonly data = inject(AdminDataService);
  readonly clubContext = inject(ClubContextService);
  selectedEventId = '';

  draft: Partial<Session> = {
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: 30,
    openToNonMember: false,
  };

  get eventsOfClub(): Event[] {
    const clubId = this.clubContext.selectedClubId();
    return this.data.events().filter((e) => e.clubId === clubId);
  }

  get sessions(): Session[] {
    const clubId = this.clubContext.selectedClubId();
    return this.data.sessions().filter(
      (s) => s.clubId === clubId && (!this.selectedEventId || s.eventId === this.selectedEventId),
    );
  }

  eventTitle(eventId: string): string {
    return this.data.events().find((e) => e.id === eventId)?.title ?? '—';
  }

  create(): void {
    const clubId = this.clubContext.selectedClubId();
    if (!clubId || !this.draft.eventId || !this.draft.title) return;
    this.data.upsertSession({
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
    this.draft = { title: '', startTime: '', endTime: '', location: '', capacity: 30, openToNonMember: false };
  }

  setOpen(s: Session, value: boolean): void {
    this.data.upsertSession({ ...s, openToNonMember: value });
  }

  toggleOpen(s: Session): void {
    this.data.toggleSessionOpen(s.id);
  }

  remove(s: Session): void {
    this.data.removeSession(s.id);
  }
}

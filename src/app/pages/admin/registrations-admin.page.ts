import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SearchToolbar } from '../../components/common/search-toolbar.component';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { ClubContextService } from '../../services/club-context.service';
import { EventDataService } from '../../services/event-data.service';
import {
  RegistrationExportRow,
  RegistrationExportService,
} from '../../services/registration-export.service';
import { UserDataService } from '../../services/user-data.service';
import { Registration, RegistrationStatus, User, Event } from '../../types/admin.models';
import { statusLabel } from '../../utils';

interface RegistrationRow {
  registration: Registration;
  user?: User;
  event?: Event;
}

@Component({
  selector: 'app-registrations-admin-page',
  imports: [CommonModule, FormsModule, SearchToolbar, EmptyState, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Registrations" title="報名管理">
      <div class="export-actions">
        <button type="button" (click)="export('Excel')">Excel</button>
        <button type="button" (click)="export('CSV')">CSV</button>
        <button type="button" (click)="export('PDF')">PDF</button>
      </div>
    </app-page-header>

    <app-search-toolbar
      [keyword]="keyword()"
      (keywordChange)="keyword.set($event)"
      placeholder="搜尋姓名或活動"
    >
      <select [ngModel]="status()" (ngModelChange)="status.set($event)">
        <option value="all">全部狀態</option>
        @for (item of statuses; track item) {
          <option [value]="item">{{ statusText(item) }}</option>
        }
      </select>
      <select [ngModel]="eventId()" (ngModelChange)="eventId.set($event)">
        <option value="">全部活動</option>
        @for (event of availableEvents(); track event.id) {
          <option [value]="event.id">{{ event.title }}</option>
        }
      </select>
    </app-search-toolbar>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>姓名</th>
            <th>活動</th>
            <th>付款</th>
            <th>簽到</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.registration.id) {
            <tr>
              <td>{{ row.user?.name || '未知使用者' }}</td>
              <td>{{ row.event?.title || '未知活動' }}</td>
              <td><app-status-badge [value]="row.registration.paymentStatus" /></td>
              <td>{{ row.registration.checkIn ? '已簽到' : '未簽到' }}</td>
              <td><app-status-badge [value]="row.registration.status" /></td>
              <td class="actions">
                <button type="button" (click)="togglePaid(row.registration)">修改付款</button>
                <button type="button" (click)="toggleCheckIn(row.registration)">修改簽到</button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6"><app-empty-state title="沒有符合條件的報名資料" /></td>
            </tr>
          }
        </tbody>
      </table>
      @if (message) { <p class="notice">{{ message }}</p> }
    </section>
  `,
})
export class RegistrationsAdminPage {
  readonly eventData = inject(EventDataService);
  readonly clubContext = inject(ClubContextService);
  private readonly userData = inject(UserDataService);
  private readonly exporter = inject(RegistrationExportService);
  private readonly route = inject(ActivatedRoute);

  readonly statuses: RegistrationStatus[] = ['registered', 'cancelled', 'completed', 'waitlisted'];
  readonly keyword = signal('');
  readonly status = signal<RegistrationStatus | 'all'>('all');
  readonly eventId = signal(this.route.snapshot.queryParamMap.get('eventId') ?? '');
  readonly availableEvents = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.eventData.events().filter((event) => !clubId || event.clubId === clubId);
  });
  readonly rows = computed<RegistrationRow[]>(() => {
    const clubId = this.clubContext.selectedClubId();
    const keyword = this.keyword().trim().toLowerCase();
    const status = this.status();
    const eventId = this.eventId();
    return this.eventData.registrations()
      .filter((registration) => !clubId || registration.clubId === clubId)
      .filter((registration) => !eventId || registration.eventId === eventId)
      .map((registration) => ({
        registration,
        user: this.userData.findUser(registration.userId),
        event: this.eventData.findEvent(registration.eventId),
      }))
      .filter((row) => {
        const text = `${row.user?.name ?? ''} ${row.event?.title ?? ''}`.toLowerCase();
        return (!keyword || text.includes(keyword))
          && (status === 'all' || row.registration.status === status);
      });
  });

  message = '';

  togglePaid(registration: Registration): void {
    const paymentStatus = registration.paymentStatus === 'paid' ? 'unpaid' : 'paid';
    this.eventData.updateRegistration(registration.id, { paymentStatus });
  }

  toggleCheckIn(registration: Registration): void {
    this.eventData.updateRegistration(registration.id, { checkIn: !registration.checkIn });
  }

  export(type: 'Excel' | 'CSV' | 'PDF'): void {
    const rows = this.exportRows();
    if (type === 'Excel') this.exporter.exportExcel(rows);
    if (type === 'CSV') this.exporter.exportCsv(rows);
    if (type === 'PDF') {
      const opened = this.exporter.printPdf(rows);
      this.message = opened ? '已開啟列印視窗，可選擇另存為 PDF。' : '瀏覽器已阻擋列印視窗。';
      return;
    }
    this.message = `已匯出 ${rows.length} 筆 ${type} 報名資料。`;
  }

  statusText(status: RegistrationStatus): string {
    return statusLabel(status);
  }

  private exportRows(): RegistrationExportRow[] {
    return this.rows().map((row) => ({
      name: row.user?.name ?? '未知使用者',
      event: row.event?.title ?? '未知活動',
      paymentStatus: statusLabel(row.registration.paymentStatus),
      checkIn: row.registration.checkIn ? '已簽到' : '未簽到',
      status: statusLabel(row.registration.status),
    }));
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { ClubContextService } from '../../services/club-context.service';
import { ClubDataService } from '../../services/club-data.service';
import { EventDataService } from '../../services/event-data.service';
import { Event } from '../../types/admin.models';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Dashboard" title="營運總覽" />

    @if (!clubContext.selectedClubId()) {
      <p class="notice">請先從右上角選擇社團。</p>
    } @else {
      <section class="stat-grid">
        @for (card of statCards(); track card.label) {
          <article class="stat-card">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <small>{{ card.note }}</small>
          </article>
        }
      </section>

      <section class="grid two">
        <article class="panel">
          <div class="panel-heading">
            <h2>社員成長</h2>
            <span>近 4 月累計</span>
          </div>
          <div class="bar-chart">
            @for (item of memberGrowth(); track item.key) {
              <div>
                <span>{{ item.month }}</span>
                <i [style.height.%]="item.value"></i>
                <strong>{{ item.count }}</strong>
              </div>
            }
          </div>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <h2>活動報名率</h2>
            <span>依活動</span>
          </div>
          <div class="progress-list">
            @for (event of filteredEvents(); track event.id) {
              <div>
                <span>{{ event.title }}</span>
                <strong>{{ event.currentCount }} / {{ event.capacity }}</strong>
                <i><b [style.width.%]="registrationRate(event)"></b></i>
              </div>
            }
          </div>
        </article>
      </section>

      <section class="grid two">
        <article class="panel">
          <div class="panel-heading">
            <h2>最近活動</h2>
            <span>活動 / 日期 / 目前人數</span>
          </div>
          @for (event of filteredEvents().slice(0, 4); track event.id) {
            <div class="compact-row">
              <strong>{{ event.title }}</strong>
              <span>{{ event.startTime | date:'MM/dd HH:mm' }}</span>
              <span>{{ event.currentCount }}</span>
            </div>
          }
        </article>

        <article class="panel">
          <div class="panel-heading">
            <h2>最近公告</h2>
            <span>標題 / 發布時間</span>
          </div>
          @for (announcement of filteredAnnouncements().slice(0, 4); track announcement.id) {
            <div class="compact-row">
              <strong>{{ announcement.title }}</strong>
              <span>{{ announcement.createdAt | date:'MM/dd HH:mm' }}</span>
              <app-status-badge [value]="announcement.status" />
            </div>
          }
        </article>
      </section>
    }
  `,
})
export class DashboardPage {
  readonly clubContext = inject(ClubContextService);
  readonly clubData = inject(ClubDataService);
  readonly eventData = inject(EventDataService);

  readonly filteredEvents = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.eventData.events().filter((e) => e.clubId === clubId);
  });

  readonly filteredAnnouncements = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.eventData.announcements().filter((a) => a.clubId === clubId);
  });

  readonly filteredRegistrations = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.eventData.registrations().filter((r) => r.clubId === clubId);
  });

  readonly clubMembers = computed(() => {
    const clubId = this.clubContext.selectedClubId();
    return this.clubData.clubMembers().filter((m) => m.clubId === clubId);
  });

  readonly statCards = computed(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const registrationsThisMonth = this.filteredRegistrations().filter((registration) => (
      new Date(registration.createdAt).getTime() >= monthStart.getTime()
    )).length;
    return [
      { label: '社員', value: this.clubMembers().length, note: '含待審核社員' },
      { label: '活動', value: this.filteredEvents().length, note: '草稿與上架' },
      { label: '公告', value: this.filteredAnnouncements().length, note: '草稿與發布' },
      { label: '本月報名', value: registrationsThisMonth, note: '報名紀錄' },
    ];
  });

  readonly memberGrowth = computed(() => {
    const members = this.clubMembers();
    const now = new Date();
    const months = Array.from({ length: 4 }, (_, index) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 3 + index, 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
      const count = members.filter((m) => {
        const joinedAt = new Date(m.joinedAt).getTime();
        return Number.isFinite(joinedAt) && joinedAt < end.getTime();
      }).length;
      return {
        key: `${start.getFullYear()}-${start.getMonth()}`,
        month: `${start.getMonth() + 1}月`,
        count,
        value: 0,
      };
    });
    const max = Math.max(...months.map((item) => item.count), 1);
    return months.map((item) => ({ ...item, value: item.count / max * 100 }));
  });

  registrationRate(event: Event): number {
    if (event.capacity <= 0) return 0;
    return Math.min(event.currentCount / event.capacity * 100, 100);
  }
}

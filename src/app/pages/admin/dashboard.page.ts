import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  template: `
    <section class="page-title">
      <span class="eyebrow">Dashboard</span>
      <h1>營運總覽</h1>
    </section>

    <section class="stat-grid">
      <article class="stat-card" *ngFor="let card of statCards">
        <span>{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
        <small>{{ card.note }}</small>
      </article>
    </section>

    <section class="grid two">
      <article class="panel">
        <div class="panel-heading">
          <h2>社員成長</h2>
          <span>近 4 月</span>
        </div>
        <div class="bar-chart">
          <div *ngFor="let item of memberGrowth">
            <span>{{ item.month }}</span>
            <i [style.height.%]="item.value"></i>
            <strong>{{ item.count }}</strong>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <h2>活動報名率</h2>
          <span>依活動</span>
        </div>
        <div class="progress-list">
          <div *ngFor="let event of data.events()">
            <span>{{ event.title }}</span>
            <strong>{{ event.currentCount }} / {{ event.capacity }}</strong>
            <i><b [style.width.%]="event.currentCount / event.capacity * 100"></b></i>
          </div>
        </div>
      </article>
    </section>

    <section class="grid two">
      <article class="panel">
        <div class="panel-heading">
          <h2>最近活動</h2>
          <span>活動 / 日期 / 目前人數</span>
        </div>
        <div class="compact-row" *ngFor="let event of data.events().slice(0, 4)">
          <strong>{{ event.title }}</strong>
          <span>{{ event.startTime | date:'MM/dd HH:mm' }}</span>
          <span>{{ event.currentCount }}</span>
        </div>
      </article>

      <article class="panel">
        <div class="panel-heading">
          <h2>最近公告</h2>
          <span>標題 / 發布時間</span>
        </div>
        <div class="compact-row" *ngFor="let announcement of data.announcements().slice(0, 4)">
          <strong>{{ announcement.title }}</strong>
          <span>{{ announcement.createdAt | date:'MM/dd HH:mm' }}</span>
          <span>{{ announcement.status }}</span>
        </div>
      </article>
    </section>
  `,
})
export class DashboardPage {
  readonly data = inject(AdminDataService);

  get statCards() {
    return [
      { label: '社員', value: this.data.users().length, note: '含待審核社員' },
      { label: '活動', value: this.data.events().length, note: '草稿與上架' },
      { label: '公告', value: this.data.announcements().length, note: '草稿與發布' },
      { label: '本月報名', value: this.data.registrations().length, note: '報名紀錄' },
    ];
  }

  readonly memberGrowth = [
    { month: '3月', count: 42, value: 42 },
    { month: '4月', count: 58, value: 58 },
    { month: '5月', count: 73, value: 73 },
    { month: '6月', count: 91, value: 91 },
  ];
}

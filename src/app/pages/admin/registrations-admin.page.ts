import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-registrations-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Registrations</span>
        <h1>報名管理</h1>
      </div>
      <div class="export-actions">
        <button type="button" (click)="export('Excel')">Excel</button>
        <button type="button" (click)="export('CSV')">CSV</button>
        <button type="button" (click)="export('PDF')">PDF</button>
      </div>
    </section>

    <section class="toolbar">
      <input type="search" [(ngModel)]="keyword" placeholder="搜尋姓名或活動" />
      <select [(ngModel)]="status">
        <option value="all">全部狀態</option>
        <option value="registered">已報名</option>
        <option value="cancelled">已取消</option>
        <option value="completed">已完成</option>
        <option value="waitlisted">候補</option>
      </select>
    </section>

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
          <tr *ngFor="let row of rows">
            <td>{{ row.user?.name }}</td>
            <td>{{ row.event?.title }}</td>
            <td><span class="status">{{ row.registration.paymentStatus }}</span></td>
            <td>{{ row.registration.checkIn ? '已簽到' : '未簽到' }}</td>
            <td><span class="status">{{ row.registration.status }}</span></td>
            <td class="actions">
              <button type="button" (click)="togglePaid(row.registration.id, row.registration.paymentStatus)">修改付款</button>
              <button type="button" (click)="toggleCheckIn(row.registration.id, row.registration.checkIn)">修改簽到</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </section>
  `,
})
export class RegistrationsAdminPage {
  readonly data = inject(AdminDataService);

  keyword = '';
  status = 'all';
  message = '';

  get rows() {
    const keyword = this.keyword.trim().toLowerCase();
    return this.data
      .registrations()
      .map((registration) => ({
        registration,
        user: this.data.findUser(registration.userId),
        event: this.data.findEvent(registration.eventId),
      }))
      .filter((row) => {
        const matchKeyword = !keyword || `${row.user?.name ?? ''} ${row.event?.title ?? ''}`.toLowerCase().includes(keyword);
        const matchStatus = this.status === 'all' || row.registration.status === this.status;
        return matchKeyword && matchStatus;
      });
  }

  togglePaid(id: string, current: string): void {
    this.data.updateRegistration(id, { paymentStatus: current === 'paid' ? 'unpaid' : 'paid' });
  }

  toggleCheckIn(id: string, current: boolean): void {
    this.data.updateRegistration(id, { checkIn: !current });
  }

  export(type: string): void {
    this.message = `${type} 匯出入口已建立，後續可串接後端報表 API。`;
  }
}

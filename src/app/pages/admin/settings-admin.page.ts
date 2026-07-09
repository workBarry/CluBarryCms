import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-settings-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title">
      <span class="eyebrow">Settings</span>
      <h1>系統設定</h1>
    </section>

    <form class="panel settings-form" (ngSubmit)="save()">
      <label>社團Logo<input name="logo" [(ngModel)]="form.logo" /></label>
      <label>社團名稱<input name="clubName" [(ngModel)]="form.clubName" /></label>
      <label>Email<input type="email" name="email" [(ngModel)]="form.email" /></label>
      <label>電話<input name="phone" [(ngModel)]="form.phone" /></label>
      <label>FB<input name="fb" [(ngModel)]="form.fb" /></label>
      <label>IG<input name="ig" [(ngModel)]="form.ig" /></label>
      <label>Discord<input name="discord" [(ngModel)]="form.discord" /></label>
      <label>招生網址<input name="recruitmentUrl" [(ngModel)]="form.recruitmentUrl" /></label>
      <button class="btn primary" type="submit">儲存設定</button>
      <p class="notice" *ngIf="message">{{ message }}</p>
    </form>
  `,
})
export class SettingsAdminPage {
  private readonly data = inject(AdminDataService);

  form = { ...this.data.settings() };
  message = '';

  save(): void {
    this.data.updateSettings({ ...this.form });
    this.message = '系統設定已更新。';
  }
}

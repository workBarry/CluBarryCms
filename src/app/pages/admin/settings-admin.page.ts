import { CommonModule } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../components/ui/page-header.component';
import { AdminConfigService } from '../../services/admin-config.service';

@Component({
  selector: 'app-settings-admin-page',
  imports: [CommonModule, FormsModule, PageHeader],
  template: `
    <app-page-header eyebrow="Settings" title="系統設定" />

    <form class="panel settings-form" (ngSubmit)="save()">
      <label>社團 Logo 網址<input type="url" name="logo" [(ngModel)]="form.logo" /></label>
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
  private readonly config = inject(AdminConfigService);

  form = { ...this.config.settings() };
  message = '';

  constructor() {
    effect(() => {
      this.form = { ...this.config.settings() };
    });
  }

  save(): void {
    this.config.updateSettings({ ...this.form });
    this.message = '系統設定已更新。';
  }
}

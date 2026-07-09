import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Spinner } from '../../components/ui/spinner.component';

@Component({
  selector: 'app-admin-login-page',
  imports: [CommonModule, FormsModule, Spinner],
  template: `
    <section class="login-panel">
      <div>
        <span class="eyebrow">Back Office</span>
        <h1>管理後台登入</h1>
        <p>登入後可管理社員、活動、公告、報名、幹部、權限與系統設定。</p>
        <div class="mock-hint">
          <strong>測試帳號</strong>
          @for (account of mockAccounts; track account) {
            <span>{{ account }}</span>
          }
        </div>
      </div>
      <form class="form-card" (ngSubmit)="submit()">
        <label>Email<input type="email" name="email" [(ngModel)]="email" /></label>
        <label>Password<input type="password" name="password" [(ngModel)]="password" /></label>
        <button class="btn primary" type="submit" [disabled]="auth.loading()">{{ auth.loading() ? '登入中...' : '登入' }}</button>
        <p class="notice" *ngIf="auth.error()">{{ auth.error() }}</p>
        <app-spinner *ngIf="auth.loading()" text="驗證中..." />
      </form>
    </section>
  `,
  styles: [
    `
      .mock-hint {
        display: grid;
        gap: 0.25rem;
        margin-top: 1rem;
        padding: 0.75rem;
        border: 1px dashed #d9e2de;
        border-radius: 0.55rem;
        background: #f8faf9;
        font-size: 0.82rem;
        color: #66756f;
      }
      .mock-hint strong { color: #0f766e; }
    `,
  ],
})
export class AdminLoginPage {
  readonly auth = inject(AuthService);
  email = 'kevin@example.com';
  password = 'password';

  readonly mockAccounts = [
    'kevin&#64;example.com / password (Admin)',
    'peter&#64;example.com / password (Vice President)',
    'amy&#64;example.com / password (Activity Leader)',
  ];

  async submit(): Promise<void> {
    await this.auth.login(this.email, this.password);
  }
}

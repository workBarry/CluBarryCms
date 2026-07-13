import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Spinner } from '../../components/ui/spinner.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login-page',
  imports: [CommonModule, FormsModule, Spinner],
  template: `
    <section class="login-panel">
      <div>
        <span class="eyebrow">Back Office</span>
        <h1>管理後台登入</h1>
        <p>登入後可管理社員、活動、公告、報名、幹部、權限與系統設定。</p>
      </div>
      <form class="form-card" (ngSubmit)="submit()">
        <label>Email
          <input type="email" name="email" [(ngModel)]="email" autocomplete="email" required />
        </label>
        <label>Password
          <input
            type="password"
            name="password"
            [(ngModel)]="password"
            autocomplete="current-password"
            required
          />
        </label>
        <button class="btn primary" type="submit" [disabled]="auth.loading() || !email || !password">
          {{ auth.loading() ? '登入中...' : '登入' }}
        </button>
        <p class="notice" *ngIf="auth.error()">{{ auth.error() }}</p>
        <app-spinner *ngIf="auth.loading()" text="驗證中..." />
      </form>
    </section>
  `,
})
export class AdminLoginPage {
  readonly auth = inject(AuthService);
  email = '';
  password = '';

  async submit(): Promise<void> {
    await this.auth.login(this.email.trim(), this.password);
  }
}

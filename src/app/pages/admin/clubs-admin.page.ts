import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { AuthService } from '../../services/auth.service';
import { ClubContextService } from '../../services/club-context.service';
import { Club, ClubStatus } from '../../types/admin.models';

@Component({
  selector: 'app-clubs-admin-page',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">Clubs</span>
        <h1>社團管理</h1>
      </div>
      <button class="btn primary" type="button" *ngIf="auth.isAdmin" (click)="openCreate()">新增社團</button>
    </section>

    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th>社團</th>
            <th>分類</th>
            <th>狀態</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let club of manageableClubs; trackBy: trackByClubId">
            <td>
              <strong>{{ club.name }}</strong>
              <div class="muted">{{ club.description }}</div>
            </td>
            <td>{{ club.category }}</td>
            <td><span class="status">{{ statusLabel(club.status) }}</span></td>
            <td class="actions">
              <button type="button" (click)="enter(club)">進入管理</button>
              <button type="button" *ngIf="auth.isAdmin && club.status === 'pending'" (click)="setStatus(club, 'active')">審核通過</button>
              <button type="button" *ngIf="auth.isAdmin && club.status !== 'closed'" (click)="setStatus(club, 'closed')">關閉</button>
            </td>
          </tr>
          <tr *ngIf="manageableClubs.length === 0">
            <td colspan="4" class="empty">尚無可管理的社團</td>
          </tr>
        </tbody>
      </table>
    </section>

    <p class="notice" *ngIf="message">{{ message }}</p>

    <section class="modal-backdrop" *ngIf="creating">
      <form class="modal form-grid" (ngSubmit)="create()">
        <h2>新增社團</h2>
        <label>名稱<input name="name" [(ngModel)]="draft.name" required /></label>
        <label>分類<input name="category" [(ngModel)]="draft.category" /></label>
        <label>簡介<textarea name="description" [(ngModel)]="draft.description"></textarea></label>
        <p class="notice" *ngIf="error">{{ error }}</p>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="creating = false; error = ''">取消</button>
          <button class="btn primary" type="submit">建立（待審核）</button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .muted { color: var(--muted); font-size: 0.8rem; }
    .empty { text-align: center; color: var(--muted); padding: 1.5rem; }
  `],
})
export class ClubsAdminPage {
  readonly data = inject(AdminDataService);
  readonly auth = inject(AuthService);
  readonly clubContext = inject(ClubContextService);
  private readonly router = inject(Router);

  creating = false;
  message = '';
  error = '';
  draft: Partial<Club> = { name: '', category: '', description: '' };

  get manageableClubs(): Club[] {
    const all = this.data.clubs();
    // 去重：避免同 id 重複
    const unique = new Map<string, Club>();
    for (const club of all) {
      if (!unique.has(club.id)) unique.set(club.id, club);
    }
    const deduped = Array.from(unique.values());

    if (this.auth.isAdmin) return deduped;
    const myIds = new Set(
      this.data.clubMembers()
        .filter((m) => m.userId === this.auth.currentUser()?.id && m.roleInClub !== 'Member' && m.status === 'active')
        .map((m) => m.clubId),
    );
    return deduped.filter((c) => myIds.has(c.id));
  }

  statusLabel(status: ClubStatus): string {
    return { pending: '待審核', active: '啟用', closed: '已關閉' }[status];
  }

  openCreate(): void {
    this.draft = { name: '', category: '', description: '' };
    this.creating = true;
  }

  create(): void {
    const name = this.draft.name?.trim();
    if (!name) return;
    const exists = this.data.clubs().some((c) => c.name === name);
    if (exists) {
      this.error = `社團「${name}」已存在`;
      return;
    }
    const uid = this.auth.currentUser()?.id ?? 'system';
    this.data.upsertClub({
      name,
      logo: name.trim().charAt(0),
      cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: this.draft.description?.trim() ?? '',
      category: this.draft.category?.trim() ?? '',
      tags: [],
      status: 'pending',
      createdBy: uid,
      createdAt: new Date().toISOString(),
    });
    this.creating = false;
    this.error = '';
  }

  setStatus(club: Club, status: ClubStatus): void {
    if (!club.id) return;
    this.data.updateClubStatus(club.id, status);
  }

  enter(club: Club): void {
    this.clubContext.selectClub(club.id);
    this.router.navigate(['/dashboard']);
  }

  trackByClubId(index: number, club: Club): string {
    return club.id;
  }
}

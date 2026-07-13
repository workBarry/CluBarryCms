import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormModal } from '../../components/forms/form-modal.component';
import { ConfirmDialog } from '../../components/ui/confirm-dialog.component';
import { EmptyState } from '../../components/ui/empty-state.component';
import { PageHeader } from '../../components/ui/page-header.component';
import { StatusBadge } from '../../components/ui/status-badge.component';
import { AuthService } from '../../services/auth.service';
import { ClubDataService } from '../../services/club-data.service';
import { ClubContextService } from '../../services/club-context.service';
import { Club, ClubStatus } from '../../types/admin.models';

@Component({
  selector: 'app-clubs-admin-page',
  imports: [CommonModule, FormsModule, FormModal, ConfirmDialog, EmptyState, PageHeader, StatusBadge],
  template: `
    <app-page-header eyebrow="Clubs" title="社團管理">
      @if (auth.isAdmin) {
        <button class="btn primary" type="button" (click)="openCreate()">新增社團</button>
      }
    </app-page-header>

    <nav class="tab-bar">
      <button [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">所有社團</button>
      <button [class.active]="activeTab() === 'closed'" (click)="activeTab.set('closed')">已截止</button>
    </nav>

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
          @for (club of displayedClubs(); track club.id) {
            <tr>
              <td>
                <strong>{{ club.name }}</strong>
                <div class="muted">{{ club.description }}</div>
              </td>
              <td>{{ club.category }}</td>
              <td><app-status-badge [value]="club.status" /></td>
              <td class="actions">
                @if (club.status !== 'closed') {
                  <button type="button" (click)="enter(club)">進入管理</button>
                  @if (auth.isAdmin && club.status === 'pending') {
                    <button type="button" (click)="setStatus(club, 'active')">審核通過</button>
                  }
                  @if (auth.isAdmin) {
                    <button type="button" (click)="setStatus(club, 'closed')">關閉</button>
                  }
                } @else {
                  <button type="button" (click)="setStatus(club, 'active')">重新建立</button>
                  @if (auth.isAdmin) {
                    <button type="button" class="danger" (click)="pendingDelete = club">刪除</button>
                  }
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="4"><app-empty-state title="尚無社團" /></td>
            </tr>
          }
        </tbody>
      </table>
    </section>

    <app-form-modal [open]="creating" title="新增社團" (save)="create()" (cancel)="cancelCreate()">
      <label>名稱<input name="name" [(ngModel)]="draft.name" required /></label>
      <label>分類<input name="category" [(ngModel)]="draft.category" /></label>
      <label class="wide">簡介<textarea name="description" [(ngModel)]="draft.description"></textarea></label>
      @if (error) { <p class="notice wide">{{ error }}</p> }
    </app-form-modal>

    <app-confirm-dialog
      [open]="pendingDelete !== null"
      title="刪除社團"
      [message]="pendingDelete ? '確定要刪除「' + pendingDelete.name + '」嗎？此操作無法復原。' : ''"
      confirmText="刪除"
      [danger]="true"
      (confirmed)="confirmDelete()"
      (dismissed)="pendingDelete = null"
    />
  `,
  styles: [`
    .muted { color: var(--muted); font-size: 0.8rem; }
    .tab-bar { display: flex; gap: 0; margin-bottom: 1rem; border-bottom: 1px solid var(--line); }
    .tab-bar button {
      padding: 0.5rem 1rem; background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; color: var(--muted); font-size: 0.9rem;
    }
    .tab-bar button.active { color: var(--text); border-bottom-color: var(--primary); }
  `],
})
export class ClubsAdminPage {
  readonly clubData = inject(ClubDataService);
  readonly auth = inject(AuthService);
  readonly clubContext = inject(ClubContextService);
  private readonly router = inject(Router);

  readonly activeTab = signal<'all' | 'closed'>('all');

  readonly displayedClubs = computed(() =>
    this.activeTab() === 'closed'
      ? this.clubData.clubs().filter((club) => club.status === 'closed')
      : this.clubData.manageableClubs(),
  );

  creating = false;
  error = '';
  draft: Partial<Club> = { name: '', category: '', description: '' };
  pendingDelete: Club | null = null;

  openCreate(): void {
    this.draft = { name: '', category: '', description: '' };
    this.error = '';
    this.creating = true;
  }

  cancelCreate(): void {
    this.creating = false;
    this.error = '';
  }

  create(): void {
    const name = this.draft.name?.trim();
    if (!name) return;
    if (this.clubData.clubs().some((club) => club.name === name)) {
      this.error = `社團「${name}」已存在`;
      return;
    }
    this.clubData.upsertClub({
      name,
      logo: '',
      cover: 'linear-gradient(135deg, #2563eb, #14b8a6)',
      description: this.draft.description?.trim() ?? '',
      category: this.draft.category?.trim() ?? '',
      tags: [],
      status: 'pending',
      createdBy: this.auth.currentUser()?.id ?? '',
      createdAt: new Date().toISOString(),
    });
    this.creating = false;
  }

  setStatus(club: Club, status: ClubStatus): void {
    this.clubData.updateClubStatus(club.id, status);
  }

  confirmDelete(): void {
    if (this.pendingDelete) {
      this.clubData.removeClub(this.pendingDelete.id);
      this.pendingDelete = null;
    }
  }

  enter(club: Club): void {
    this.clubContext.selectClub(club.id);
    void this.router.navigate(['/dashboard']);
  }
}

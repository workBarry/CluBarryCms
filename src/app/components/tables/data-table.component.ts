import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { totalPages } from '../../utils';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="table-card">
      <table>
        <thead>
          <tr>
            <th *ngFor="let col of columns" [style.width]="col.width">
              {{ col.label }}
              <button *ngIf="col.sortable" class="sort-btn" type="button" (click)="toggleSort(col.key)">
                {{ sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}
              </button>
            </th>
            <th *ngIf="actions" style="width:1px">功能</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of data">
            <td *ngFor="let col of columns">
              <ng-container *ngIf="cellTpl; else plain">
                <ng-container *ngTemplateOutlet="cellTpl; context: { $implicit: row, col: col }"></ng-container>
              </ng-container>
              <ng-template #plain>{{ row[col.key] }}</ng-template>
            </td>
            <td class="actions" *ngIf="actions">
              <ng-container *ngTemplateOutlet="actions; context: { $implicit: row }"></ng-container>
            </td>
          </tr>
          <tr *ngIf="data.length === 0">
            <td class="empty-row" [attr.colspan]="columns.length + (actions ? 1 : 0)">無資料</td>
          </tr>
        </tbody>
      </table>
      <div class="pagination" *ngIf="pageable">
        <span>共 {{ total }} 筆</span>
        <button type="button" (click)="pageChange.emit(page - 1)" [disabled]="page <= 1">上一頁</button>
        <span>{{ page }} / {{ maxPages }}</span>
        <button type="button" (click)="pageChange.emit(page + 1)" [disabled]="page >= maxPages">下一頁</button>
      </div>
    </section>
  `,
  styles: [
    `
      .table-card {
        overflow: auto;
        border: 1px solid #d9e2de;
        border-radius: 0.8rem;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      }
      table { width: 100%; min-width: 600px; border-collapse: collapse; }
      th, td { padding: 0.9rem 1rem; border-bottom: 1px solid #d9e2de; text-align: left; vertical-align: middle; }
      th { color: #66756f; background: #f8faf9; font-size: 0.82rem; white-space: nowrap; }
      td strong, td small { display: block; }
      .actions { display: flex; flex-wrap: wrap; gap: 0.45rem; white-space: nowrap; }
      .empty-row { text-align: center; color: #66756f; padding: 2rem; }
      .sort-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #66756f;
        font-size: 0.7rem;
        padding: 0 0.2rem;
      }
      .pagination {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1rem;
      }
      .pagination button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 2.35rem;
        border: 1px solid #d9e2de;
        border-radius: 0.55rem;
        padding: 0 0.85rem;
        color: #17211d;
        background: #fff;
        cursor: pointer;
        font-weight: 800;
      }
      .pagination button:disabled { cursor: not-allowed; opacity: 0.55; }
    `,
  ],
})
export class DataTable {
  @Input({ required: true }) columns: ColumnDef[] = [];
  @Input({ required: true }) data: Record<string, unknown>[] = [];
  @Input() pageable = false;
  @Input() page = 1;
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() sortKey = '';
  @Input() sortDir: 'asc' | 'desc' = 'asc';
  @ContentChild('cell') cellTpl?: TemplateRef<unknown>;
  @ContentChild('actions') actions?: TemplateRef<unknown>;
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ key: string; dir: string }>();

  get maxPages(): number {
    return totalPages(this.total || this.data.length, this.pageSize);
  }

  toggleSort(key: string): void {
    const dir = this.sortKey === key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, dir });
  }
}

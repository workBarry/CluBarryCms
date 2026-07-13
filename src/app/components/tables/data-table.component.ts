import { CommonModule } from '@angular/common';
import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
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
  imports: [CommonModule],
  template: `
    <section class="table-card">
      <table>
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th [style.width]="col.width">
                {{ col.label }}
                @if (col.sortable) {
                  <button class="sort-btn" type="button" (click)="toggleSort(col.key)">
                    {{ sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}
                  </button>
                }
              </th>
            }
            @if (actions) { <th style="width:1px">功能</th> }
          </tr>
        </thead>
        <tbody>
          @for (row of data; track row) {
            <tr>
              @for (col of columns; track col.key) {
                <td>
                  @if (cellTpl) {
                    <ng-container *ngTemplateOutlet="cellTpl; context: { $implicit: row, col: col }" />
                  } @else {
                    {{ row[col.key] }}
                  }
                </td>
              }
              @if (actions) {
                <td class="actions">
                  <ng-container *ngTemplateOutlet="actions; context: { $implicit: row }" />
                </td>
              }
            </tr>
          } @empty {
            <tr>
              <td class="empty-row" [attr.colspan]="columns.length + (actions ? 1 : 0)">無資料</td>
            </tr>
          }
        </tbody>
      </table>
      @if (pageable) {
        <div class="pagination">
          <span>共 {{ total }} 筆</span>
          <button type="button" (click)="pageChange.emit(page - 1)" [disabled]="page <= 1">上一頁</button>
          <span>{{ page }} / {{ maxPages }}</span>
          <button type="button" (click)="pageChange.emit(page + 1)" [disabled]="page >= maxPages">下一頁</button>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .empty-row { text-align: center; color: #66756f; padding: 2rem; }
      .sort-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #66756f;
        font-size: 0.7rem;
        padding: 0 0.2rem;
      }
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
  @Output() sortChange = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();

  get maxPages(): number {
    return totalPages(this.total || this.data.length, this.pageSize);
  }

  toggleSort(key: string): void {
    const dir = this.sortKey === key && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ key, dir });
  }
}

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { statusLabel } from '../../utils';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="status-badge" [ngClass]="variant">{{ label }}</span>`,
  styles: [
    `
      .status-badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 0.32rem 0.6rem;
        font-size: 0.78rem;
        font-weight: 800;
      }
      .status-badge.active,
      .status-badge.published,
      .status-badge.paid,
      .status-badge.registered,
      .status-badge.completed {
        color: #166534;
        background: #e7f5ed;
      }
      .status-badge.pending,
      .status-badge.draft,
      .status-badge.unpaid {
        color: #92400e;
        background: #fff7ed;
      }
      .status-badge.suspended,
      .status-badge.cancelled,
      .status-badge.closed {
        color: #991b1b;
        background: #fef2f2;
      }
      .status-badge.waitlisted,
      .status-badge.refunded {
        color: #6b21a8;
        background: #faf5ff;
      }
    `,
  ],
})
export class StatusBadge {
  @Input({ required: true }) value = '';
  get label(): string {
    return statusLabel(this.value);
  }
  get variant(): string {
    return this.value;
  }
}

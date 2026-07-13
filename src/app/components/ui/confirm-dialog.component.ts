import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="modal-backdrop" *ngIf="open">
      <div class="modal confirm-dialog">
        <h2>{{ title }}</h2>
        <p>{{ message }}</p>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="cancel()">取消</button>
          <button class="btn primary" type="button" [class.danger]="danger" (click)="confirm()">{{ confirmText }}</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .confirm-dialog {
        width: min(440px, 100%);
        display: grid;
        gap: 0.75rem;
      }
      h2 { margin: 0; }
      p { margin: 0; color: #66756f; }
    `,
  ],
})
export class ConfirmDialog {
  @Input() open = false;
  @Input() title = '確認';
  @Input() message = '';
  @Input() confirmText = '確認';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() dismissed = new EventEmitter<void>();

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.dismissed.emit();
  }
}

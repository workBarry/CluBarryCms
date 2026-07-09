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
      .modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 20;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: rgba(15, 23, 42, 0.36);
      }
      .modal {
        width: min(440px, 100%);
        border: 1px solid #d9e2de;
        border-radius: 0.8rem;
        padding: 1.25rem;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      }
      .confirm-dialog {
        display: grid;
        gap: 0.75rem;
      }
      h2 { margin: 0; }
      p { margin: 0; color: #66756f; }
      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }
      .btn {
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
      .btn.primary { color: #fff; background: #0f766e; border-color: #0f766e; }
      .btn.primary.danger { background: #b91c1c; border-color: #b91c1c; }
      .btn.ghost { color: #115e59; background: #eef4f1; }
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

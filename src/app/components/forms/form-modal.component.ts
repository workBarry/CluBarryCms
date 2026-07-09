import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="modal-backdrop" *ngIf="open">
      <form class="modal form-grid" (ngSubmit)="save.emit()">
        <h2>{{ title }}</h2>
        <ng-content></ng-content>
        <div class="modal-actions">
          <button class="btn ghost" type="button" (click)="cancel.emit()">取消</button>
          <button class="btn primary" type="submit">儲存</button>
        </div>
      </form>
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
        width: min(760px, 100%);
        max-height: calc(100vh - 2rem);
        overflow: auto;
        border: 1px solid #d9e2de;
        border-radius: 0.8rem;
        padding: 1.25rem;
        background: #fff;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
      h2 { grid-column: 1 / -1; margin: 0; }
      .modal-actions {
        grid-column: 1 / -1;
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
      .btn.ghost { color: #115e59; background: #eef4f1; }
    `,
  ],
})
export class FormModal {
  @Input() open = false;
  @Input() title = '';
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

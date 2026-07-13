import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="modal-backdrop" *ngIf="open">
      <div class="modal form-grid" role="dialog" aria-modal="true" [attr.aria-label]="title">
        <h2>{{ title }}</h2>
        <ng-content></ng-content>
        <div class="modal-actions">
          <span class="error-text" *ngIf="error">{{ error }}</span>
          <button class="btn ghost" type="button" (click)="cancel.emit()" [disabled]="saving">取消</button>
          <button class="btn primary" type="button" (click)="save.emit()" [disabled]="saving">
            {{ saving ? '儲存中…' : '儲存' }}
          </button>
        </div>
      </div>
    </section>
  `,
})
export class FormModal {
  @Input() open = false;
  @Input() title = '';
  @Input() saving = false;
  @Input() error = '';
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

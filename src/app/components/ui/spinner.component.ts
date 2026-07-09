import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="spinner-wrap" [class.overlay]="overlay">
      <span class="spinner"></span>
      <span class="spinner-text" *ngIf="text">{{ text }}</span>
    </div>
  `,
  styles: [
    `
      .spinner-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2rem;
      }
      .spinner-wrap.overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        justify-content: center;
        background: rgba(255, 255, 255, 0.7);
      }
      .spinner {
        width: 2rem;
        height: 2rem;
        border: 3px solid #d9e2de;
        border-top-color: #0f766e;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      .spinner-text {
        color: #66756f;
        font-size: 0.86rem;
        font-weight: 700;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `,
  ],
})
export class Spinner {
  @Input() text?: string;
  @Input() overlay = false;
}

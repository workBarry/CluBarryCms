import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <strong>{{ title }}</strong>
      <p *ngIf="description">{{ description }}</p>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .empty {
        display: grid;
        place-items: center;
        gap: 0.5rem;
        padding: 3rem 1rem;
        color: #66756f;
        text-align: center;
      }
      .empty strong {
        font-size: 1.1rem;
      }
      .empty p {
        margin: 0;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class EmptyState {
  @Input({ required: true }) title = '';
  @Input() description? = '';
}

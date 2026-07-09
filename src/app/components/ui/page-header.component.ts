import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <section class="page-title with-action">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
      </div>
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .page-title.with-action {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1rem;
      }
      .eyebrow {
        display: block;
        color: #0f766e;
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      h1 {
        margin: 0;
        font-size: clamp(1.8rem, 3vw, 2.6rem);
        letter-spacing: 0;
      }
    `,
  ],
})
export class PageHeader {
  @Input({ required: true }) eyebrow = '';
  @Input({ required: true }) title = '';
}

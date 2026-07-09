import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="toolbar">
      <input type="search" [ngModel]="keyword" (ngModelChange)="keywordChange.emit($event)" [placeholder]="placeholder" />
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .toolbar {
        display: grid;
        grid-template-columns: 1fr 12rem 12rem;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      input, select {
        width: 100%;
        min-height: 2.5rem;
        border: 1px solid #d9e2de;
        border-radius: 0.55rem;
        padding: 0 0.75rem;
        color: #17211d;
        background: #fff;
        font: inherit;
      }
    `,
  ],
})
export class SearchToolbar {
  @Input() keyword = '';
  @Input() placeholder = '搜尋...';
  @Output() keywordChange = new EventEmitter<string>();
}

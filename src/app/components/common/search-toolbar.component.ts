import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-toolbar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="toolbar">
      <input type="search" [ngModel]="keyword" (ngModelChange)="keywordChange.emit($event)" [placeholder]="placeholder" />
      <ng-content></ng-content>
    </section>
  `,
})
export class SearchToolbar {
  @Input() keyword = '';
  @Input() placeholder = '搜尋...';
  @Output() keywordChange = new EventEmitter<string>();
}

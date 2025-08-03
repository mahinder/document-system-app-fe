// shared/components/virtual-list/virtual-list.component.ts
import {
  Component,
  Input,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FixedSizeVirtualScrollStrategy,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';

export class CustomVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
  constructor() {
    super(50, 250, 500); // itemSize, minBufferPx, maxBufferPx
  }
}

@Component({
  selector: 'app-virtual-list',
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      <div *cdkVirtualFor="let item of items; trackBy: trackByFn" class="item">
        <ng-container
          [ngTemplateOutlet]="itemTemplate"
          [ngTemplateOutletContext]="{ $implicit: item }"
        ></ng-container>
      </div>
    </cdk-virtual-scroll-viewport>
  `,
  styleUrls: ['./virtual-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: VIRTUAL_SCROLL_STRATEGY, useClass: CustomVirtualScrollStrategy },
  ],
})
export class VirtualListComponent implements OnInit {
  @Input() items: any[] = [];
  @Input() itemTemplate: any;

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }

  ngOnInit(): void {
    // Component initialization
  }
}

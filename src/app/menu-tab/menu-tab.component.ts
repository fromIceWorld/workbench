import { Component, EventEmitter, OnInit, Output } from '@angular/core';
enum ViewTypes {
  view,
  link,
}
@Component({
  selector: 'app-menu-tab',
  templateUrl: './menu-tab.component.html',
  styleUrls: ['./menu-tab.component.css'],
})
export class MenuTabComponent implements OnInit {
  @Output() cache = new EventEmitter();
  @Output() recover = new EventEmitter();
  @Output() export = new EventEmitter();
  @Output() change = new EventEmitter();
  ViewTypes = ViewTypes;
  viewType: ViewTypes = ViewTypes.view;
  menuConfig = {
    base: [
      {
        id: 'text',
        type: 'node',
        icon: 'font-size',
        title: '文本',
      },
      {
        id: 'button',
        type: 'node',
        icon: 'tool',
        title: '按钮',
      },
    ],
    layout: [
      {
        id: 'container',
        type: 'combo',
        icon: 'border-outer',
        title: '布局容器',
      },
    ],
    form: [
      {
        id: 'form',
        type: 'combo',
        title: 'form',
        icon: 'form',
      },
      {
        id: 'input',
        type: 'node',
        title: '输入框',
        icon: 'edit',
      },
      {
        id: 'radio',
        type: 'node',
        title: '单选框',
        icon: 'aim',
      },
    ],
    dialog: [
      {
        id: 'dialog_model',
        type: 'combo',
        icon: 'switcher',
        title: 'dialog_model',
      },
    ],
    table: [
      {
        id: 'table',
        type: 'node',
        icon: 'ordered-list',
        title: 'table',
      },
    ],
  };
  constructor() {}
  cacheData(e) {
    this.cache.emit();
  }
  recoverData(e) {
    this.recover.emit();
  }
  exportData(e) {
    this.export.emit();
  }
  changeView(e) {
    this.viewType =
      this.viewType === ViewTypes.view ? ViewTypes.link : ViewTypes.view;
    this.change.emit();
  }
  ngOnInit(): void {}
  menuConfigKeys() {
    return Object.keys(this.menuConfig);
  }
}

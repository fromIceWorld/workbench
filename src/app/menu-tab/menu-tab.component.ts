import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { NodePosition } from '../view-tab/view-tab.component';
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
        view: NodePosition.all,
        title: '文本',
      },
      {
        id: 'button',
        type: 'node',
        icon: 'tool',
        title: '按钮',
        view: NodePosition.all,
      },
    ],
    layout: [
      {
        id: 'container',
        type: 'combo',
        icon: 'border-outer',
        title: '布局容器',
        view: NodePosition.all,
      },
    ],
    form: [
      {
        id: 'form',
        type: 'combo',
        title: 'form',
        icon: 'form',
        view: NodePosition.all,
      },
      {
        id: 'input',
        type: 'node',
        title: '输入框',
        icon: 'edit',
        view: NodePosition.all,
      },
      {
        id: 'radio',
        type: 'node',
        title: '单选框',
        icon: 'aim',
        view: NodePosition.all,
      },
    ],
    dialog: [
      {
        id: 'dialog_model',
        type: 'combo',
        icon: 'switcher',
        title: 'dialog_model',
        view: NodePosition.all,
      },
    ],
    table: [
      {
        id: 'table',
        type: 'node',
        icon: 'ordered-list',
        title: 'table',
        view: NodePosition.all,
      },
    ],
    api: [
      {
        id: 'api',
        type: 'node',
        icon: 'radar-chart',
        title: 'api',
        node: 'api',
        view: NodePosition.all,
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

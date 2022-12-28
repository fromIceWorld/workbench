import { Component, EventEmitter, OnInit, Output } from '@angular/core';

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
  menuConfig = {
    base: [
      {
        id: 'text',
        type: 'node',
        title: '文本',
        img: './menu/text.svg',
      },
      {
        id: 'button',
        type: 'node',
        title: '按钮',
        img: './menu/button.svg',
      },
    ],
    layout: [
      {
        id: 'container',
        type: 'combo',
        title: '布局容器',
        img: './menu/input-box.svg',
      },
    ],
    form: [
      {
        id: 'form',
        type: 'combo',
        title: 'form',
        img: './menu/form.svg',
      },
      {
        id: 'input',
        type: 'node',
        title: '输入框',
        img: './menu/input.svg',
      },
      {
        id: 'radio',
        type: 'node',
        title: '单选框',
        img: './menu/radio.svg',
      },
    ],

    dialog: [
      {
        id: 'dialog_model',
        type: 'combo',
        title: 'dialog_model',
        img: './menu/dialog.svg',
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
    this.change.emit();
  }
  ngOnInit(): void {}
  menuConfigKeys() {
    return Object.keys(this.menuConfig);
  }
}

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommunicationService } from '../communication.service';
import { NodePosition } from '../view-tab/view-tab.component';
enum ViewTypes {
  view,
  link,
}
@Component({
  selector: 'app-menu-tab',
  templateUrl: './menu-tab.component.html',
  styleUrls: ['./menu-tab.component.css'],
  providers: [CommunicationService],
})
export class MenuTabComponent implements OnInit {
  @Output() cache = new EventEmitter();
  @Output() recover = new EventEmitter();
  @Output() export = new EventEmitter();
  @Output() change = new EventEmitter();
  ViewTypes = ViewTypes;
  viewType: ViewTypes = ViewTypes.view;
  menuConfig = [
    [
      'base',
      [
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
    ],
    [
      'layout',
      [
        {
          id: 'container',
          type: 'combo',
          icon: 'border-outer',
          title: '布局容器',
          view: NodePosition.all,
        },
      ],
    ],
    [
      'form',
      [
        // {
        //   id: 'form',
        //   type: 'combo',
        //   title: 'form',
        //   icon: 'form',
        //   view: NodePosition.all,
        // },
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
    ],
    [
      'dialog',
      [
        {
          id: 'dialog_model',
          type: 'combo',
          icon: 'switcher',
          title: 'dialog_model',
          view: NodePosition.all,
        },
      ],
    ],
    [
      'table',
      [
        {
          id: 'table',
          type: 'node',
          icon: 'ordered-list',
          title: 'table',
          view: NodePosition.all,
        },
      ],
    ],
    [
      'api',
      [
        {
          id: 'api',
          type: 'node',
          icon: 'radar-chart',
          title: 'api',
          node: 'api',
          view: NodePosition.all,
        },
      ],
    ],
  ];
  constructor(private service: CommunicationService) {}
  getMenuList() {
    this.service.getMenus().subscribe((res: any) => {
      const { code, data } = res,
        files: Set<string> = new Set(),
        doms = [];
      // 规范menu
      let menuMap = new Map();
      data.forEach((item) => {
        const { family } = item;
        let list = menuMap.get(family);
        if (!list) {
          list = [];
          menuMap.set(family, list);
        }
        list.push(item);
      });
      this.menuConfig = Array.from(menuMap);
      data.forEach((menu) => {
        const { filesName, area } = menu;
        filesName.forEach((file) => {
          files.add(area + '/' + file);
        });
      });
      Array.from(files).forEach((add) => {
        if (add.endsWith('.js')) {
          let script = document.createElement('script');
          script.src = add;
          doms.push(script);
        } else if (add.endsWith('.css')) {
          let link = document.createElement('link');
          link.href = add;
          doms.push(link);
        }
      });
      document.body.append(...doms);
    });
  }
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
  ngOnInit(): void {
    this.getMenuList();
  }
  menuConfigKeys() {
    return Object.keys(this.menuConfig);
  }
}

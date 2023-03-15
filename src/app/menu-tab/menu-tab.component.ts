import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommunicationService } from '../communication.service';
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
  menuConfig = [];
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

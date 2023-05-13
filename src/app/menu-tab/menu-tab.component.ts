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
  @Output() downloadEmit = new EventEmitter();
  @Output() publish = new EventEmitter();
  @Output() grid = new EventEmitter();
  @Output() change = new EventEmitter();
  cacheVisible = false;
  ViewTypes = ViewTypes;
  cacheDialog = false;
  componentDialog = false;
  componentList = [];
  current;
  configParams = {
    tagName: '',
    desc: '',
  };
  viewType: ViewTypes = ViewTypes.view;
  menuConfig = [];
  pageIndex = 1;
  currentPageList = [];
  constructor(private service: CommunicationService) {}

  showComponentDialog() {
    this.getComponentConfig();
    this.componentDialog = true;
  }
  getComponentConfig() {
    this.service.getComponentConfig().subscribe((res: any) => {
      const { code, data } = res;
      if (code == 200) {
        this.componentList = data;
        this.currentPageList = this.componentList.slice(0, 10);
      }
    });
  }
  getMenuList() {
    this.service.getMenus().subscribe((res: any) => {
      const { code, data } = res,
        filesMap: Map<string, any> = new Map(),
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
          filesMap.set(
            area + '/' + (typeof file == 'string' ? file : file.name),
            file.decorator || {}
          );
        });
      });
      for (let file of filesMap.keys()) {
        if (file.endsWith('.js')) {
          let script = document.createElement('script');
          let decorator = filesMap.get(file);
          Object.keys(decorator).forEach((key) => {
            script[key] = decorator[key];
          });
          script.src = file;
          doms.push(script);
        } else if (file.endsWith('.css')) {
          let link = document.createElement('link');
          link.href = file;
          link.rel = 'stylesheet';
          link.type = 'text/css';
          doms.push(link);
        }
      }
      document.body.append(...doms);
    });
  }
  cacheData(e) {
    this.cacheDialog = true;
    this.cache.emit({
      tagName: this.configParams.tagName,
      desc: this.configParams.desc,
    });
    this.cacheVisible = false;
  }
  pageIndexChange(index) {
    console.log(index);
    this.pageIndex = index;
    this.currentPageList = this.componentList.slice(
      (index - 1) * 10,
      index * 10
    );
  }
  download(e) {
    this.downloadEmit.emit();
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
  //发布应用
  publishAPP(e) {
    this.publish.emit();
  }
  //整理节点
  gridNode(e) {
    this.grid.emit();
  }
  apply(e, item) {
    const { json } = item;
    console.log(JSON.parse(json));
    this.recover.emit(json);
    this.componentDialog = false;
  }
}

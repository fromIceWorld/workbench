import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ButtonComponent } from './button/button.component';
import { ConfigTabComponent } from './config-tab/config-tab.component';
import { MenuTabComponent } from './menu-tab/menu-tab.component';
import { ViewTabComponent } from './view-tab/view-tab.component';
import { WorkbenchComponent } from './workbench/workbench.component';

// 暴露出源组件class 创建web component的API
window['createCustomElement'] = createCustomElement;

window['ButtonComponent'] = ButtonComponent;

@NgModule({
  declarations: [
    ButtonComponent,
    ConfigTabComponent,
    MenuTabComponent,
    ViewTabComponent,
    WorkbenchComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NzButtonModule,
    NzSelectModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzSwitchModule,
  ],
  providers: [],
  bootstrap: [],
  entryComponents: [
    ButtonComponent,
    ConfigTabComponent,
    MenuTabComponent,
    ViewTabComponent,
    WorkbenchComponent,
  ],
})
export class AppModule {
  constructor(private injector: Injector) {
    window['injector'] = this.injector; // 暴露出依赖
  }
  ngDoBootstrap() {
    const buttonEle = createCustomElement(ButtonComponent, {
      injector: this.injector,
    });
    window['my-button'] = buttonEle;
    customElements.define('my-button', buttonEle);
    // const ConfigTab = createCustomElement(ConfigTabComponent, {
    //   injector: this.injector,
    // });
    // customElements.define('app-config-tab', ConfigTab);
    // const MenuTab = createCustomElement(MenuTabComponent, {
    //   injector: this.injector,
    // });
    // customElements.define('app-menu-tab', MenuTab);
    // const ViewTab = createCustomElement(ViewTabComponent, {
    //   injector: this.injector,
    // });
    // customElements.define('app-view-tab', ViewTab);
    const Workbench = createCustomElement(WorkbenchComponent, {
      injector: this.injector,
    });
    customElements.define('app-work-bench', Workbench);
  }
}

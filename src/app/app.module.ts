import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ConfigTabComponent } from './config-tab/config-tab.component';
import { EventBusService } from './event-bus.service';
import { MenuTabComponent } from './menu-tab/menu-tab.component';
import { ViewTabComponent } from './view-tab/view-tab.component';
import { WorkbenchComponent } from './workbench/workbench.component';

// 暴露出源组件class 创建web component的API
// export * from '../../../custom-elements-demo/dist/main.js';
// export * from '../../../custom-elements-demo/dist/polyfills.js';
// export * from '../../../custom-elements-demo/dist/runtime.js';
@NgModule({
  declarations: [
    WorkbenchComponent,
    ViewTabComponent,
    MenuTabComponent,
    ConfigTabComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NzButtonModule,
    NzRadioModule,
    NzSelectModule,
    NzInputModule,
    NzIconModule,
    NzTagModule,
    NzSwitchModule,
    HttpClientModule,
    NzModalModule,
    BrowserAnimationsModule,
    NzInputNumberModule,
    NzTabsModule,
    NzAlertModule,
    NzTableModule,
    NzListModule,
    NzPopoverModule,
    NzMessageModule,
  ],
  providers: [{ provide: 'bus', useClass: EventBusService }],
  bootstrap: [WorkbenchComponent],
  entryComponents: [],
})
export class AppModule {}

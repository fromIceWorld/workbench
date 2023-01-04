import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
// 导入 web-components 组件及配置
export * from '../../custom-elements-demo/dist/custom-elements-demo/main.js';
export * from '../../custom-elements-demo/dist/custom-elements-demo/polyfills.js';
export * from '../../custom-elements-demo/dist/custom-elements-demo/runtime.js';
if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

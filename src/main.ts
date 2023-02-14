import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import html2canvas from 'html2canvas';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
window['html2canvas'] = html2canvas;
if (environment.production) {
  enableProdMode();
}
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));

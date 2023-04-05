import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  pre = '/center';
  constructor(private http: HttpClient) {}
  getMenus() {
    return this.http.get(this.pre + '/menus');
  }
  getComponentConfig() {
    return this.http.get(this.pre + '/getComponentConfig');
  }
  publishApplication(params) {
    return this.http.post(this.pre + '/publishApplication', {
      ...params,
    });
  }
  cacheConfig(params) {
    return this.http.post(this.pre + '/saveComponentConfig', params);
  }
}

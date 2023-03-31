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
  publishApplication(params) {
    return this.http.post(this.pre + '/publishApplication', {
      ...params,
    });
  }
}

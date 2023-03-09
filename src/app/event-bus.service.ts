import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'any',
})
export class EventBusService {
  center = new Subject();
  constructor() {}
}

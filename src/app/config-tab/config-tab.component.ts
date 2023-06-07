import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-config-tab',
  templateUrl: './config-tab.component.html',
  styleUrls: ['./config-tab.component.css'],
})
export class ConfigTabComponent implements OnInit {
  html = {};
  css = {};
  editIndex;
  constructor(@Inject('bus') private bus) {
    console.log('初始化接收');
    this.bus.center.subscribe((res: any) => {
      const { html, css, type } = res;
      if (type === 'config') {
        this.html = html;
        this.css = css;
      }
    });
  }
  addHeaders(options) {
    options.push({
      label: 'label',
      key: 'key',
      width: '100',
    });
  }
  updateTable() {
    this.editIndex = null;
    this.updateBlur(null);
  }
  drop(event: CdkDragDrop<string[]>, list): void {
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    this.updateBlur(null);
  }
  originKeys(obj) {
    return Object.keys(obj);
  }
  isArray(value) {
    return Array.isArray(value);
  }
  updateConfig(e?) {
    this.bus.center.next({
      html: this.html,
      css: this.css,
      type: 'update',
    });
  }
  updatePoint(e, type) {
    this.bus.center.next({
      type: 'edit',
      value: type,
    });
  }
  deleteItem(options, index) {
    options.splice(index, 1);
    this.updateBlur(null);
  }
  updateFocus(e) {
    this.bus.center.next({
      type: 'status',
      value: true,
    });
  }
  updateBlur(e) {
    this.bus.center.next({
      type: 'status',
      value: false,
    });
    this.updateConfig();
  }
  checkTag(tag, origin) {
    let [label, value] = tag.split(':');
    origin.value = value || label;
    this.updateConfig();
  }
  ngOnInit(): void {}
  inputVisible = false;
  inputValue = '';
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef;

  handleClose(removedTag: {}, arr, key): void {
    arr[key] = arr[key].filter((tag) => tag !== removedTag);
    this.updateConfig();
  }
  // label:value
  sliceTagName(tag: string): string {
    let [label, value] = tag.split(':');
    return label;
  }

  showInput(): void {
    this.inputVisible = true;
    setTimeout(() => {
      this.inputElement?.nativeElement.focus();
    }, 10);
  }

  handleInputConfirm(arr, key): void {
    if (this.inputValue && arr[key].indexOf(this.inputValue) === -1) {
      arr[key] = [...arr[key], this.inputValue];
    }
    this.inputValue = '';
    this.inputVisible = false;
    this.updateConfig();
  }
  changeFlex(e, id) {
    this.bus.center.next({
      type: 'layout',
      value: id,
    });
  }
}

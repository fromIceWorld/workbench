import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-config-tab',
  templateUrl: './config-tab.component.html',
  styleUrls: ['./config-tab.component.css'],
})
export class ConfigTabComponent implements OnInit {
  @Input() config = {};
  @Output() updatePoint = new EventEmitter();
  @Output() changeLayout = new EventEmitter();
  originKeys(obj) {
    return Object.keys(obj);
  }
  isArray(value) {
    return Array.isArray(value);
  }
  updateConfig(e?) {
    this.updatePoint.emit(this.config);
  }
  selectChange(e) {
    this.updatePoint.emit(this.config);
  }
  checkTag(tag, origin) {
    origin.value = tag;
    this.updatePoint.emit(this.config);
  }
  ngOnInit(): void {}
  inputVisible = false;
  inputValue = '';
  @ViewChild('inputElement', { static: false }) inputElement?: ElementRef;

  handleClose(removedTag: {}, arr, key): void {
    arr[key] = arr[key].filter((tag) => tag !== removedTag);
    this.updateConfig();
  }

  sliceTagName(tag: string): string {
    const isLongTag = tag.length > 20;
    return isLongTag ? `${tag.slice(0, 20)}...` : tag;
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
    this.changeLayout.emit({
      layout: id,
    });
  }
}

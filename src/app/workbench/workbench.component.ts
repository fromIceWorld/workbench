import { Component, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-workbench',
  templateUrl: './workbench.component.html',
  styleUrls: ['./workbench.component.css'],
})
export class WorkbenchComponent implements OnInit {
  @ViewChild('menu') menu;
  @ViewChild('view') view;
  @ViewChild('config') config;
  constructor() {}
  cacheData(e) {
    this.view.cacheData();
  }
  recoverData(e) {
    this.view.recoverData();
  }
  exportData(e) {
    this.view.exportData();
  }
  changeView(e) {
    this.view.changeView();
  }
  setConfig(e) {
    this.config.config = e;
  }
  ngOnInit(): void {}
  update(e) {
    let config = e;
    this.view.updateNode(config);
  }
  changeLayout(e) {
    this.view.changeNodeLayout(e);
  }
}

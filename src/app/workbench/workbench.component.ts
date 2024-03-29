import { Component, OnInit, ViewChild } from '@angular/core';
import { EventBusService } from '../event-bus.service';

@Component({
  selector: 'app-workbench',
  templateUrl: './workbench.component.html',
  styleUrls: ['./workbench.component.css'],
})
export class WorkbenchComponent implements OnInit {
  @ViewChild('menu') menu;
  @ViewChild('view', { static: true }) view;
  @ViewChild('config') config;
  configDialog = false;
  constructor(private bus: EventBusService) {}
  cacheData(e) {
    console.log(e);
    this.view.cacheData(e);
  }
  recoverData(e) {
    this.view.recoverData(e);
  }
  downloadFile(e) {
    this.view.downloadFile();
  }
  publishAPP(e) {
    this.view.publishAPP();
  }
  gridNode(e) {
    this.view.gridNode();
  }
  changeView(e) {
    this.view.changeView();
  }
  changeSize(e) {
    this.view.changeSize(e);
  }
  setConfig(e) {
    const { html, css } = e;
    this.config.config = html;
  }
  ngOnInit(): void {}
  update(e) {
    const { html, css } = e;
    let config = e;
    this.view.updateNode(config);
  }
  changeLayout(e) {
    this.view.changeNodeLayout(e);
  }
  displayConfig() {
    return this.view.tabView === 'design-view' && !this.configDialog
      ? 'block'
      : 'none';
  }
  onConfig(e) {
    this.configDialog = e;
    console.log(e);
  }
}

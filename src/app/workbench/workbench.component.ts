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
    console.log(e);
    this.config.config = e;
  }
  ngOnInit(): void {}
  update(e) {
    let attributes = {},
      properties = {};
    Object.keys(this.config.origin[0]).forEach((key, index) => {
      if (Array.isArray(e[0][index])) {
        attributes[key] = e[0][index].map((value, i) => {
          return {
            value,
            label: value,
            checked: i === 0,
          };
        });
      }
      attributes[key] = e[0][index];
    });
    Object.keys(this.config.origin[1]).forEach((key, index) => {
      if (Array.isArray(e[1][index])) {
        properties[key] = e[1][index].map((value, i) => {
          return {
            value,
            label: value,
            checked: i === 0,
          };
        });
      } else {
        properties[key] = e[1][index];
      }
    });
    this.view.updateNode({
      attributes,
      properties,
    });
  }
}

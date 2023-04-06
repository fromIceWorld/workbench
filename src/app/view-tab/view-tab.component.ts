import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import G6 from '../../../g6.min.js';
import { CommunicationService } from '../communication.service';
import { ralationMenu } from '../node-menu/relation-menu.js';
import { enumArrow } from '../view-edges/index.js';

import {
  registerAPI,
  registerBlock,
  registerButton,
  registerCommon,
  registerContainer,
  registerDefault,
  registerDialog,
  registerInput,
  registerRadio,
  registerScaleX,
  registerScaleY,
  registerTable,
  registerText,
  registrForm,
} from '../view-nodes/index';

enum LineType {
  event,
  data,
  params,
}
export enum NodePosition {
  view = 1,
  relation,
  all,
}

const processParallelEdgesOnAnchorPoint = (
  edges,
  offsetDiff = 15,
  multiEdgeType = 'quadratic',
  singleEdgeType = undefined,
  loopEdgeType = undefined
) => {
  const len = edges.length;
  const cod = offsetDiff * 2;
  const loopPosition = [
    'top',
    'top-right',
    'right',
    'bottom-right',
    'bottom',
    'bottom-left',
    'left',
    'top-left',
  ];
  const edgeMap = {};
  const tags = [];
  const reverses = {};
  for (let i = 0; i < len; i++) {
    const edge = edges[i];
    const { source, target, sourceAnchor, targetAnchor } = edge;
    const sourceTarget = `${source}|${sourceAnchor}-${target}|${targetAnchor}`;

    if (tags[i]) continue;
    if (!edgeMap[sourceTarget]) {
      edgeMap[sourceTarget] = [];
    }
    tags[i] = true;
    edgeMap[sourceTarget].push(edge);
    for (let j = 0; j < len; j++) {
      if (i === j) continue;
      const sedge = edges[j];
      const {
        source: src,
        target: dst,
        sourceAnchor: srcAnchor,
        targetAnchor: dstAnchor,
      } = sedge;

      // 两个节点之间共同的边
      // 第一条的source = 第二条的target
      // 第一条的target = 第二条的source
      if (!tags[j]) {
        if (
          source === dst &&
          sourceAnchor === dstAnchor &&
          target === src &&
          targetAnchor === srcAnchor
        ) {
          edgeMap[sourceTarget].push(sedge);
          tags[j] = true;
          reverses[
            `${src}|${srcAnchor}|${dst}|${dstAnchor}|${
              edgeMap[sourceTarget].length - 1
            }`
          ] = true;
        } else if (
          source === src &&
          sourceAnchor === srcAnchor &&
          target === dst &&
          targetAnchor === dstAnchor
        ) {
          edgeMap[sourceTarget].push(sedge);
          tags[j] = true;
        }
      }
    }
  }

  for (const key in edgeMap) {
    const arcEdges = edgeMap[key];
    const { length } = arcEdges;
    for (let k = 0; k < length; k++) {
      const current = arcEdges[k];
      if (current.source === current.target) {
        if (loopEdgeType) current.type = loopEdgeType;
        // 超过8条自环边，则需要重新处理
        current.loopCfg = {
          position: loopPosition[k % 8],
          dist: Math.floor(k / 8) * 20 + 50,
        };
        continue;
      }
      if (
        length === 1 &&
        singleEdgeType &&
        (current.source !== current.target ||
          current.sourceAnchor !== current.targetAnchor)
      ) {
        current.type = singleEdgeType;
        continue;
      }
      current.type = multiEdgeType;
      const sign =
        (k % 2 === 0 ? 1 : -1) *
        (reverses[
          `${current.source}|${current.sourceAnchor}|${current.target}|${current.targetAnchor}|${k}`
        ]
          ? -1
          : 1);
      if (length % 2 === 1) {
        current.curveOffset = sign * Math.ceil(k / 2) * cod;
      } else {
        current.curveOffset = sign * (Math.floor(k / 2) * cod + offsetDiff);
      }
    }
  }
  return edges;
};

@Component({
  selector: 'app-view-tab',
  templateUrl: './view-tab.component.html',
  styleUrls: ['./view-tab.component.css'],
  providers: [],
})
export class ViewTabComponent implements OnInit {
  @ViewChild('model')
  model;
  @ViewChild('respond')
  respond;
  @ViewChild('design')
  board;
  @ViewChild('relation')
  relationship;
  @ViewChild('scaleX')
  scaleX;
  @ViewChild('scaleY')
  scaleY;
  @ViewChild('dialog')
  dialog;
  originFile = {};
  businessCodeJS = '';
  htmlS = '';
  appName = '';
  tagName = '';
  logicHash: number;
  logicName = '';
  logicContent = '';

  isVisible: boolean = false;
  publishIsVisible: boolean = false;
  eventName: string = '';
  methodName: string = '';
  methods: string[] = [];
  level2 = [];
  eventLine = [[]];
  tabView: string = 'design-view';
  dragTarget: EventTarget | null = null;
  data = {
    nodes: [],
    combos: [
      // { type: 'block', width: 200, height: 200, x: 50, y: 50, id: '123' },
    ],
  };
  scaleXdata = {
    nodes: [{ id: '1', type: 'scaleX', x: 0, y: 0 }],
  };
  scaleYdata = {
    nodes: [{ id: '2', type: 'scaleY', x: 0, y: 0 }],
  };
  selectedIndex = LineType.event;
  graph: any;
  relationshipGraph: any;
  focusNode: any = null;
  focusCombo: any = null;
  jsonOnEdit: boolean = false;
  config = [];
  sourceList = [];
  targetList = [];
  sourceEvents = [];
  sourceMethods = [];
  targetMethods = [];
  sourceData = [];
  sourceChecked = [];
  targetData = [];
  isCreate: boolean = false;
  newEdge;
  sourceSelect;
  targetSelect;
  diaDisplay: boolean = false;
  sourceAnchorIdx;
  targetAnchorIdx;
  key = '';
  value = '';
  method = '';
  hook = '';
  idMapTag: Map<string, string> = new Map();
  constructor(
    private cd: ChangeDetectorRef,
    private service: CommunicationService,
    private modalService: NzModalService,
    private message: NzMessageService,
    @Inject('bus') private bus
  ) {
    this.bus.center.subscribe((res: any) => {
      const { html, css, type, value } = res;
      switch (type) {
        case 'update':
          this.updateView(html, css);
          break;
        case 'layout':
          this.changeNodeLayout(value);
          break;
        case 'status':
          this.onEdit(value);
          break;
      }
      console.log('接收到：', type);
    });
  }
  registerNodes() {
    registerButton();
    registerTable();
    registerBlock();
    registerContainer();
    registerDialog();
    registerInput();
    registerRadio();
    registerScaleX();
    registerScaleY();
    registerDefault();
    registerAPI();
    registerText();
    registrForm();
    registerCommon();
  }
  renderScale() {
    const width = 1920,
      height = 20,
      scaleXgraph = new G6.Graph({
        container: 'scaleX',
        width: 1942,
        height: 22,
      }),
      scaleYgraph = new G6.Graph({
        container: 'scaleY',
        width: 22,
        height: 1102,
      });
    scaleXgraph.read(this.scaleXdata);
    scaleYgraph.read(this.scaleYdata);
  }
  changeView(e) {
    this.absoluteLayout();
    if (this.tabView === 'design-view') {
      this.tabView = 'relation-ship';
    } else {
      this.tabView = 'design-view';
    }
  }
  cacheData(params) {
    let cache = {
      view: {
        nodes: this.graph.getNodes().map((node) => {
          return {
            ...node._cfg.model,
          };
        }),
        combos: this.graph.getCombos().map((combo) => {
          return {
            ...combo._cfg.model,
          };
        }),
      },
      relation: {
        nodes: this.relationshipGraph.getNodes().map((node) => {
          return {
            ...node._cfg.model,
          };
        }),
        combos: this.relationshipGraph.getCombos().map((combo) => {
          return {
            ...combo._cfg.model,
          };
        }),
        edges: this.relationshipGraph.getEdges().map((edge) => {
          const { id, label, source, target, edgeType, style } =
            edge._cfg.model;
          return {
            id,
            label,
            source,
            target,
            edgeType,
            style,
          };
        }),
      },
    };
    this.cacheConfig({ ...params, json: JSON.stringify(cache) });
  }
  cacheConfig(params) {
    this.service.cacheConfig(params).subscribe((res: any) => {
      const { code } = res;
      if (code == 200) {
        this.message.create('success', '缓存组件配置成功');
      }
    });
  }
  recoverData(json) {
    let { view, relation } = JSON.parse(json);
    this.graph.read(view);
    // 渲染连线图
    this.relationshipGraph.read(relation);
    this.message.create('success', '应用组件配置成功');
  }
  clearGraph() {
    this.graph.read({});
  }
  downloadFile() {
    this.exportData();
    return;
  }
  scriptConfigKeys() {
    return Object.keys(this.originFile);
  }
  // 导出数据
  exportData() {
    this.logicHash = Math.random();
    // 节点数据
    const nodes = this.graph.getNodes(),
      combos = this.graph.getCombos();
    console.log(nodes, combos);
    this.originFile = {};
    // 获取第一层节点
    let topNodes = nodes.filter((node) => !node._cfg.model.comboId);
    let topCombos = combos.filter((combo) => !combo._cfg.model.parentId);
    // 第一层 限定只有一个 combo
    let sortKey =
      topCombos[0]._cfg.model.config.css.style[''] == 'row' ? 'x' : 'y';
    let [html, js] = [...topNodes, ...topCombos]
      .sort((a, b) => a._cfg.model[sortKey] - b._cfg.model[sortKey])
      .map((item) => {
        if (item._cfg.type === 'combo') {
          return this.exportCombo(item);
        } else {
          return this.exportNode(item);
        }
      })
      .reduce(
        (pre, cur) => {
          let [htmlString, jsString] = pre,
            { html, js } = cur;
          return [htmlString + html, jsString + js];
        },
        ['', '']
      );
    // 连线数据
    const edges = this.relationshipGraph.getEdges().map((edge) => {
      const { source, target, label, edgeType } = edge._cfg.model;
      return {
        source,
        target,
        label,
        edgeType,
      };
    });
    let jsString = ``;
    edges
      .map((edge) => {
        const { source, target, label, edgeType } = edge;
        // 不同的关系连线，逻辑不同
        if (edgeType === LineType.event) {
          let [event, fn] = label.split('->');
          jsString += `
            (()=>{
                const sourceDOM = document.querySelector('${this.idMapTag.get(
                  source.split('-')[1]
                )}'),
                    targetDOM = document.querySelector('${this.idMapTag.get(
                      target.split('-')[1]
                    )}'),
                    targetPath = (targetDOM.getAttribute('_methods')||'').split('.');
                let targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);
                sourceDOM.addEventListener('${event}', (e)=>{
                  targetIns['${fn}']();
                });
            })();
              `;
        } else if (edgeType === LineType.data) {
          let [hook, sourceData, targetData] = label.split(/[ =]/);
          jsString += `
            (()=>{
              const sourceDOM = document.querySelector('${this.idMapTag.get(
                source.split('-')[1]
              )}'),
                    targetDOM = document.querySelector('${this.idMapTag.get(
                      target.split('-')[1]
                    )}'),
                    sourcePath = (sourceDOM.getAttribute('_data')||'').split('.'),
                    targetPath = (targetDOM.getAttribute('_data')||'').split('.');
              let sourceIns = sourcePath.reduce((pre,key)=>pre[key],sourceDOM),
                  targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);      
              sourceDOM.addEventListener('${hook}',()=>{
                targetIns['${targetData}'] = sourceIns['${sourceData}'];
              })
            })();
          `;
        } else if (edgeType === LineType.params) {
          let [data, fn] = label.split('=>');
          jsString += `
          (()=>{
            const sourceDOM = document.querySelector('${this.idMapTag.get(
              source.split('-')[1]
            )}'),
                  targetDOM = document.querySelector('${this.idMapTag.get(
                    target.split('-')[1]
                  )}'),
                  sourcePath = (sourceDOM.getAttribute('_data')||'').split('.'),
                  targetPath = (targetDOM.getAttribute('_methods')||'').split('.');
            let sourceIns = sourcePath.reduce((pre,key)=>pre[key],sourceDOM),
                targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);   
            if(!targetIns['${fn}'].params){
              targetIns['${fn}'].params = []
            }
            targetIns['${fn}'].params.push([sourceIns,${data}]);
          })();  
          `;
        }
      })
      .join();
    this.htmlS = html;
    this.businessCodeJS = `${js};${jsString}`;
    console.log(this.originFile, this.htmlS, this.businessCodeJS);
    // 插入base
    let scriptString = ``,
      cssString = ``;
    console.log(this.originFile);
    Object.entries(this.originFile).forEach((file: any) => {
      const [name, decorator] = file;
      console.log(file);
      if (name.endsWith('.js')) {
        scriptString += `<script src="http://localhost:3000/${name}"`;
        Object.entries(decorator).forEach((config) => {
          let [key, value] = config;
          let type = typeof value;
          if (type == 'string') {
            scriptString += ` ${key}=${value}`;
          } else if (type == 'boolean') {
            scriptString += ` ${key}`;
          }
        });
        scriptString += `></script>`;
      } else if (name.endsWith('.css')) {
        cssString += `<link rel="stylesheet" href="http://localhost:3000/${name}"/>`;
      }
    });
    let customElementScript = `
    customElements.define('my-component',
      class MyComponent extends HTMLElement{
        template = \`${html}\`;
        constructor(){
          super();
          this.innerHTML = this.template;
        }
      }
    );
    ${js};
    ${jsString};
    `;
    console.log(scriptString, '\n', cssString, '\n', customElementScript);
    // return;
    // 下载 html文件
    let string = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>展示区</title>
            <base href="./" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            ${scriptString}
            ${cssString}
            <script src="./logic.js" defer></script>
        </head>
        <body>
          <my-component></my-component>
        </body>
       
    </html>
    `;
    // 下载 index.html 和业务逻辑 script
    const htmlBlob = new Blob([string], { type: 'text/html' });
    const a = document.createElement('a'),
      href = URL.createObjectURL(htmlBlob);
    a.href = href;
    let hash = new Date();
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    // 下载logic.js
    const logicBlob = new Blob([customElementScript], {
        type: 'application/ecmascript',
      }),
      jsHref = URL.createObjectURL(logicBlob);
    a.href = jsHref;
    a.download = 'logic.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    console.log('组件源文件', this.originFile);
    console.log('html', html);
    console.log('js', js);
  }
  publishAPP() {
    this.exportData();
    this.publishIsVisible = true;
    console.log('publishAPP');
  }
  absoluteLayout() {
    let styles = [];
    const nodes = this.graph.getNodes(),
      combos = this.graph.getCombos();
    nodes.forEach((node) => {
      let model = node._cfg.model;
      // 无图片的节点，是无需渲染的
      if (!model.img) {
        return;
      }
      const { width, height } = model.img,
        offsetX = width / 2,
        offsetY = height / 2;
      if (!model.comboId) {
        styles.push(
          `left: ${model.x - offsetX}px;top:${model.y - offsetY / 2}px`
        );
      }
    });
    combos.forEach((combo) => {
      let model = combo._cfg.model,
        { minX, maxX, minY, maxY } = combo._cfg.bbox;
      if (!model.comboId) {
        styles.push(`left: ${minX}px;top:${minY}px`);
      }
    });
    console.log(nodes, combos, styles);
  }
  // grid 布局解析
  grid() {
    let area = [],
      q = [];
    const nodes = this.graph.getNodes(),
      combos = this.graph.getCombos();
    let xArea = [Infinity, -Infinity],
      yArea = [Infinity, -Infinity];
    let level1Nodes = [],
      level1Combos = [];
    nodes.forEach((node) => {
      let model = node._cfg.model;
      // 无图片的节点，是无需渲染的
      if (!model.img) {
        return;
      }
      const { width, height } = model.img,
        offsetX = width / 2,
        offsetY = height / 2;
      if (!model.comboId) {
        level1Nodes.push(node);
        xArea[0] = Math.min(model.x - offsetX, xArea[0]);
        xArea[1] = Math.max(model.x + offsetX, xArea[1]);
        yArea[0] = Math.min(model.y - offsetY / 2, yArea[0]);
        yArea[1] = Math.max(model.y + offsetY / 2, yArea[1]);
      }
    });
    combos.forEach((combo) => {
      let model = combo._cfg.model,
        { minX, maxX, minY, maxY } = combo._cfg.bbox;
      if (!model.comboId) {
        level1Combos.push(combo);
        xArea[0] = Math.min(minX, xArea[0]);
        xArea[1] = Math.max(maxX, xArea[1]);
        yArea[0] = Math.min(minY, yArea[0]);
        yArea[1] = Math.max(maxY, yArea[1]);
      }
    });
    // scaleY
    let [start, end] = yArea,
      lineY = start,
      cols = [],
      count = 0,
      areaYStart = Infinity,
      areaYEnd = -Infinity,
      areaXStart = Infinity,
      areaXEnd = -Infinity,
      gcdWidth = 0,
      gcdHeight = 0,
      lcmWidth = 0,
      lcmHeight = 0,
      cache = new Set();
    while (lineY <= end) {
      count = 0;
      [...level1Nodes, ...level1Combos].forEach((node) => {
        let model = node._cfg.model;
        if (node._cfg.type == 'node') {
          // 无图片的节点，是无需渲染的,
          if (!model.img) {
            return;
          }
          const { width, height } = model.img,
            y = model.y,
            x = model.x,
            minX = x - width / 2,
            maxX = x + width / 2,
            minY = y - height / 2,
            maxY = y + height / 2;
          if (lineY >= minY && lineY <= maxY) {
            count++;
            cache.add(node);
            areaXStart = Math.min(areaXStart, minX);
            areaXEnd = Math.max(areaXEnd, maxX);
            areaYStart = Math.min(areaYStart, minY);
            areaYEnd = Math.max(areaYEnd, maxY);
          }
        } else if (node._cfg.type == 'combo') {
          const { minY, maxY, minX, maxX } = node._cfg.bbox;
          if (lineY >= minY && lineY <= maxY) {
            count++;
            cache.add(node);
            areaXStart = Math.min(areaXStart, minX);
            areaXEnd = Math.max(areaXEnd, maxX);
            areaYStart = Math.min(areaYStart, minY);
            areaYEnd = Math.max(areaYEnd, maxY);
          }
        }
      });
      // 当前线未扫描到节点，以当前线为分割
      if (count == 0 && cache.size) {
        let rowArr = Array.from(cache);
        cols.push(rowArr);
        cache.clear();
        // width 和 height 的最大公约数;
        let areaWidth = (rowArr['areaWidth'] = areaXEnd - areaXStart),
          areaHeight = (rowArr['areaHeight'] = areaYEnd - areaYStart);
        console.log(areaWidth, areaHeight);
        lcmWidth = this.lcm(lcmWidth, areaWidth);
        lcmHeight = this.lcm(lcmHeight, areaHeight);
        // 初始化 y轴区间
        areaYStart = Infinity;
        areaYEnd = -Infinity;
        areaXStart = Infinity;
        areaXEnd = -Infinity;
      }
      lineY++;
    }
    if (cache.size) {
      let rowArr = Array.from(cache);
      cols.push(rowArr);
      cache.clear();
      // width 和 height 的最大公约数;
      let areaWidth = (rowArr['areaWidth'] = areaXEnd - areaXStart),
        areaHeight = (rowArr['areaHeight'] = areaYEnd - areaYStart);
      console.log(areaWidth, areaHeight);
      lcmWidth = this.lcm(lcmWidth, areaWidth);
      lcmHeight = this.lcm(lcmHeight, areaHeight);
    }
    // 生成 grid 数据;
    for (let i = 0; i < cols.length; i++) {
      for (let j = 0; j < cols[i].length; j++) {}
    }
    console.log(
      level1Nodes,
      level1Combos,
      xArea,
      yArea,
      cols,
      lcmWidth,
      lcmHeight
    );
  }
  // 最大公约数
  gcd(a, b) {
    return a % b === 0 ? b : this.gcd(b, a % b);
  }
  // 最小公倍数
  lcm(a, b) {
    if (!a || !b) {
      return a || b;
    }
    let origin = this.gcd(a, b);
    return (a * b) / origin;
  }
  checkChange(e, index) {
    this.sourceChecked[index] = e;
    console.log(this.sourceChecked);
  }
  exportCombo(combo) {
    let htmlString = '',
      scriptString = '',
      { area, filesName } = combo._cfg.model,
      { html, css, component, className } = combo._cfg.model.config,
      // { nodes, combos } = combo.getChildren();
      { nodes: allNodes, combos: allCombos } = combo.getChildren();
    let nodes = allNodes.filter(
        (node) => !node.destroyed && node._cfg.model.comboId == combo._cfg.id
      ),
      combos = allCombos.filter(
        (com) => com._cfg.model.parentId == combo._cfg.id
      );
    // 保存组件的源文件
    filesName.forEach((file) => {
      let { decorator, name } =
        typeof file == 'string' ? { name: file, decorator: {} } : file;
      this.originFile[area + '/' + name] = decorator;
    });
    // 建立 node id与tagName的映射
    const originClass = window[className];

    //  导出当前combo数据
    let { html: s, js } = (originClass as any).extends({
      html,
      css,
      className,
    });
    const [origin, start, end] = s.match(
      /^(\<[a-z-0-9 ="';:#.%]+\>[\s\S]*)(\<\/([a-z-0-9]+)\>)$/
    );
    htmlString += start;
    scriptString += js;
    // 依顺序
    let sortKey =
      combo._cfg.model.config.css.style['flex-direction'] == 'row' ? 'x' : 'y';
    [...nodes, ...combos]
      .sort((a, b) => a._cfg.model[sortKey] - b._cfg.model[sortKey])
      .forEach((node) => {
        let { html, js } =
          node._cfg.type === 'node'
            ? this.exportNode(node)
            : this.exportCombo(node);
        htmlString += html;
        scriptString += js;
      });
    htmlString += end;
    return {
      html: htmlString,
      js: scriptString,
    };
  }
  // 导出节点数据
  exportNode(node) {
    const { area, filesName } = node._cfg.model;
    // 保存组件的源文件
    filesName.forEach((file) => {
      let { decorator, name } =
        typeof file == 'string' ? { name: file, decorator: {} } : file;
      this.originFile[area + '/' + name] = decorator;
    });
    let { html, css, className } = node._cfg.model.config;
    const originClass = window[className],
      index = (originClass as any).index;
    this.idMapTag.set(
      node._cfg.id.split('-')[1],
      (originClass as any).tagNamePrefix + '-' + index
    );
    return (originClass as any).extends({
      html,
      css,
      className,
    });
  }
  onEdit(status) {
    this.jsonOnEdit = status;
  }
  changeNodeLayout(layout) {
    // bboxCanvasCache储存的是旧的数据，更新后节点的中心点在model中，而且center不变
    if (this.focusCombo) {
      const { nodes, combos } = this.focusCombo.getChildren(),
        { minX, minY } = this.focusCombo._cfg.bbox,
        padding = this.focusCombo._cfg.model.padding,
        elements = nodes.concat(combos);
      // 根据 x轴，y轴 排序
      console.log(elements);
      let sortKey = layout == 'row' ? 'x' : 'y';
      elements.sort((a, b) => a._cfg.model[sortKey] - b._cfg.model[sortKey]);
      if (layout == 'row') {
        // 修改combo layout json
        this.focusCombo._cfg.model.config.css.style['flex-direction'] = 'row';
        if (elements.length == 0) {
          return;
        }
        elements.reduce((pre: any, element, index) => {
          const { bboxCanvasCache, type, model } = element._cfg;
          const { x, y } = model;
          let width = bboxCanvasCache.width;
          if (index == 0) {
            return {
              nextX: x + width,
              nextY: y,
            };
          } else {
            const { nextX, nextY } = pre;
            return this.deepUpdatePosition(element, nextX, nextY, 'width');
          }
        }, {});
      } else {
        // 修改combo layout json
        this.focusCombo._cfg.model.config.css.style['flex-direction'] =
          'column';
        if (elements.length == 0) {
          return;
        }
        elements.reduce((pre: any, element, index) => {
          const { bboxCanvasCache, type, model } = element._cfg;
          const { x, y } = model;
          let height = bboxCanvasCache.height;
          height = bboxCanvasCache.height;
          if (index == 0) {
            return {
              nextX: x,
              nextY: y + height,
            };
          } else {
            const { nextX, nextY } = pre;
            return this.deepUpdatePosition(element, nextX, nextY, 'height');
          }
        }, {});
      }
      this.graph.updateCombos();
    }
  }
  deepUpdatePosition(target, offsetX, offsetY, attr) {
    const { bboxCanvasCache, type } = target._cfg;
    let attValue = bboxCanvasCache[attr];
    if (type == 'node') {
      target.updatePosition({
        x: offsetX,
        y: offsetY,
      });
    } else if (type == 'combo') {
      this.deepUpdateCombo(target, offsetX, offsetY, attr);
    }
    return {
      nextX: offsetX + (attr == 'width' ? attValue : 0),
      nextY: offsetY + (attr == 'height' ? attValue : 0),
    };
  }
  deepUpdateCombo(target, originX, originY, attr) {
    const { model, bboxCanvasCache } = target._cfg;
    const { padding } = model;
    const { x, y } = model;
    let { nodes, combos } = target.getChildren();
    if (nodes.length == 0 && combos.length == 0) {
      console.log(target);
      this.updateComboPosition(
        target,
        originX + padding[3],
        originY + padding[0]
      );
      return;
    }
    [...nodes, ...combos].forEach((item) => {
      const { type } = item._cfg;
      if (type == 'node') {
        this.deepUpdatePosition(
          item,
          originX + padding[3],
          originY + padding[0],
          attr
        );
      } else {
        this.deepUpdateCombo(
          item,
          originX + padding[3],
          originY + padding[0],
          attr
        );
      }
    });
  }
  // combo 是自适应子节点的，updatePosition时，无法直接操作，需要更改子node
  updateComboPosition(combo: any, targetX: number, targetY: number) {
    const { nodes, combos } = combo.getChildren();
    if (nodes.length == 0 && combos.length == 0) {
      combo.updatePosition({
        x: targetX,
        y: targetY,
      });
      return;
    }
    nodes.concat(combos).forEach((item: any) => {
      const { type } = item._cfg;
      if (type == 'node') {
        item.updatePosition({
          x: targetX - 10,
          y: targetY,
        });
      } else if (type == 'combo') {
        this.updateComboPosition(item, targetX, targetY);
      }
    });
  }
  updateView(htmlConfig, cssConfig) {
    if (this.focusNode) {
      this.updateNode(htmlConfig, cssConfig);
    }
    if (this.focusCombo) {
      this.updateCombo();
    }
  }
  updateCombo() {
    let { combos, nodes } = this.graph.getComboChildren(this.focusCombo);
    let ids = [...combos, ...nodes].map((item) => item._cfg.id);
    console.log(ids);
    const model = this.focusCombo._cfg.model;
    const model2 = {
      ...model,
      id: model.id,
    };
    this.graph.uncombo(this.focusCombo);
    this.focusCombo = this.graph.createCombo(model2, ids);
    this.graph.updateCombos();
    this.focus(this.focusCombo);
  }
  updateNode(htmlConfig, cssConfig) {
    const model = this.focusNode._cfg.model,
      config = model.config,
      { className } = config;
    Object.assign(model.config.html, htmlConfig);
    Object.assign(model.config.css, cssConfig);
    // 更新 web component
    const { js, html } = (window[className] as any).extends(config);
    const tagName = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
    // 更新图
    let relationTarget = this.relationshipGraph.findById(model.id);
    const model2 = {
      ...model,
      id: model.id,
      tagName,
    };
    this.graph.removeItem(this.focusNode);
    // 节点需要更新 view
    if (this.focusNode) {
      this.createElement(html, JSON.parse(JSON.stringify(model2)), tagName, js);
      if (relationTarget) {
        this.relationshipGraph.updateItem(relationTarget, {
          ...relationTarget._cfg.model,
          config,
        });
        this.relationshipGraph.findById(model.id)._cfg.model.config = config;
      }
    }
    console.log(this.focusNode);
    this.graph.refreshPositions();
  }
  ngOnInit() {
    this.registerNodes();
    this.addGlobalEvent();
    this.initBoard();
    this.initRelationShip();
    this.renderScale();
  }
  changeCollapse(e, key) {
    this[key] = !this[key];
  }
  initRelationShip() {
    const width = 1920,
      height = 1080,
      graph = new G6.Graph({
        container: 'relation-ship',
        width,
        height,
        modes: {
          default: [
            'drag-node',
            // config the shouldBegin and shouldEnd to make sure the create-edge is began and ended at anchor-point circles
            'create-edge',
          ],
        },
        defaultNode: {
          type: 'rect-node',
        },
        defaultEdge: {
          type: 'quadratic',
          style: {
            stroke: '#F6BD16',
            lineWidth: 2,
          },
        },
        plugins: [ralationMenu],
      });
    this.relationshipGraph = graph;
    graph.read(this.data);
    this.relationshipGraphAddEvent();
  }
  initBoard() {
    const snapLine = new G6.SnapLine(),
      grid = new G6.Grid({});
    const width = 1920,
      height = 1080,
      graph = new G6.Graph({
        container: 'design-view',
        width,
        height,
        modes: {
          default: ['drag-node', 'drag-combo'],
        },
        nodeStateStyles: {
          focus: {
            lineWidth: 1,
            stroke: '#1085cac9',
            shadowOffsetX: 1,
            shadowOffsetY: 1,
            shadowColor: '#74b8e196',
            radius: 2,
          },
        },
        defaultNode: {
          type: 'rect-node',
        },
        defaultCombo: {
          type: 'container', // Combo 类型
        },
        plugins: [grid, snapLine],
        // renderer: 'canvas',
      });
    this.graph = graph;
    graph.read(this.data);
    this.graphAddEventListener();
  }

  focus(item) {
    if (!item) {
      return;
    }
    this.graph.setItemState(item, 'focus', true);
  }
  unFocus(item) {
    if (!item || item.destroyed) {
      return;
    }
    this.graph.setItemState(item, 'focus', false);
  }
  relationshipGraphAddEvent() {
    const graph = this.relationshipGraph;
    graph.on('aftercreateedge', (e) => {
      const newEdge = e.edge,
        edges = graph.save().edges;
      this.cacheSourceAndTargetNodeDataByEdge(newEdge);
      // update the sourceAnchor and targetAnchor for the newly added edge
      graph.updateItem(e.edge, {
        sourceAnchor: this.sourceAnchorIdx,
        targetAnchor: this.targetAnchorIdx,
      });

      // update the curveOffset for parallel edges
      processParallelEdgesOnAnchorPoint(edges);
      graph.getEdges().forEach((edge, i) => {
        graph.updateItem(edge, {
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
      this.isCreate = true;
      this.newEdge = newEdge;
      this.isVisible = true;
    });
    // if create-edge is canceled before ending, update the 'links' on the anchor-point circles
    graph.on('afterremoveitem', (e) => {
      if (e.item && e.item.source && e.item.target) {
        const sourceNode = graph.findById(e.item.source);
        const targetNode = graph.findById(e.item.target);
        const { sourceAnchor, targetAnchor } = e.item;
        if (sourceNode && !isNaN(sourceAnchor)) {
          const sourceAnchorShape = sourceNode
            .getContainer()
            .find(
              (ele) =>
                ele.get('name') === 'anchor-point' &&
                ele.get('anchorPointIdx') === sourceAnchor
            );
          sourceAnchorShape.set('links', sourceAnchorShape.get('links') - 1);
        }
        if (targetNode && !isNaN(targetAnchor)) {
          const targetAnchorShape = targetNode
            .getContainer()
            .find(
              (ele) =>
                ele.get('name') === 'anchor-point' &&
                ele.get('anchorPointIdx') === targetAnchor
            );
          targetAnchorShape.set('links', targetAnchorShape.get('links') - 1);
        }
      }
    });
    // after clicking on the first node, the edge is created, update the sourceAnchor
    graph.on('afteradditem', (e) => {
      if (e.item && e.item.getType() === 'edge') {
        graph.updateItem(e.item, {
          sourceAnchor: this.sourceAnchorIdx,
        });
      }
    });
    // some listeners to control the state of nodes to show and hide anchor-point circles
    graph.on('node:mouseenter', (e) => {
      graph.setItemState(e.item, 'showAnchors', true);
    });
    graph.on('node:mouseleave', (e) => {
      graph.setItemState(e.item, 'showAnchors', false);
    });
    graph.on('edge:click', (e) => {
      console.log(e.item._cfg.model.label);
      this.newEdge = e.item;
      this.isVisible = true;
      this.isCreate = false;
      this.selectedIndex = e.item._cfg.model.edgeType;
      const label = e.item._cfg.model.label;
      this.cacheSourceAndTargetNodeDataByEdge(e.item);
      //回显数据
      if (this.selectedIndex == LineType.event) {
        // 分割线 ->
        let [event, fn] = label.split('->');
        this.eventName = event;
        this.methodName = fn;
      } else if (this.selectedIndex == LineType.data) {
        // 分割线 =
        let [hook, sourceData, targetData] = label.split(/[ =]/);
        this.hook = hook;
        this.key = sourceData;
        this.value = targetData;
      } else if (this.selectedIndex == LineType.params) {
        // 分割线 =>
        let [data, method] = label.split('=>');
        let selectedValue = JSON.parse(data);
        this.sourceChecked = this.sourceData.map((value) =>
          selectedValue.includes(value)
        );
        this.method = method;
      }

      console.log(e);
    });
    graph.on('node:click', (e) => {
      console.log('ralation', e);
    });
  }
  // 通过edge 将source和target节点的数据缓存
  cacheSourceAndTargetNodeDataByEdge(edge) {
    const { sourceNode, targetNode } = edge._cfg,
      {
        event: sourceEvents,
        methods: sourceMethods,
        params: sourceParams,
        data: sourceData,
      } = sourceNode._cfg.model.config.component,
      {
        methods: targetMethods,
        params: targetParams,
        data: targetData,
      } = targetNode._cfg.model.config.component;
    this.sourceEvents = sourceEvents;
    this.sourceMethods = sourceMethods;
    this.targetMethods = targetMethods;
    this.sourceData = sourceData;
    this.sourceChecked = new Array(sourceData.length).fill(false);
    this.targetData = targetData;
  }
  graphAddEventListener() {
    const graph = this.graph;
    window['graph'] = graph;
    graph.on('click', (evt) => {
      this.isCreate = false;
      const { item } = evt;
      if (item !== this.focusNode) {
        if (this.focusNode) {
          this.unFocus(this.focusNode);
          this.focusNode = null;
        } else {
        }
      }
    });
    graph.on('node:click', (evt) => {
      this.focusCombo = null;
      const { item } = evt,
        { html, css } = item._cfg.model.config;
      this.unFocus(this.focusNode);
      this.focus(item); //focus当前节点
      this.focusNode = item;
      console.log(this.bus);
      this.bus.center.next({
        html,
        css,
        type: 'config',
      });
      this.onEdit(false);
    });
    graph.on('combo:click', (evt) => {
      // 展示combo  json 数据
      const { item } = evt,
        { html, css } = item._cfg.model.config;
      this.focusCombo = item;
      this.bus.center.next({
        html,
        css,
        type: 'config',
      });
      this.onEdit(false);
    });
    graph.on('node:mouseenter', (evt) => {
      const { item } = evt;
      this.focus(item);
    });
    graph.on('node:mouseleave', (evt) => {
      const { item } = evt;
      if (this.focusNode !== item) {
        this.unFocus(item);
      }
    });
    graph.on('keydown', (evt: any) => {
      if (this.jsonOnEdit) {
        return;
      }
      const { item, keyCode } = evt;
      if (keyCode === 46) {
        //delete
        let node = this.focusNode || this.focusCombo;
        const { tagName } = node.getModel();
        graph.removeItem(node);
        this.focusNode = null;
        // 在关联图删除对应节点
        const relationNode = this.relationshipGraph.find('node', (node) => {
          return node.get('model').tagName === tagName;
        });
        this.relationshipGraph.removeItem(relationNode);
      } else if (keyCode >= 37 && keyCode <= 40) {
        // 左上右下
        if (this.focusNode) {
          let { x, y } = this.focusNode._cfg.model;
          switch (keyCode) {
            case 37:
              x -= 10;
              break;
            case 38:
              y -= 10;
              break;
            case 39:
              x += 10;
              break;
            case 40:
              y += 10;
              break;
          }
          this.focusNode.updatePosition({
            x,
            y,
          });
          evt.preventDefault();
          evt.stopPropagation();
        }
      }
    });
  }
  addGlobalEvent() {
    const that = this;
    document.addEventListener(
      'dragstart',
      function (event) {
        that.dragTarget = event.target;
        // 使其半透明
        (event.target as HTMLElement).style.opacity = '0.5';
      },
      false
    );
    document.addEventListener(
      'dragend',
      function (event) {
        // 重置透明度
        (event.target as HTMLElement).style.opacity = '';
      },
      false
    );
    document.addEventListener(
      'drop',
      function (event) {
        if ((event.target as HTMLElement).tagName === 'CANVAS') {
          let { offsetX, offsetY } = event,
            { id } = that.dragTarget as HTMLElement,
            view = (that.dragTarget as any).view,
            nodeType = (that.dragTarget as any).node,
            targetX = offsetX,
            targetY = offsetY,
            targetType = (that.dragTarget as any).comonentType,
            component = (that.dragTarget as any).component,
            area = (that.dragTarget as any).area,
            filesName = (that.dragTarget as any).filesName;
          console.log(component);
          // 阻止默认动作（如打开一些元素的链接）
          event.preventDefault();
          // 将拖动的元素到所选择的放置目标节点中

          const nodeSetting = window[component]['configurable'],
            { className } = nodeSetting;
          const { js, html } = (window[className] as any).extends(nodeSetting);
          let tagName = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
          const UUID = Math.random();
          let config = {
            x: targetX,
            y: targetY,
            config: nodeSetting,
            area,
            filesName,
          };
          //
          if (targetType === 'node') {
            if (view & NodePosition.view) {
              if (nodeType) {
                that.focusNode = that.graph.addItem('node', {
                  tagName: tagName,
                  ...config,
                  id: 'view' + '-' + String(UUID),
                  type: nodeType || 'common',
                });
                that.focus(that.focusNode);
              } else {
                that.createElement(
                  html,
                  {
                    tagName: tagName,
                    ...config,
                    id: 'view' + '-' + String(UUID),
                    type: nodeType || 'common',
                  },
                  tagName,
                  js
                );
              }
            }
            if (view & NodePosition.relation) {
              that.relationshipGraph.addItem('node', {
                tagName: tagName,
                ...config,
                id: 'relation' + '-' + String(UUID) + '-' + '0',
                type: nodeType || id,
                label: id,
              });
            }
          } else if (targetType === 'combo') {
            Object.assign(config, {
              label: id,
              id: 'view' + '-' + String(UUID),
            });
            if (view & NodePosition.view) {
              that.graph.createCombo({ ...config, type: 'container' }, []);
            }
            if (view & NodePosition.relation) {
              that.relationshipGraph.addItem('node', {
                ...config,
                id: 'relation' + '-' + String(UUID) + '-' + '0',
              });
            }
          }
        }
      },
      false
    );
  }
  // 创建 web-components 再转化成img 映射到 画布
  createElement(html: string, mode: any, tagName, js) {
    let container = document.createElement('div'),
      css = document.createElement('style'),
      script = document.createElement('script');
    container.innerHTML = html;
    const div = container.firstChild as HTMLElement;
    script.innerHTML = js;
    // css.innerHTML = `${tagName}{display:inline-block}`;
    document.querySelector('app-cache').append(div, css, script);
    // 映射
    setTimeout(() => {
      console.log('create Component', div);
      // 获取真实组件
      // 获取的 dom 是 生成 web component时定义的一个外层，表现形式类似div，宽度默认是100% 在映射到视图区时有空白内容;
      // 强制 web component 内部只有一个根标签，容易获取。
      // Angular 可直接获取子节点。
      // Vue 有一层 shadowRoot包裹，需要更深入取值。
      let component, children;
      if (div.shadowRoot) {
        children = div.shadowRoot.children;
      } else {
        children = div.children;
      }
      for (let node of children) {
        let tagName = node;
        if (!['STYLE', 'SCRIPT'].includes(tagName)) {
          component = node;
          break;
        }
      }
      // @ts-ignore
      html2canvas(component).then((canvas) => {
        let base = canvas.toDataURL('img');
        Object.assign(mode, {
          img: {
            base,
            width: component.offsetWidth,
            height: component.offsetHeight,
          },
        });
        this.focusNode = this.graph.addItem('node', { ...mode });
        // this.focusNode.toFront();
        let parentCombo = this.graph.findById(
          this.focusNode._cfg.model.comboId
        );
        if (parentCombo) {
          this.graph.refreshItem(parentCombo);
        }
        console.log('this.focusNode', this.focusNode, parentCombo);
        this.focus(this.focusNode);
      });
    });
  }
  handleCancel() {
    if (this.isCreate) {
      this.deleteEdge();
    } else {
      this.isVisible = false;
    }
  }
  deleteEdge() {
    this.removeEdge();
    this.isVisible = false;
  }
  removeEdge() {
    this.relationshipGraph.removeItem(this.newEdge);
    this.newEdge = null;
  }
  handleOk() {
    let labels = [[this.eventName, this.methodName]],
      backs = this.getBackStatus();
    for (let i = 0; i < backs.length; i++) {
      labels.push([backs[i].value, this.methods[i]]);
    }
    console.log(this.newEdge._cfg.model);
    // 应用箭头样式
    Object.assign(
      this.newEdge._cfg.model.style,
      enumArrow[this.selectedIndex].style
    );
    if (this.selectedIndex === LineType.event) {
      this.newEdge.update({
        ...this.newEdge._cfg.model,
        edgeType: this.selectedIndex,
        label: `${labels.map((item) => item.join('->')).join('\n')}`,
      });
    } else if (this.selectedIndex === LineType.data) {
      this.newEdge.update({
        ...this.newEdge._cfg.model,
        edgeType: this.selectedIndex,
        label: `${this.hook} ${this.key}=${this.value}`,
      });
    } else if (this.selectedIndex === LineType.params) {
      let dataCache = [];
      for (let i = 0; i < this.sourceChecked.length; i++) {
        if (this.sourceChecked[i]) {
          dataCache.push(this.sourceData[i]);
        }
      }
      this.newEdge.update({
        ...this.newEdge._cfg.model,
        edgeType: this.selectedIndex,
        label: `${JSON.stringify(dataCache)}=>${this.method}`,
      });
    }

    this.isVisible = false;
    console.log(this.selectedIndex);
    // this.modalService.openModals[0]._finishDialogClose(); // ng-modal 编译后数据非双向绑定
  }
  getBackStatus() {
    return (
      (
        this.targetMethods.filter(
          (item) => item.value === this.methodName
        )[0] || []
      ).children || []
    );
  }
  publishCancel() {
    this.publishIsVisible = false;
  }
  publishHandleOk() {
    //@ts-ignore
    let files = {
      ...this.originFile,
    };
    let defineComponent = `
    customElements.define('${this.tagName}',
      class MyComponent extends HTMLElement{
        template = \`${this.htmlS}\`;
        constructor(){
          super();
          this.innerHTML = this.template;
        }
      }
    );`;
    //定义web component  组件逻辑
    let jsContent = `
    ${defineComponent}
    ${this.businessCodeJS}
    `;
    console.log(files, this.tagName, jsContent);
    this.service
      .publishApplication({
        appName: this.appName,
        tagName: this.tagName,
        script: files,
        component: {
          src: `store/application/${this.appName}/${this.tagName}-${this.logicHash}.js`,
        },
        logic: jsContent,
        fileName: `${this.tagName}-${this.logicHash}.js`,
      })
      .subscribe((res: any) => {
        const { code, data } = res;
        if (code == 200) {
          this.publishIsVisible = false;
        }
      });
  }
}

import { DatePipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  OnInit,
  Output,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzTabsCanDeactivateFn } from 'ng-zorro-antd/tabs';
import G6 from '../../../g6.min.js';
import { CommunicationService } from '../communication.service';
import { ralationMenu } from '../node-menu/relation-menu.js';
import { enumArrow } from '../view-edges/index.js';
import {
  registerAPI,
  registerBlock,
  registerBox,
  registerButton,
  registerCommon,
  registerContainer,
  registerDefault,
  registerDialog,
  registerHook,
  registerInput,
  registerMessage,
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
// 节点的类型：
// 1. 普通类型  参与布局和逻辑 button，input..
// 2. 普通+额外布局 除内层布局外还有额外的布局 tabview
// 3. 额外布局 不参与普通布局，只有额外布局 dialog，message
// 4. 抽象节点无布局 api，hook
enum ViewModel {
  normalView,
  normalAndAdditionalView,
  additionalView,
  noView,
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
  providers: [DatePipe],
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
  @ViewChildren('tabs') tabs;
  @ViewChild('area') area;
  @Output('onConfig') onConfig = new EventEmitter();
  areaMapNodes = new Map(); // Map<区域id, nodes>
  nodeMapArea = new Map(); // Map<node, 区域id>
  // 绘制容器的精确度【】
  step = 10;
  // 容器的width，height;
  VW = 1920;
  VH = 1080;
  areaRange = {
    x: [],
    y: [],
  };
  areaNodesModel = new Map();
  aloneNodesModel: Set<any> = new Set();
  viewModel: ViewModel = ViewModel.normalView;
  originFile = {};
  // 判断是否按下Control键
  control = false;
  businessCodeJS = '';
  htmlS = '';
  appName = '';
  tagName = '';
  logicHash: number;
  logicName = '';
  logicContent = '';
  cacheNodes = {
    normalView: [],
    normalAndAdditionalView: [],
    additionalView: [],
    noView: [],
  };
  isVisible: boolean = false;
  dialogConfigVisible: boolean = false;
  tabsConfigDialog = false;
  indexDialog = 0;
  indexTabs = 0;
  indexTab = 0;
  currentCacheIndex = 0;
  currentCacheView;
  indexVirtually = 0;
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
  targetGraph;
  graph: any;
  dialogGraph: any;
  tabsGraphs: any[] = [];
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
  // 导出的 html js 字符串
  html = '';
  js = '';
  clickCount = 0;
  constructor(
    private cd: ChangeDetectorRef,
    private service: CommunicationService,
    private modalService: NzModalService,
    private message: NzMessageService,
    private dataPipe: DatePipe,
    @Inject('bus') private bus
  ) {
    this.bus.center.subscribe((res: any) => {
      const { html, css, type, value } = res;
      switch (type) {
        case 'update':
          this.updateView(html, css);
          break;
        case 'status':
          this.onEdit(value);
          break;
      }
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
    registerHook();
    registerCommon();
    registerMessage();
    registerBox();
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
    if (this.tabView === 'design-view') {
      this.tabView = 'relation-ship';
    } else {
      this.tabView = 'design-view';
    }
  }
  // 缓存节点配置
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
      normalAndAdditionalView: this.cacheNodes.normalAndAdditionalView,
      additionalView: this.cacheNodes.additionalView.map((graph) => {
        const { tagName, model, nodes } = graph;
        return {
          tagName,
          model: JSON.parse(JSON.stringify(model)),
          nodes,
        };
      }),
      noView: this.cacheNodes.noView.map((graph) => {
        const { tagName, model, nodes } = graph;
        return {
          tagName,
          model: JSON.parse(JSON.stringify(model)),
          nodes,
        };
      }),
    };
    let cacheCopy = JSON.parse(JSON.stringify(cache));
    const relationNodes = cacheCopy.relation.nodes,
      viewNodes = cacheCopy.view.nodes;
    let tagMap = new Map();
    // 替换 tagName 以避免在缓存后应用节点时tagName冲突
    for (let node of [...viewNodes, ...relationNodes]) {
      const { tagName } = node;
      if (tagMap.has(tagName)) {
        node['tagName'] = tagMap.get(tagName);
      } else {
        let [pre1, pre2, id] = tagName.split('-');
        let newTagName = `${pre1}-${pre2}-${String(Math.random()).substring(
          2
        )}`;
        node['tagName'] = newTagName;
        tagMap.set(tagName, newTagName);
      }
    }
    this.cacheConfig({ ...params, json: JSON.stringify(cacheCopy) });
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
    let {
      view,
      relation,
      additionalView = [],
      noView = [],
      normalAndAdditionalView,
    } = JSON.parse(json);
    this.graph.read(view);
    this.cacheNodes.normalAndAdditionalView = normalAndAdditionalView;
    this.cacheNodes.additionalView = additionalView;
    this.cacheNodes.noView = noView;
    // 渲染连线图
    this.relationshipGraph.read(relation);
    this.message.create('success', '应用组件配置成功');
  }
  clearGraph() {
    this.graph.read({});
  }
  getScriptConfig() {
    this.originFile = {};
    // 保存组件的源文件
    let nodesModel = this.graph.getNodes().map((node) => {
      return {
        ...node._cfg.model,
      };
    });
    // 获取内层 graph的 节点的依赖
    this.cacheNodes.normalAndAdditionalView.forEach((item) => {
      const { tabs } = item;
      tabs.forEach((nodes) => {
        nodes.forEach((node) => {
          nodesModel.push({ ...node });
        });
      });
    });
    this.cacheNodes.additionalView.forEach((model) => {
      nodesModel.push({ ...model });
    });
    this.cacheNodes.noView.forEach((model) => {
      nodesModel.push({ ...model });
    });
    [...nodesModel].forEach((model) => {
      const { filesName, area } = model;
      filesName.forEach((file) => {
        let { decorator, name } =
          typeof file == 'string' ? { name: file, decorator: {} } : file;
        this.originFile[area + '/' + name] = decorator || {};
      });
    });
  }
  scriptConfigKeys() {
    return Object.keys(this.originFile);
  }
  // 导出数据
  exportData() {
    this.html = '';
    this.js = '';
    this.grid();
    this.logicHash = Math.random();
    this.getScriptConfig();
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
                sourceDOM.addEventListener('${event}', (e)=>{
                  let targetIns = targetPath.length ? targetPath.reduce((pre,key)=>key ? pre[key] : pre,targetDOM) : targetDOM;
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
              sourceDOM.addEventListener('${hook}',()=>{
                let sourceIns = sourcePath.length ? sourcePath.reduce((pre,key)=>key ? pre[key] : pre,sourceDOM) : sourceDOM,
                    targetIns = targetPath.length ? targetPath.reduce((pre,key)=>key ? pre[key] : pre,targetDOM) : targetDOM;
                targetIns.${targetData} = sourceIns.${sourceData};
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
            let sourceIns = sourcePath.length ? sourcePath.reduce((pre,key)=>key ? pre[key] : pre,sourceDOM) : sourceDOM,
                targetIns = targetPath.length ? targetPath.reduce((pre,key)=>key ? pre[key] : pre,targetDOM) : targetDOM;   
            if(!targetIns['${fn}'].params){
              targetIns['${fn}'].params = []
            }
            targetIns['${fn}'].params.push([sourceIns,${data}]);
          })();  
          `;
        }
      })
      .join();
    this.js += `;${jsString}`;
  }
  downloadFile() {
    this.exportData();
    let timeID = this.dataPipe.transform(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const htmlFile = `index${timeID}.html`,
      jsFile = `logic${timeID}.js`;
    // 插入base
    let scriptString = ``,
      cssString = ``;
    Object.entries(this.originFile).forEach((file: any) => {
      const [name, decorator] = file;
      if (name.endsWith('.js')) {
        scriptString += `<script src="http://localhost:3000/${name}"`;
        Object.entries(decorator || {}).forEach((config) => {
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
          template = \`${this.html}\`;
          constructor(){
            super();
            this.innerHTML = this.template;
          }
          connectedCallback(){
            console.log('应用: connectedCallback')
          }
        }
      );
      ${this.js};
      `;
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
              <script src="./${jsFile}" defer></script>
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
    a.download = htmlFile;
    document.body.appendChild(a);
    a.click();
    // 下载logic.js
    const logicBlob = new Blob([customElementScript], {
        type: 'application/ecmascript',
      }),
      jsHref = URL.createObjectURL(logicBlob);
    a.href = jsHref;
    a.download = jsFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    return;
  }
  publishAPP() {
    this.exportData();
    this.publishIsVisible = true;
    this.publishIsVisible = true;
    // 展示 组件需要的 script配置;
  }
  //整理节点，使关系节点和视图节点排布匹配
  gridNode() {
    console.log('整理节点');
    const relationNodes = this.relationshipGraph.getNodes();
    relationNodes.forEach((node) => {
      const id = node._cfg.id.split('-')[1];
      const viewNode = this.graph.findById(`view-${id}`);
      // 在节点在dialog中
      if (!viewNode) {
        return;
      }
      const { x, y, img } = viewNode._cfg.model;
      node.updatePosition({
        x: x + ((img && img.width / 2) || 0),
        y: y + ((img && img.height / 2) || 0),
      });
    });
  }
  // grid 布局解析
  grid() {
    // 1. 普通节点
    // 2. 有slot并参与布局的节点：  tabview
    // 3. 有slot，不参加布局的节点：dialog
    // 4. 无slot，不参加布局的节点：api，hook,message
    const nodesModel = this.graph.getNodes().map((node) => {
      return {
        ...node._cfg.model,
      };
    });
    this.getBoxNodes(nodesModel, this.VW, this.VH);
    // 处理 dialog 类型节点
    this.cacheNodes.additionalView.forEach((dialog) => {
      const { tagName, model, nodes } = dialog;
      // 导出dialog节点
      const { html, js } = this.exportNode(model);
      let tag = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
      let tagOpen = html.slice(0, html.length - tag.length - 3);
      this.html += tagOpen;
      this.getBoxNodes(
        nodes,
        model.config.html.width.value,
        model.config.html.height.value
      );
      this.html += `</${tag}>`;
      this.js += js;
    });
    // 处理虚拟节点
    this.cacheNodes.noView.forEach((virtual) => {
      const { tagName, model, nodes } = virtual;
      // 导出d虚拟节点
      const { html, js } = this.exportNode(model);
      this.html += html;
      this.js += js;
    });
  }
  // 创建新的 web component，
  // 因为在使用tab组件时，嵌套的web component 作为slot插入tab时，只有第一页可显示，在切换时slot内的web component会消失;
  newWebComponent(tagName, nodes, width, height) {
    let cacheTHIShTML = this.html;
    this.html = ``;
    this.getBoxNodes(nodes, width, height);
    // 新建的shadowDOM 会隔绝style，需插入到shadow中
    // icon 采用的是引用式的，会被shadow遮蔽
    //TODO:暂时不采用shadow
    let styles = nodes.map((node) => {
      const { area, filesName } = node;
      let files =
        filesName.filter(
          (file) => typeof file == 'string' && file.endsWith('.css')
        ) || [];
      return files.map((file) => area + '/' + file);
    });
    let stylesSet = new Set();
    styles.forEach((style) =>
      stylesSet.add(
        `<link rel="stylesheet" href="http://localhost:3000/${style}"/>`
      )
    );

    let defineComponent = `
    customElements.define('${tagName}',
      class MyComponent extends HTMLElement{
        template = \`${this.html}\`;
        constructor(){
          super();
          // let shadow = this.attachShadow({mode: 'open'});
          let ele = document.createElement('div');
          ele.innerHTML = this.template;
          this.append(ele);
        }
      }
    );`;
    this.js += defineComponent;
    this.html = cacheTHIShTML;
    console.log(defineComponent);
  }
  // 根据节点分配网格
  allocationGrid(nodesModel, containerWidth, containerHeight) {
    let XAxisInterval = [Infinity, -Infinity],
      YAxisInterval = [Infinity, -Infinity];
    // 获取节点的范围
    nodesModel.forEach((model) => {
      const { x, y, img, config, width: boxWidth, height: boxHeight } = model,
        { width: cW, height: cH } = config.css,
        { width: imgWidth, height: imgHeight } = img;
      // 图片width/height，容器width/height 和 box 的 width/ height
      const width = Math.max(boxWidth || 0, cW ? cW.value : 0, imgWidth || 0);
      const height = Math.max(
        boxHeight || 0,
        cH ? cH.value : 0,
        imgHeight || 0
      );
      XAxisInterval[0] = Math.min(XAxisInterval[0], x);
      XAxisInterval[1] = Math.max(XAxisInterval[1], x + width);
      YAxisInterval[0] = Math.min(YAxisInterval[0], y);
      YAxisInterval[1] = Math.max(YAxisInterval[1], y + height);
    });
    console.log(XAxisInterval, YAxisInterval);
    // 调整范围, 适应grid的精确度
    let gridXStart = XAxisInterval[0] - (XAxisInterval[0] % this.step),
      gridXEnd = XAxisInterval[1] - (XAxisInterval[1] % this.step) + this.step,
      gridYStart = YAxisInterval[0] - (YAxisInterval[0] % this.step),
      gridYEnd = YAxisInterval[1] - (YAxisInterval[1] % this.step) + this.step;
    console.log([gridXStart, gridXEnd], [gridYStart, gridYEnd]);
    // 创建grid区域
    let areas = Array.from(new Array(containerHeight / this.step), () =>
      new Array(containerWidth / this.step)
        .fill('*')
        .map(() => String(Math.floor(Math.random() * 1000000000000)))
    );
    console.log(areas);
    // 节点区域染色
    window['areas'] = areas;
    nodesModel.forEach((model) => {
      const { x, y, img, config, width: boxWidth, height: boxHeight } = model,
        { width: cW, height: cH } = config.css,
        { width: imgWidth, height: imgHeight } = img;
      // 图片width/height，容器width/height 和 box 的 width/ height
      const width = Math.max(boxWidth || 0, cW ? cW.value : 0, imgWidth || 0);
      const height = Math.max(
        boxHeight || 0,
        cH ? cH.value : 0,
        imgHeight || 0
      );
      let xAxis = [x - (x % this.step), x + width - ((x + width) % this.step)],
        yAxis = [y - (y % this.step), y + height - (height % this.step)];
      // 检查当前节点 覆盖的区域是否有其他节点
      // 将当前区域的节点 统一区域id
      let area = this.UUID();
      this.nodeMapArea.set(model, area);
      for (let i = yAxis[0] / this.step; i <= yAxis[1] / this.step; i++) {
        for (let j = xAxis[0] / this.step; j <= xAxis[1] / this.step; j++) {
          // 当前节点所要染色的区域内，若有其他节点
          if (isNaN(Number(areas[i][j]))) {
            this.nodeMapArea.set(areas[i][j], area);
          } else {
            areas[i][j] = model;
          }
        }
      }
    });
    // 还原区域占位【area中原来是node占位，还原为 id占位】
    for (let i = 0; i < areas.length; i++) {
      for (let j = 0; j < areas[i].length; j++) {
        // 当前节点所要染色的区域内，若有其他节点
        if (isNaN(Number(areas[i][j]))) {
          areas[i][j] = this.nodeMapArea.get(areas[i][j]);
        }
      }
    }
    nodesModel.forEach((model) => {
      let area = this.nodeMapArea.get(model);
      let areaNodes = this.areaMapNodes.get(area);
      if (!areaNodes) {
        areaNodes = [];
        this.areaMapNodes.set(area, areaNodes);
      }
      areaNodes.push(model);
    });
    let gridTemplate = areas.map((row) => `'${row.join(' ')}'`).join('\n');
    this.html += `<div style="display:grid;
                    grid-template-areas:${gridTemplate};
                    grid-template-rows: repeat(${Math.floor(
                      containerHeight / this.step
                    )}, ${this.step}px);
                    grid-template-columns: repeat(${Math.floor(
                      containerWidth / this.step
                    )},  ${this.step}px);">`;
    // 区域包裹node
    for (let [area, nodesModel] of this.areaMapNodes.entries()) {
      let childHtml = ``;
      // 精细布局pdding。
      let padding = [Infinity, Infinity, Infinity, Infinity];
      nodesModel
        .sort((model1, model2) => model1.x - model2.x)
        .forEach((model) => {
          let { html, js } = this.exportSwitchNode(model);
          childHtml += html;
          this.js += js;
          // 求padding
          const { x, y, img, tagName, config } = model,
            { width: cW, height: cH } = config.css,
            { width, height } = img;
          padding[0] = Math.min(padding[0], y % this.step);
          padding[1] = Math.min(
            padding[1],
            (Math.floor((x + Math.max(width, cW ? cW.value : 0)) / this.step) +
              1) *
              this.step -
              (x + Math.max(width, cW ? cW.value : 0))
          );
          padding[2] = Math.min(
            padding[2],
            (Math.floor((y + Math.max(height, cH ? cH.value : 0)) / this.step) +
              1) *
              this.step -
              (y + Math.max(height, cH ? cH.value : 0))
          );
          padding[3] = Math.min(padding[3], x % this.step);
        });
      this.html += `<div style="grid-area:${area};padding:${padding
        .map((pad) => pad + 'px')
        .join(' ')}">`;
      this.html += childHtml;
      this.html += '</div>';
    }
    this.html += '</div>';
  }
  exportSwitchNode(model): { html: string; js: string } {
    const { id, type, width, height } = model;
    // 当前节点是否是 tabview类节点
    const target = this.cacheNodes.normalAndAdditionalView.find(
      (item) => item.model.id == id
    );
    if (!target) {
      return this.exportNode(model);
    } else {
      let htmlS = ``,
        jsS = ``;
      const { model, tabs } = target;
      // 导出tabs节点
      const { html, js } = this.exportNode(model);
      let tag = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
      let tagOpen = html.slice(0, html.length - tag.length - 3);
      htmlS += tagOpen;
      tabs.forEach((tab, index) => {
        let slotTag = `my-component-${String(Math.random()).slice(2)}`;
        htmlS += `<${slotTag} slot='slot${index}'>`;
        console.log(`<${slotTag} slot='slot${index}'>`);
        this.newWebComponent(
          slotTag,
          tab,
          model.config.html.width.value,
          model.config.html.height.value
        );
        htmlS += `</${slotTag}>`;
      });
      htmlS += `</${tag}>`;
      jsS += js;
      return { html: htmlS, js: jsS };
    }
  }
  checkChange(e, index) {
    this.sourceChecked[index] = e;
  }
  exportCombo(combo) {
    let htmlString = '',
      scriptString = '',
      { html, css, component, className } = combo._cfg.model.config;
    // 建立 node id与tagName的映射
    const originClass = window[className];
    //  导出当前combo数据
    let { html: s, js } = (originClass as any).extends({
      html,
      css,
      className,
    });
    const [origin, start, end, tagName] = s.match(
      /^(\<[a-zA-Z-0-9 _="';:#.%\n]+\>[\s\S]*)(\<\/([a-z-0-9]+)\>)$/
    );
    this.idMapTag.set(combo._cfg.id.split('-')[1], tagName);
    htmlString += start;
    scriptString += js;
    return {
      html: htmlString,
      js: scriptString,
    };
  }
  // 导出节点数据
  exportNode(model) {
    const { id, type, width, height, x, y } = model;
    const { html, css, className } = model.config;
    // 区域节点
    if (type == 'box') {
      const {
        'background-color': baC,
        'border-width': bW,
        'border-radius': bR,
        'border-style': bS,
        'border-color': bC,
      } = css;
      // 处理区域节点内的子节点
      let cacheHtml = this.html;
      this.html = '';
      let children = this.areaNodesModel.get(model);
      let areaID = this.nodeMapArea.get(model);
      cacheHtml += `<div 
                         style="
                         width:${width}px;
                         height:${height}px;
                         background-color:${baC.value};
                         border:${bW.value}px ${bS.value} ${bC.value};
                         border-radius:${bR.value}px;">`;
      // 处理子区域内的节点
      this.getBoxNodes(children, width, height, x, y);
      cacheHtml += this.html;
      cacheHtml += `</div>`;
      this.html = cacheHtml;
      return {
        html: ``,
        js: ``,
      };
    } else {
      // 普通节点
      const originClass = window[className];
      const { html: htmlString, js: jsString } = (originClass as any).extends({
        html,
        css,
        className,
      });
      const tagName = htmlString.match(/\<\/([0-9\-a-z]*)\>$/)[1];
      this.idMapTag.set(id.split('-')[1], tagName);
      return {
        html: htmlString,
        js: jsString,
      };
    }
  }
  onEdit(status) {
    this.jsonOnEdit = status;
  }
  updateView(htmlConfig, cssConfig) {
    if (this.focusNode) {
      this.updateNode(htmlConfig, cssConfig);
    }
    // dialog节点
    else if (!this.focusNode) {
      Object.assign(
        this.currentCacheView[this.currentCacheIndex].model.config,
        {
          html: htmlConfig,
          css: cssConfig,
        }
      );
    }
  }
  updateNode(htmlConfig, cssConfig) {
    const model = this.focusNode._cfg.model,
      config = model.config,
      { className } = config;
    const { type } = model;
    // box类型的节点无组件,直接更新节点

    if (type == 'box') {
      const model2 = {
        ...model,
        id: model.id,
      };
      this.targetGraph.removeItem(this.focusNode);
      let box = this.targetGraph.addItem('node', model2);
      const { x, y, width, height, id } = box._cfg.model;
      const nodes = this.targetGraph.getNodes().filter((node) => {
        const { x: nx, y: ny, width: nw, height: nh, type } = node._cfg.model;
        return (
          type == 'box' &&
          nx <= x &&
          ny <= y &&
          nx + nw >= x + width &&
          ny + nh >= y + height
        );
      });
      let area = nodes.sort((a, b) => {
        const { width: aw, height: ah } = a._cfg.model,
          { width: bw, height: bh } = b._cfg.model;
        return aw * ah - bw * bh;
      });
      area.forEach((node) => {
        node.toBack();
      });
      box.lock();
      this.focus(box);
      this.focusNode = box;
      return;
    }
    Object.assign(model.config.html, htmlConfig);
    Object.assign(model.config.css, cssConfig);
    // 更新 web component
    const { js, html } = (window[className] as any).extends(config);
    const tagName = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
    // 更新图
    let relationTarget = this.relationshipGraph.findById(
      model.id.replace('view', 'relation')
    );
    const model2 = {
      ...model,
      id: model.id,
      tagName,
    };
    // 节点需要更新 view
    if (this.focusNode) {
      // 普通的节点都是 dom映射
      if (model2.type == 'common') {
        this.targetGraph.removeItem(this.focusNode);
        this.createElement(
          html,
          JSON.parse(JSON.stringify(model2)),
          tagName,
          js
        );
      } else {
        // request 是一个抽象出来的节点
        this.targetGraph.updateItem(this.focusNode, {
          ...this.focusNode._cfg.model,
          config,
        });
      }
      if (relationTarget) {
        this.relationshipGraph.updateItem(relationTarget, {
          ...relationTarget._cfg.model,
          config,
        });
        // relationTarget._cfg.model.config = config;
      }
    }
    this.targetGraph.refreshPositions();
  }
  ngOnInit() {
    this.registerNodes();
    this.addGlobalEvent();
    this.initBoard();
    this.initRelationShip();
    // 刻度尺
    // this.renderScale();
  }
  openDialog(e) {
    this.initDialog();
  }
  afterOpenTabs(e) {
    this.initTabs();
  }
  closeDialog(e) {
    this.focusNode = null;
    this.bus.center.next({
      html: {},
      css: {},
      type: 'config',
    });
    this.dialogConfigVisible = false;
    // 将dialog 上的节点缓存，下次打开时使用
    this.cacheNodes.additionalView[this.indexDialog].nodes = this.targetGraph
      .getNodes()
      .map((node) => {
        return {
          ...node._cfg.model,
        };
      });
    this.targetGraph = this.graph;
    this.onConfig.emit(false);
  }
  closeTabs(e) {
    this.cacheNodes.normalAndAdditionalView[this.indexTabs].tabs[
      this.indexTab
    ] = this.tabsGraphs[this.indexTab].getNodes().map((node) => {
      return {
        ...node._cfg.model,
      };
    });
    this.tabsGraphs = [];
    this.tabsConfigDialog = false;
    this.targetGraph = this.graph;
  }
  afterCloseTabs(e) {}
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
          default: ['drag-node', 'create-edge'],
        },
        defaultNode: {
          type: 'rect',
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
  initDialog() {
    const snapLine = new G6.SnapLine(),
      grid = new G6.Grid({});
    const { width, height } =
      this.cacheNodes.additionalView[this.indexDialog].model.config.html;
    this.dialogGraph = new G6.Graph({
      container: 'dialog-view',
      width: width.value + 1,
      height: height.value + 1,
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
        style: {
          cursor: 'pointer',
        },
      },
      defaultCombo: {
        type: 'container', // Combo 类型
        style: {
          lineWidth: 1,
          stroke: 'red',
          fillOpacity: 0,

          cursor: 'pointer',
          // ... 其他属性
        },
      },
      plugins: [grid, snapLine],
      // renderer: 'canvas',
    });
    this.targetGraph = this.dialogGraph;
    // 应用节点
    this.dialogGraph.read({
      nodes: this.cacheNodes.additionalView[this.indexDialog].nodes,
    });
    this.graphAddEventListener(this.dialogGraph);
  }
  initTabs() {
    console.log(this.tabs);
    this.tabsGraphs = new Array(this.tabs.length);
    this.createTabGraph(0);
  }
  createTabGraph(index) {
    console.log(this.tabs);
    this.tabsGraphs = new Array(this.tabs.length);
    let dom = this.tabs._results[index].nativeElement;
    dom.replaceChildren();
    const snapLine = new G6.SnapLine(),
      grid = new G6.Grid({});
    const { width, height } =
      this.cacheNodes.normalAndAdditionalView[this.indexTabs].model.config.html;
    // 容器大小
    dom.style.width = width.value + 'px';
    dom.style.height = height.value + 'px';
    this.tabsGraphs[index] = new G6.Graph({
      container: dom,
      width: width.value + 1,
      height: height.value + 1,
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
        style: {
          cursor: 'pointer',
        },
      },
      defaultCombo: {
        type: 'container', // Combo 类型
        style: {
          lineWidth: 1,
          stroke: 'red',
          fillOpacity: 0,

          cursor: 'pointer',
          // ... 其他属性
        },
      },
      plugins: [grid, snapLine],
      // renderer: 'canvas',
    });
    this.targetGraph = this.tabsGraphs;
    // 应用节点
    this.tabsGraphs[index].read({
      nodes:
        this.cacheNodes.normalAndAdditionalView[this.indexTabs].tabs[index] ||
        [],
    });
    this.graphAddEventListener(this.tabsGraphs[index]);
    this.targetGraph = this.tabsGraphs[index];
  }
  initBoard() {
    const snapLine = new G6.SnapLine(),
      grid = new G6.Grid({});
    const width = this.VW,
      height = this.VH,
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
          style: {
            cursor: 'pointer',
          },
        },
        defaultCombo: {
          type: 'container', // Combo 类型
          style: {
            lineWidth: 1,
            stroke: 'red',
            fillOpacity: 0,

            cursor: 'pointer',
            // ... 其他属性
          },
        },
        plugins: [grid, snapLine],
        // renderer: 'canvas',
      });
    this.graph = graph;
    this.targetGraph = graph;
    graph.read(this.data);
    this.graphAddEventListener(this.graph);
    graph.on('canvas:click', (evt) => {
      this.unFocus(this.focusNode);
      this.clearConfig();
    });
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
  graphAddEventListener(graph) {
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
    graph.on('click', (evt) => {
      this.focusCombo = null;
      this.focusNode = null;
      // TODO:配置背景色
    });
    graph.on('node:click', (evt) => {
      console.log('node');
      this.focusCombo = null;
      const { item } = evt,
        { html, css } = item._cfg.model.config;
      this.unFocus(this.focusNode);
      this.focus(item); //focus当前节点
      this.focusNode = item;
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

    graph.on('canvas:mousemove', (evt) => {
      if (this.control) {
        if (this.clickCount == 1) {
          const { canvasX, canvasY } = evt;
          this.areaRange.x[1] = canvasX;
          this.areaRange.y[1] = canvasY;
          let areaBlock = this.area.nativeElement;
          areaBlock.style.height =
            Math.abs(this.areaRange.y[1] - this.areaRange.y[0]) + 'px';
          areaBlock.style.width =
            Math.abs(this.areaRange.x[1] - this.areaRange.x[0]) + 'px';
          areaBlock.style.top = Math.min(...this.areaRange.y) + 'px';
          areaBlock.style.left = Math.min(...this.areaRange.x) + 'px';
        }
      }
    });
    graph.on('canvas:mousedown', (evt) => {
      if (this.control) {
        const { canvasX, canvasY } = evt;
        if (this.clickCount == 0) {
          this.areaRange.x = [canvasX, canvasX];
          this.areaRange.y = [canvasY, canvasY];
        }
      }
    });
    graph.on('canvas:mouseup', (evt) => {
      if (this.control) {
        this.clickCount++;
        if (this.clickCount == 2) {
          console.log('绘画结束！,处理边界', this.areaRange);
          let xFrom =
              Math.min(...this.areaRange.x) -
              (Math.min(...this.areaRange.x) % this.step),
            xEnd =
              Math.max(...this.areaRange.x) -
              (Math.max(...this.areaRange.x) % this.step) +
              this.step,
            yFrom =
              Math.min(...this.areaRange.y) -
              (Math.min(...this.areaRange.y) % this.step),
            yEnd =
              Math.max(...this.areaRange.y) -
              (Math.max(...this.areaRange.y) % this.step) +
              this.step;
          this.clickCount = 0;
          // 结构模拟普通节点，减少容错处理
          let box = this.graph.addItem('node', {
            config: {
              html: {},
              css: {
                'background-color': {
                  type: 'string',
                  value: '#fff0',
                },
                'border-width': {
                  type: 'number',
                  value: 1,
                  postfix: 'px',
                },
                'border-radius': {
                  type: 'number',
                  value: 2,
                  postfix: 'px',
                },
                'border-style': {
                  type: 'array',
                  options: [
                    { label: 'none', value: 'none' },
                    { label: 'solid', value: 'solid' },
                    // { label: 'dotted', value: 'dotted' },
                    { label: 'dashed', value: 'dashed' },
                    // { label: 'double', value: 'double' },
                    // { label: 'groove', value: 'groove' },
                  ],
                  value: 'solid',
                },
                'border-color': {
                  type: 'string',
                  value: 'rgba(0,0,0,.06)',
                },
              },
            },
            x: xFrom,
            y: yFrom,
            id: String(Math.random()),
            width: xEnd - xFrom,
            height: yEnd - yFrom,
            img: {
              width: xEnd - xFrom,
              height: yEnd - yFrom,
            },
            type: 'box',
            filesName: [],
          });
          // 锁定
          box.lock();
          box.toBack();
          let areaBlock = this.area.nativeElement;
          areaBlock.style.width = 0;
          areaBlock.style.height = 0;
        }
      }
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
      // 按住 control 键
      if (keyCode == 17) {
        this.control = true;
      }
      if (keyCode === 46) {
        //delete
        let node = this.focusNode || this.focusCombo;
        const { tagName } = node.getModel();
        graph.removeItem(node);
        this.clearConfig();
        this.focusNode = null;
        // 在关联图删除对应节点
        const relationNode = this.relationshipGraph.find('node', (node) => {
          return node.get('model').tagName === tagName;
        });
        this.relationshipGraph.removeItem(relationNode);
      } else if (keyCode >= 37 && keyCode <= 40) {
        // 左上右下
        if (this.focusNode) {
          const step = 3;
          let { x, y } = this.focusNode._cfg.model;
          switch (keyCode) {
            case 37:
              x -= step;
              break;
            case 38:
              y -= step;
              break;
            case 39:
              x += step;
              break;
            case 40:
              y += step;
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
    graph.on('keyup', (evt: any) => {
      const { item, keyCode } = evt;
      if (keyCode == 17) {
        this.control = false;
        this.clickCount = 0;
        let areaBlock = this.area.nativeElement;
        areaBlock.style.width = 0;
        areaBlock.style.height = 0;
      }
    });
  }
  clearConfig() {
    this.bus.center.next({
      html: {},
      css: {},
      type: 'config',
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
      (event) => {
        if ((event.target as HTMLElement).tagName === 'CANVAS') {
          // normal canvas
          // normal + 内层
          // dialog
          // 无布局
          let { offsetX, offsetY } = event,
            { id } = this.dragTarget as HTMLElement,
            view = (this.dragTarget as any).view,
            nodeType = (this.dragTarget as any).node,
            targetX = offsetX,
            targetY = offsetY,
            targetType = (this.dragTarget as any).comonentType,
            layout = (this.dragTarget as any).layout,
            component = (this.dragTarget as any).component,
            area = (this.dragTarget as any).area,
            filesName = (this.dragTarget as any).filesName;
          // 阻止默认动作（如打开一些元素的链接）
          event.preventDefault();
          // 将拖动的元素到所选择的放置目标节点中

          const nodeSetting = window[component]['configurable'],
            { className, html: htmlConfig, css: cssConfig } = nodeSetting;
          const { js, html } = (window[className] as any).extends(nodeSetting);
          let tagName = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
          const UUID = Math.random();
          let config = {
            tagName,
            x: targetX,
            y: targetY,
            config: nodeSetting,
            area,
            filesName,
            layout,
          };
          if (
            view == ViewModel.normalView ||
            view == ViewModel.normalAndAdditionalView
          ) {
            if (nodeType) {
              this.focusNode = this.targetGraph.addItem('node', {
                ...config,
                id: 'view' + '-' + String(UUID),
                type: nodeType || 'common',
              });
              this.focus(this.focusNode);
            } else {
              this.createElement(
                html,
                {
                  ...config,
                  id: 'view' + '-' + String(UUID),
                  type: nodeType || 'common',
                },
                tagName,
                js
              );
            }
          }
          if (view == ViewModel.normalAndAdditionalView) {
            this.cacheNodes.normalAndAdditionalView.push({
              tagName,
              model: {
                config: {
                  html: htmlConfig,
                  css: cssConfig,
                  className,
                },
                id: 'view' + '-' + String(UUID),
              },
              tabs: [],
              area,
              filesName,
            });
          }
          if (view == ViewModel.additionalView) {
            this.cacheNodes.additionalView.push({
              tagName,
              model: {
                config: {
                  html: htmlConfig,
                  css: cssConfig,
                  className,
                },
                id: 'view' + '-' + String(UUID),
              },
              nodes: [],
              area,
              filesName,
            });
          }
          if (view == ViewModel.noView) {
            this.cacheNodes.noView.push({
              tagName,
              model: {
                config: {
                  html: htmlConfig,
                  css: cssConfig,
                  className,
                },
                id: 'view' + '-' + String(UUID),
              },
              nodes: [],
              area,
              filesName,
            });
          }
          // 任何节点都要参与逻辑
          this.relationshipGraph.addItem('node', {
            tagName,
            x: targetX,
            y: targetY,
            config: nodeSetting,
            id: 'relation' + '-' + String(UUID),
            type: nodeType || id,
            label: config.tagName,
          });
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
    document.querySelector('app-cache').append(div, css, script);
    // 映射
    setTimeout(
      () => {
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
          let tagName = node.tagName;
          if (!['STYLE', 'SCRIPT'].includes(tagName)) {
            component = node;
            break;
          }
        }
        // 引入阿里图标库 svg icon 外链式需转化为内嵌式【特殊处理 symbol代替use】
        if (component.tagName == 'svg') {
          let div = document.createElement('div');
          div.style.display = 'inline-flex';
          let copySvg = component.cloneNode(true);
          div.appendChild(copySvg);
          component.replaceWith(div);
          let use = component.children[0];
          let link = use.getAttribute('xlink:href');
          let symbol = document.querySelector(`symbol[id=${link.slice(1)}]`);
          copySvg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
          copySvg.innerHTML = symbol.innerHTML;
          component = div;
        }
        // html2canvas 实时解析dom生成canvas,由于echarts 等图有渲染动画，因此需延迟生成图片
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
          this.focusNode = this.targetGraph.addItem('node', { ...mode });
          this.focus(this.focusNode);
        });
      },
      // 携带chart的组件是图表组件，有动画效果，需延迟解析
      tagName.includes('-chart-') ? 1000 : 0
    );
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
    // 存储 nodes 的 script 配置;
  }
  publishHandleOk() {
    //@ts-ignore
    let files = {
      ...this.originFile,
    };
    let defineComponent = `
    customElements.define('${this.tagName}',
      class MyComponent extends HTMLElement{
        template = \`${this.html}\`;
        constructor(){
          super();
          this.innerHTML = this.template;
        }
      }
    );`;
    //定义web component  组件逻辑
    let jsContent = `
    ${defineComponent}
    ${this.js}
    `;
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
          this.message.create('success', `发布组件成功:${this.tagName}`);
        }
      });
  }
  addItem(input: HTMLInputElement, list): void {
    const value = input.value;
    if (list.indexOf(value) === -1 && input.value) {
      list.push(value);
    }
  }
  openDialogGraph(index) {
    this.indexDialog = index;
    this.dialogConfigVisible = true;
    this.onConfig.emit(true);
    this.focusNode = null;
    this.clearConfig();
  }
  afterOpenTabsGraph(index) {
    this.indexTabs = index;
    this.tabsConfigDialog = true;
  }
  configViewNode(view, index) {
    this.currentCacheView = view;
    this.currentCacheIndex = index;
    const { html, css } = view[index].model.config;
    this.unFocus(this.focusNode);
    this.bus.center.next({
      html,
      css,
      type: 'config',
    });
    this.onEdit(false);
  }
  deleteNode(i, nodes) {
    const { model } = nodes[i];
    const relationNode = this.relationshipGraph.find('node', (node) => {
      return node.get('model').id === model.id.replace('view', 'relation');
    });
    this.relationshipGraph.removeItem(relationNode);
    console.log('getNodes', this.graph.getNodes());
    const viewNode = this.graph.find('node', (node) => {
      return node.get('model').id === model.id;
    });
    if (viewNode) {
      this.graph.removeItem(viewNode);
    }
    nodes.splice(i, 1);
    // 删除的节点属性正在展示时，清空面板
    if (nodes == this.currentCacheView && i == this.currentCacheIndex) {
      this.clearConfig();
    }
  }
  canDeactivate: NzTabsCanDeactivateFn = (
    fromIndex: number,
    toIndex: number
  ) => {
    this.indexTab = toIndex;
    // 缓存离去tab，重新渲染到达tab，不然canvas无响应
    this.cacheNodes.normalAndAdditionalView[this.indexTabs].tabs[fromIndex] =
      this.tabsGraphs[fromIndex].getNodes().map((node) => {
        return {
          ...node._cfg.model,
        };
      });
    //重新渲染到达canvas
    if (this.tabsGraphs[toIndex]) {
      this.tabsGraphs[toIndex].destroy();
    }
    this.createTabGraph(toIndex);
    return true;
  };
  // 划分节点层级，分层布局
  getBoxNodes(
    nodesModel = [],
    containerWidth,
    containerHeight,
    originX = 0,
    originY = 0
  ) {
    if (nodesModel.length == 0) {
      return;
    }
    // 先处理 区域类节点
    // 大的，区域的节点在前,以便成树结构递归处理
    nodesModel.sort((aModel, bModel) => {
      const { type: aType, width: aW, height: aH, x: aX, y: aY } = aModel,
        { type: bType, width: bW, height: bH, x: bX, y: bY } = bModel;
      if (aType == 'box' && bType == 'box') {
        return aX <= bX && aY <= bY && aX + aW >= bX + bW && aY + aH >= bY + bH
          ? -1
          : 1;
      } else {
        return aType == 'box' ? -1 : 1;
      }
    });
    // 清空区域节点缓存区
    this.areaNodesModel.clear();
    this.aloneNodesModel.clear();
    this.nodeMapArea.clear();
    this.areaMapNodes.clear();
    nodesModel.forEach((nodeModel) => {
      const { type } = nodeModel;
      if (type == 'box') {
        const { width, height, x, y } = nodeModel;
        // 判断当前区域是否是子区域
        let isChild = false;
        for (let box of this.areaNodesModel.keys()) {
          const { width: bW, height: bH, x: bX, y: bY } = box;
          if (
            bX <= x &&
            bY <= y &&
            bX + bW >= x + width &&
            bY + bH >= y + height
          ) {
            let children = this.areaNodesModel.get(box);
            children.push(nodeModel);
            isChild = true;
            break;
          }
        }
        // 当前区域不是子区域
        if (!isChild) {
          this.areaNodesModel.set(nodeModel, []);
        }
      } else {
        // 当前节点是 非区域节点
        const { x: nx, y: ny, img, config } = nodeModel;
        const { width, height } = img;
        const { width: nw, height: nh } = config.css;
        const endNX = nx + Math.max(nw.value, width),
          endNY = ny + Math.max(nh.value, height);
        let isChild = false;
        // 非box 确认是独立节点还是区域节点的子节点
        for (let box of this.areaNodesModel.keys()) {
          const { x, y, width, height } = box;
          const endX = x + width,
            endY = y + height;
          if (nx >= x && ny >= y && endNX <= endX && endNY <= endY) {
            let children = this.areaNodesModel.get(box);
            children.push(nodeModel);
            isChild = true;
            break;
          }
        }
        if (!isChild) {
          this.aloneNodesModel.add(nodeModel);
        }
      }
    });
    console.log(this.areaNodesModel, this.aloneNodesModel);
    // 组合布局
    this.deepGrid(
      [
        ...Array.from(this.areaNodesModel.keys()),
        ...Array.from(this.aloneNodesModel),
      ],
      containerWidth,
      containerHeight,
      originX,
      originY
    );
  }

  /**
   *
   * @param nodesModel 区域内的节点
   * @param containerWidth 区域的width
   * @param containerHeight 区域的height
   * @param originX 区域的 左上 x起始坐标   不传默认是0
   * @param originY  区域的 左上 y起始坐标  不传默认是0
   */
  deepGrid(
    nodesModel,
    containerWidth,
    containerHeight,
    originX = 0,
    originY = 0
  ) {
    if (nodesModel.length == 0) {
      return;
    }
    let XAxisInterval = [Infinity, -Infinity],
      YAxisInterval = [Infinity, -Infinity];
    // 获取节点的坐标范围
    nodesModel.forEach((model) => {
      const { x, y, img, config, width: boxWidth, height: boxHeight } = model,
        { width: cW, height: cH } = config.css,
        { width: imgWidth, height: imgHeight } = img;
      // 图片width/height，容器width/height 和 box 的 width/ height
      const width = Math.max(boxWidth || 0, cW ? cW.value : 0, imgWidth || 0);
      const height = Math.max(
        boxHeight || 0,
        cH ? cH.value : 0,
        imgHeight || 0
      );
      XAxisInterval[0] = Math.min(XAxisInterval[0], x);
      XAxisInterval[1] = Math.max(XAxisInterval[1], x + width);
      YAxisInterval[0] = Math.min(YAxisInterval[0], y);
      YAxisInterval[1] = Math.max(YAxisInterval[1], y + height);
    });
    // 根据width，height和 精准度 创建grid区域
    let areas = Array.from(new Array(containerHeight / this.step), () =>
      new Array(containerWidth / this.step)
        .fill('*')
        .map(() => String(Math.floor(Math.random() * 1000000000000)))
    );
    // 给节点区域染色
    nodesModel.forEach((model) => {
      const { x, y, img, config } = model,
        { width: cW, height: cH } = config.css,
        { width, height } = img;
      let xAxis = [
          x - (x % this.step) - originX,
          x +
            Math.max(width, cW ? cW.value : 0) -
            ((x + Math.max(width, cW ? cW.value : 0)) % this.step) -
            originX,
        ],
        yAxis = [
          y - (y % this.step) - originY,
          y +
            Math.max(height, cH ? cH.value : 0) -
            ((y + Math.max(height, cH ? cH.value : 0)) % this.step) -
            originY,
        ];
      // 检查当前节点 覆盖的区域是否有其他节点
      // 将当前区域的节点 统一区域id
      let areaID = this.nodeMapArea.get(model) || this.UUID();
      this.nodeMapArea.set(model, areaID);
      for (let i = yAxis[0] / this.step; i <= yAxis[1] / this.step; i++) {
        for (let j = xAxis[0] / this.step; j <= xAxis[1] / this.step; j++) {
          // 当前节点所要染色的区域内，若有其他节点
          console.log(i, yAxis[0] / this.step, yAxis[1] / this.step, areas);
          console.log(j, xAxis[0] / this.step, xAxis[1] / this.step, areas);
          if (isNaN(Number(areas[i][j]))) {
            this.nodeMapArea.set(areas[i][j], areaID);
          } else {
            areas[i][j] = model;
          }
        }
      }
    });
    // 还原区域占位【area中原来是node占位，还原为 id占位】
    for (let i = 0; i < areas.length; i++) {
      for (let j = 0; j < areas[i].length; j++) {
        const model = areas[i][j];
        // 当前节点所要染色的区域内，若有其他节点
        if (isNaN(Number(model))) {
          areas[i][j] = this.nodeMapArea.get(model);
        }
      }
    }
    // Map<区域id, nodes>
    nodesModel.forEach((model) => {
      let areaID = this.nodeMapArea.get(model);
      let areaNodes = this.areaMapNodes.get(areaID);
      if (!areaNodes) {
        areaNodes = [];
        this.areaMapNodes.set(areaID, areaNodes);
      }
      areaNodes.push(model);
    });
    let gridTemplate = areas.map((row) => `'${row.join(' ')}'`).join('\n');
    // 绘制当前区域 grid图
    this.html += `<div style="display:grid;
                    grid-template-areas:${gridTemplate};
                    grid-template-rows: repeat(${Math.floor(
                      containerHeight / this.step
                    )}, ${this.step}px);
                    grid-template-columns: repeat(${Math.floor(
                      containerWidth / this.step
                    )},  ${this.step}px);">`;
    // 生成当前区域节点的代码
    const area2Nodes = Array.from(this.areaMapNodes.entries());
    for (let [areaID, nodesModel] of area2Nodes) {
      debugger;
      let childHtml = ``;
      // 精细布局pdding。
      let padding = [Infinity, Infinity, Infinity, Infinity];
      nodesModel
        .sort((model1, model2) => model1.x - model2.x)
        .forEach((model) => {
          // 求padding
          const { x, y, img, config } = model,
            { width: cW, height: cH } = config.css,
            { width, height } = img;
          padding[0] = Math.min(padding[0], y % this.step);
          padding[1] = Math.min(
            padding[1],
            (Math.floor((x + Math.max(width, cW ? cW.value : 0)) / this.step) +
              1) *
              this.step -
              (x + Math.max(width, cW ? cW.value : 0))
          );
          padding[2] = Math.min(
            padding[2],
            (Math.floor((y + Math.max(height, cH ? cH.value : 0)) / this.step) +
              1) *
              this.step -
              (y + Math.max(height, cH ? cH.value : 0))
          );
          padding[3] = Math.min(padding[3], x % this.step);
        });
      // 使用 area 包裹内部的节点
      this.html += `<div style="grid-area:${areaID};padding:${padding
        .map((pad) => pad + 'px')
        .join(' ')}">`;
      nodesModel
        .sort((model1, model2) => model1.x - model2.x)
        .forEach((model) => {
          let { html, js } = this.exportSwitchNode(model);
          childHtml += html;
          this.js += js;
          // 求padding
          // const { x, y, img, config } = model,
          //   { width: cW, height: cH } = config.css,
          //   { width, height } = img;
          // padding[0] = Math.min(padding[0], y % this.step);
          // padding[1] = Math.min(
          //   padding[1],
          //   (Math.floor((x + Math.max(width, cW ? cW.value : 0)) / this.step) +
          //     1) *
          //     this.step -
          //     (x + Math.max(width, cW ? cW.value : 0))
          // );
          // padding[2] = Math.min(
          //   padding[2],
          //   (Math.floor((y + Math.max(height, cH ? cH.value : 0)) / this.step) +
          //     1) *
          //     this.step -
          //     (y + Math.max(height, cH ? cH.value : 0))
          // );
          // padding[3] = Math.min(padding[3], x % this.step);
        });
      // 区域内部节点精准定位【使用padding固定节点】

      // this.html +=`padding:${padding.map((pad) => pad + 'px').join(' ')}">
      //               ${childHtml}`;
      this.html += `${childHtml}`;
      this.html += '</div>';
    }
    this.areaMapNodes.clear();
    this.html += '</div>';
  }
  UUID() {
    let s = '';
    for (let i = 0; i <= 25; i++) {
      let index = Math.floor(Math.random() * 26);
      s += String.fromCharCode(index + 97);
    }
    return s;
  }
}

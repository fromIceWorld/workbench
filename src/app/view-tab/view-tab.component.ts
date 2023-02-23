import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import G6 from '../../../g6.min.js';
import { ralationMenu } from '../node-menu/relation-menu.js';
import { enumArrow } from '../view-edges/index.js';
import {
  configModule,
  registerAPI,
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
  @Output() focusPoint = new EventEmitter();
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
  isVisible: boolean = false;
  eventName: string = '';
  methodName: string = '';
  methods: string[] = [];
  level2 = [];
  eventLine = [[]];
  tabView: string = 'design-view';
  dragTarget: EventTarget | null = null;
  data = {
    nodes: [],
    combos: [],
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
    private modalService: NzModalService
  ) {}
  registerNodes() {
    registerButton(configModule);
    registerTable(configModule);
    registerContainer(configModule);
    registerDialog(configModule);
    registerInput(configModule);
    registerRadio(configModule);
    registerScaleX();
    registerScaleY();
    registerDefault();
    registerAPI(configModule);
    registerText(configModule);
    registrForm(configModule);
    registerCommon(configModule);
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
  cacheData() {
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
          const { id, label, source, target, type } = edge._cfg.model;
          return {
            id,
            label,
            source,
            target,
            type,
          };
        }),
      },
    };
    localStorage.setItem('graphData', JSON.stringify(cache));
  }
  recoverData() {
    let cache = localStorage.getItem('graphData');
    if (cache) {
      let { view, relation } = JSON.parse(cache);
      this.graph.read(view);
      // 渲染连线图
      this.relationshipGraph.read(relation);
    }
  }
  clearGraph() {
    this.graph.read({});
  }
  exportData() {
    // 节点数据
    const nodes = this.graph.getNodes(),
      combos = this.graph.getCombos();
    let topNodes = nodes.filter((node) => !node._cfg.model.comboId);
    let topCombos = combos.filter((combo) => !combo._cfg.model.parentId);
    let [html, js] = [...topNodes, ...topCombos]
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
    edges
      .map((edge) => {
        const { source, target, label, edgeType } = edge;
        let jsString = ``;
        // 不同的关系连线，逻辑不同
        if (edgeType === LineType.event) {
          let [event, fn] = label.split('->');
          jsString = `
                  //初始化事件
                  const sourceDOM = document.querySelector('${this.idMapTag.get(
                    source.split('-')[1]
                  )}'),
                      targetDOM = document.querySelector('${this.idMapTag.get(
                        target.split('-')[1]
                      )}'),
                      targetPath = (targetDOM.getAttribute('pre')||'').split('.');
                  let targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);
                  sourceDOM.addEventListener('${event}', (e)=>{
                    targetIns['${fn}']();
                  })    
              `;
        } else if (edgeType === LineType.data) {
          let [hook, sourceData, targetData] = label.split(/[ =]/);
          jsString = `
          const sourceDOM = document.querySelector('${this.idMapTag.get(
            source.split('-')[1]
          )}'),
                targetDOM = document.querySelector('${this.idMapTag.get(
                  target.split('-')[1]
                )}'),
                sourcePath = (sourceDOM.getAttribute('pre')||'').split('.'),
                targetPath = (targetDOM.getAttribute('pre')||'').split('.');
          let sourceIns = sourcePath.reduce((pre,key)=>pre[key],sourceDOM),
              targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);      
          sourceDOM.addEventListener('${hook}',()=>{
            targetIns['${targetData}'] = sourceIns['${sourceData}'];
            targetIns.check();  
          })
          `;
        } else if (edgeType === LineType.params) {
          jsString = `
          const sourceDOM = document.querySelector('${this.idMapTag.get(
            source.split('-')[1]
          )}'),
                targetDOM = document.querySelector('${this.idMapTag.get(
                  target.split('-')[1]
                )}'),
                sourcePath = (sourceDOM.getAttribute('pre')||'').split('.'),
                targetPath = (targetDOM.getAttribute('pre')||'').split('.');
          let sourceIns = sourcePath.reduce((pre,key)=>pre[key],sourceDOM),
              targetIns = targetPath.reduce((pre,key)=>pre[key],targetDOM);   
          `;
        }
        js += jsString;
      })
      .join();
    // 下载 html文件
    let string = `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <title>展示区</title>
            <base href="./" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" type="image/x-icon" href="favicon.ico" />
            <script src="https://fromiceworld.github.io/web-component-zorro-Angular/runtime.js"></script>
            <script src="https://fromiceworld.github.io/web-component-zorro-Angular/polyfills.js"></script>
            <script src="https://fromiceworld.github.io/web-component-zorro-Angular/main.js"></script>
            <link rel="stylesheet" href="https://fromiceworld.github.io/web-component-zorro-Angular/styles.css"/>
        </head>
        <body>
          ${html}
        </body>
        <script>
          ${js}
        </script>
    </html>
    `;
    const blob = new Blob([string], { type: 'text/html' });
    const a = document.createElement('a'),
      href = URL.createObjectURL(blob);
    a.href = href;
    let hash = new Date();
    a.download = 'test.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  }
  checkChange(e, index) {
    this.sourceChecked[index] = e;
    console.log(this.sourceChecked);
  }
  exportCombo(combo) {
    let htmlString = '',
      scriptString = '',
      { html, css, component, className } = combo._cfg.model.config,
      { nodes, combos } = combo.getChildren();
    // 建立 node id与tagName的映射
    const originClass = window[className];
    //  导出当前combo数据
    let { html: s, js } = (originClass as any).extends({
      html,
      css,
      className,
    });
    const [origin, start, end] = s.match(
      /^(\<[a-z-0-9 ="';:]+\>[\s\S]*)(\<\/([a-z-0-9]+)\>)$/
    );
    htmlString += start;
    scriptString += js;
    // 导出子节点，combo
    nodes.forEach((node) => {
      let { html, js } = this.exportNode(node);
      htmlString += html;
      scriptString += js;
    });
    combos.forEach((combo) => {
      let { html, js } = this.exportCombo(combo);
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
    let { html, css, className } = node._cfg.model.config;
    const originClass = window[className],
      index = (originClass as any).index;
    this.idMapTag.set(
      node._cfg.id.split('-')[1],
      (originClass as any).tagNamePrefix + '-' + index
    );
    console.log(this.idMapTag);
    return (originClass as any).extends({ html, css, className });
  }
  onEdit(e) {
    let { detail } = e,
      { dom, value } = detail;
    this.jsonOnEdit = value;
  }
  changeNodeLayout(e) {
    // bboxCanvasCache储存的是旧的数据，更新后节点的中心点在model中，而且center不变
    let value = e;
    if (this.focusCombo) {
      const { nodes, combos } = this.focusCombo.getChildren(),
        { minX, minY } = this.focusCombo._cfg.bbox,
        elements = nodes.concat(combos);
      if (value.layout == 'row') {
        // 修改combo layout json
        this.focusCombo._cfg.model.config.css.style['flex-direction'] = 'row';
        elements.reduce((pre, element) => {
          const { bboxCanvasCache, model, type } = element._cfg,
            { x } = model,
            { width, centerY, minX, minY: minYY } = bboxCanvasCache;
          if (type == 'combo') {
            this.updateComboPosition(
              element,
              x - minX + pre,
              minY + centerY - minYY
            );
            // 更改comco layout 配置
            return pre + width;
          } else {
            element.updatePosition({
              x: x - minX + pre,
              y: minY + centerY - minYY,
            });
            return pre + width;
          }
        }, minX);
      } else {
        // 修改combo layout json
        this.focusCombo._cfg.model.config.css.style['flex-direction'] =
          'column';
        elements.reduce((pre: number, element) => {
          const { bboxCanvasCache, model, type } = element._cfg,
            { x } = model,
            {
              width,
              height,
              centerY,
              minY: minYY,
              minX: minXX,
            } = bboxCanvasCache;
          if (type == 'combo') {
            this.updateComboPosition(
              element,
              minX + x - minXX,
              pre + centerY - minYY
            );
            return pre + height;
          } else {
            element.updatePosition({
              x: minX + x - minXX,
              y: pre + centerY - minYY,
            });
            return pre + height;
          }
        }, minY);
      }
      this.graph.updateCombos();
    }
  }
  // combo 是自适应子节点的，updatePosition时，无法直接操作，需要更改子node
  updateComboPosition(combo: any, targetX: number, targetY: number) {
    const { bboxCanvasCache, model, type } = combo._cfg,
      { minX, minY } = bboxCanvasCache,
      { x: xx, y: yy } = model,
      { nodes, combos } = combo.getChildren();
    if (!nodes.length && !combos.length) {
      combo.updatePosition({
        x: targetX,
        y: targetY,
      });
      return;
    }
    nodes.concat(combos).forEach((item: any) => {
      const { type, model } = item._cfg,
        { x, y, minX: minXX, minY: minYY } = model;
      if (type == 'node') {
        item.updatePosition({
          x: targetX + x - xx,
          y: targetY + y - yy,
        });
      } else if (type == 'combo') {
        this.updateComboPosition(item, targetX + x - xx, targetY + y - yy);
      }
    });
  }
  updateNode(newConfig) {
    const model = this.focusNode._cfg.model,
      config = model.config,
      { className } = config;
    Object.assign(model.config.html, newConfig);
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
            {
              type: 'create-edge',
              shouldBegin: (e) => {
                // avoid beginning at other shapes on the node
                if (e.target && e.target.get('name') !== 'anchor-point')
                  return false;
                this.sourceAnchorIdx = e.target.get('anchorPointIdx');
                e.target.set('links', e.target.get('links') + 1); // cache the number of edge connected to this anchor-point circle
                return true;
              },
              shouldEnd: (e) => {
                // avoid ending at other shapes on the node
                if (e.target && e.target.get('name') !== 'anchor-point')
                  return false;
                if (e.target) {
                  this.targetAnchorIdx = e.target.get('anchorPointIdx');
                  e.target.set('links', e.target.get('links') + 1); // cache the number of edge connected to this anchor-point circle
                  return true;
                }
                this.targetAnchorIdx = undefined;
                return true;
              },
              // update the sourceAnchor
              // getEdgeConfig: () => {
              //   return {
              //     sourceAnchor: sourceAnchorIdx
              //   }
              // }
            },
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
          /* node type */
          type: 'star',
          /* node size */
          size: [60, 30],
          /* style for the keyShape */
          // style: {
          //   fill: '#9EC9FF',
          //   stroke: '#5B8FF9',
          //   lineWidth: 3,
          // },
          labelCfg: {
            /* label's position, options: center, top, bottom, left, right */
            position: 'bottom',
            /* label's offset to the keyShape, 4 by default */
            offset: 20,
            /* label's style */
            //   style: {
            //     fontSize: 20,
            //     fill: '#ccc',
            //     fontWeight: 500
            //   }
          },
          /* configurations for four linkpoints */
          linkPoints: {
            top: true,
            right: true,
            bottom: true,
            left: true,
            /* linkPoints' size, 8 by default */
            //   size: 5,
            /* linkPoints' style */
            //   fill: '#ccc',
            //   stroke: '#333',
            //   lineWidth: 2,
          },
          /* icon configuration */
          icon: {
            /* whether show the icon, false by default */
            show: true,
            /* icon's img address, string type */
            // img: 'https://gw.alipayobjects.com/zos/basement_prod/012bcf4f-423b-4922-8c24-32a89f8c41ce.svg',
            /* icon's size, 20 * 20 by default: */
            //   width: 40,
            //   height: 40
          },
          /* styles for different states, there are built-in styles for states: active, inactive, selected, highlight, disable */
          // nodeStateStyles: {
          //   // node style of active state
          //   active: {
          //     fillOpacity: 0.8,
          //   },
          //   // node style of selected state
          //   selected: {
          //     lineWidth: 5,
          //   },
          // },
        },
        defaultCombo: {
          type: 'rect', // Combo 类型
          size: [40, 30],
          padding: [8, 8, 8, 8],
          style: {
            lineWidth: 1,
            fill: '#00000000',
            lineDash: [5],
          },
          labelCfg: {
            refX: 1,
            refY: 1,
            style: {
              // fontWeight: 600,
              fill: '#e31366',
              fontSize: 10,
            },
          },
          // ... 其他配置
        },
        plugins: [grid, snapLine],
        renderer: 'canvas',
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
    if (!item) {
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
      debugger;
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
      this.config = [{}, {}];
      const { item } = evt;
      if (item !== this.focusNode) {
        if (this.focusNode) {
          this.unFocus(this.focusNode);
          this.focusNode = null;
        } else {
          this.config = [];
        }
      }
    });
    graph.on('node:click', (evt) => {
      console.log('view', evt);
      this.focusCombo = null;
      const { item } = evt,
        { html: config } = item._cfg.model.config;
      this.unFocus(this.focusNode);
      this.focus(item); //focus当前节点
      this.focusNode = item;
      this.config = config;
      this.focusPoint.emit(config);
    });
    graph.on('combo:click', (evt) => {
      let { nodes, combos } = evt.item.getChildren();
      // this.eventNodes = [];
      // [].concat(nodes, combos).map((item) => {
      //   if (item._cfg) {
      //     this.eventNodes.push({ ...item._cfg.model });
      //   }
      // });
      // 展示combo  json 数据
      const { item } = evt,
        { html: config } = item._cfg.model.config;
      this.focusCombo = item;
      this.focusPoint.emit(config);
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
            targetType = (that.dragTarget as any).comonentType;
          // 阻止默认动作（如打开一些元素的链接）
          event.preventDefault();
          // 将拖动的元素到所选择的放置目标节点中

          const nodeSetting = new configModule[
              id.toLocaleUpperCase() + '_CONFIG'
            ](),
            { className } = nodeSetting;
          const { js, html } = (window[className] as any).extends(nodeSetting);
          let tagName = html.match(/\<\/([0-9\-a-z]*)\>$/)[1];
          const UUID = Math.random();
          let config = {
            x: targetX,
            y: targetY,
            config: nodeSetting,
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
              });
            }
          } else if (targetType === 'combo') {
            Object.assign(config, {
              label: id,
              id: 'view' + '-' + String(UUID),
            });
            if (view & NodePosition.view) {
              that.graph.createCombo({ ...config }, []);
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
    css.innerHTML = `${tagName}{display:inline-block}`;
    document.querySelector('app-cache').append(div, css, script);
    // 映射
    // @ts-ignore
    html2canvas(div).then((canvas) => {
      let base = canvas.toDataURL('img');
      Object.assign(mode, {
        img: {
          base,
          width: div.offsetWidth,
          height: div.offsetHeight,
        },
      });
      this.focusNode = this.graph.addItem('node', { ...mode });
      this.focus(this.focusNode);
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
    debugger;
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
}

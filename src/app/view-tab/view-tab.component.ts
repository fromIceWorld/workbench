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
import {
  configModule,
  registerButton,
  registerCommon,
  registerContainer,
  registerDialog,
  registerInput,
  registerRadio,
  registerScaleX,
  registerScaleY,
  registerTable,
  registerText,
  registrForm,
} from '../view-nodes/index';
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
  // eventNodes = [];
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
  isCreate: boolean = false;
  newEdge;
  sourceSelect;
  targetSelect;
  diaDisplay: boolean = false;
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
        defaultNode: {
          type: 'modelRect',
        },
      }),
      scaleYgraph = new G6.Graph({
        container: 'scaleY',
        width: 22,
        height: 1102,
        defaultNode: {
          type: 'modelRect',
        },
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
      const { source, target, label } = edge._cfg.model;
      return {
        source,
        target,
        label,
      };
    });
    edges
      .map((edge) => {
        const { source, target, label } = edge,
          eventsArray = label
            .split('\n')
            .map((eventToFn: string) => eventToFn.split('->'));
        const eventJs = `
                  //初始化事件
                  ${JSON.stringify(eventsArray)}.forEach((fnTofn, index)=>{
                      const [event,fn] = fnTofn;
                      const sourceDOM = document.querySelector('${this.idMapTag.get(
                        source
                      )}'),
                          targetDOM = document.querySelector('${this.idMapTag.get(
                            target
                          )}');
                      if(index === 0){
                          sourceDOM.addEventListener(event, (e)=>{
                              targetDOM._ngElementStrategy.componentRef.instance[fn]();
                          })
                      }else{
                          targetDOM.addEventListener(event, (e)=>{
                              sourceDOM._ngElementStrategy.componentRef.instance[fn]();
                          })
                      }
                  });
              `;
        js += eventJs;
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

    let dom = document.createElement('div'),
      script = document.createElement('script');
    dom.innerHTML = html;
    script.innerHTML = `${js}`;
    document.body.append(script, dom);
  }
  exportCombo(combo) {
    let htmlString = '',
      scriptString = '',
      { html, css, component, className } = combo._cfg.model.config,
      { nodes, combos } = combo.getChildren();
    // 建立 node id与tagName的映射
    const originClass = window[className],
      index = (originClass as any).index;
    this.idMapTag.set(
      combo._cfg.id,
      (originClass as any).tagNamePrefix + '-' + index
    );
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
      node._cfg.id,
      (originClass as any).tagNamePrefix + '-' + index
    );
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
      this.createElement(JSON.parse(JSON.stringify(model2)), tagName, js);
      // let div = document.createElement(tagName),
      //   css = document.createElement('style'),
      //   script = document.createElement('script');
      // script.innerHTML = js;
      // css.innerHTML = `${tagName}{display:inline-block}`;
      // document.querySelector('app-cache').append(div, css, script);
      // this.graph.updateItem(this.focusNode, model2);

      // 节点更新数据后，config变成一个普通的对象，丢失了class 的 原型链
      // this.graph.findById(model.id)._cfg.model.config = config;
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
    const snapLine = new G6.SnapLine();
    const width = 1920,
      height = 1080,
      graph = new G6.Graph({
        container: 'relation-ship',
        width,
        height,
        defaultNode: {
          type: 'rect',
          size: [80, 30],
        },
        defaultCombo: {
          type: 'cRect',
        },
        modes: {
          default: ['drag-node', { type: 'create-edge', key: 'shift' }],
        },
        defaultEdge: {
          type: 'quadratic',
          style: {
            stroke: '#F6BD16',
            lineWidth: 2,
            endArrow: true,
          },
        },
        plugins: [snapLine],
      });
    this.relationshipGraph = graph;
    graph.read(this.data);
    this.relationshipGraphAddEvent();
  }
  initBoard() {
    const snapLine = new G6.SnapLine();
    const width = 1920,
      height = 1080,
      graph = new G6.Graph({
        container: 'design-view',
        width,
        height,
        defaultNode: {
          type: 'rect',
        },
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
        plugins: [snapLine],
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
    // 创建边之前
    graph.on('aftercreateedge', (e) => {
      const newEdge = e.edge,
        { sourceNode, targetNode } = newEdge._cfg,
        { event: sourceEvents, methods: sourceMethods } =
          sourceNode._cfg.model.config.component,
        { methods: targetMethods } = targetNode._cfg.model.config.component,
        edges = graph.save().edges;
      // 事件列表
      this.sourceEvents = sourceEvents;
      this.sourceMethods = sourceMethods;
      this.targetMethods = targetMethods;
      G6.Util.processParallelEdges(edges, 50);
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
    graph.on('edge:click', (evt) => {
      const { source, target, label } = evt.item._cfg.model;
      const sourceNode = graph.findById(source),
        targetNode = graph.findById(target);
      const { event: sourceEvents } = sourceNode._cfg.model.config.component,
        { methods: targetMethods } = targetNode._cfg.model.config.component;
      this.sourceList = sourceEvents;
      this.targetList = targetMethods;
      this.isCreate = false;
      this.isVisible = true;
    });
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
        graph.removeItem(this.focusNode);
        graph.removeItem(this.focusCombo);
        this.focusNode = null;
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
          let config = {
            x: targetX,
            y: targetY,
            id: String(Math.random()),
            config: nodeSetting,
          };
          if (targetType === 'node') {
            that.createElement(
              {
                tagName: tagName,
                ...config,
                type: 'common',
              },
              tagName,
              js
            );
            that.relationshipGraph.addItem('node', {
              ...config,
              type: id,
            });
          } else if (targetType === 'combo') {
            Object.assign(config, {
              label: id,
              type: id,
            });
            that.graph.createCombo({ ...config }, []);
          }
        }
      },
      false
    );
  }
  createElement(mode: any, tagName, js) {
    let div = document.createElement(tagName),
      css = document.createElement('style'),
      script = document.createElement('script');
    script.innerHTML = js;
    css.innerHTML = `${tagName}{display:inline-block}`;
    document.querySelector('app-cache').append(div, css, script);
    this.focusNode = this.graph.addItem('node', mode);
    this.focus(this.focusNode);
  }
  handleCancel() {
    if (this.isCreate) {
      this.deleteEdge();
    }
    // this.modalService.openModals[0]._finishDialogClose();
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
    this.newEdge.update({
      ...this.newEdge._cfg.model,
      label: `${labels.map((item) => item.join('->')).join('\n')}`,
    });
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
}

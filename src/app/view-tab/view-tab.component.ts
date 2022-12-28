import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import G6 from '../../../g6.min.js';
import {
  configModule,
  registerButton,
  registerContainer,
  registerDialog,
  registerInput,
  registerRadio,
  registerScaleX,
  registerScaleY,
  registerText,
  registrForm,
} from '../view-nodes/index';
@Component({
  selector: 'app-view-tab',
  templateUrl: './view-tab.component.html',
  styleUrls: ['./view-tab.component.css'],
})
export class ViewTabComponent implements OnInit {
  @Output() focusPoint = new EventEmitter();
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
  eventNodes = [];
  graph: any;
  relationshipGraph: any;
  focusNode: any = null;
  focusCombo: any = null;
  jsonOnEdit: boolean = false;
  config = [];
  sourceList = [];
  targetList = [];
  sourceOutput = [];
  sourceMethods = [];
  targetOutput = [];
  newEdge;
  sourceSelect;
  targetSelect;
  diaDisplay: boolean = false;
  idMapTag: Map<string, string> = new Map();
  constructor() {}
  registerNodes() {
    registerButton(configModule);
    registerContainer(configModule);
    registerDialog(configModule);
    registerInput(configModule);
    registerRadio(configModule);
    registerScaleX();
    registerScaleY();
    registerText(configModule);
    registrForm(configModule);
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
  // levelChange(e, index) {
  //   const { value, source } = e.detail;
  //   let target = source.options.filter((item) => item.label === value)[0];
  //   this.eventLine[0][index] = value;
  //   if (index == '0') {
  //     return;
  //   }
  //   // 切换 respond 选项
  //   this.level2 = target.children || [];
  //   if (this.level2.length) {
  //     let tmplate: string[] = [],
  //       tagNames: string[] = [],
  //       js = (target.children || [])
  //         .map((item, index) => {
  //           const { html, js, tagName } = bundle['MySelect'].extends({
  //             html: {
  //               attributes: {
  //                 options: JSON.stringify(this.sourceMethods),
  //               },
  //               properties: {},
  //             },
  //             css: {
  //               classes: '',
  //               style: {},
  //             },
  //           });
  //           this.eventLine.push([this.level2[index].label]);
  //           tagNames.push(tagName);
  //           tmplate.push(`<span>${this.level2[index].label}: </span>${html}`);
  //           return js;
  //         })
  //         .join('');
  //     let div = document.createElement('div'),
  //       script = document.createElement('script');
  //     div.innerHTML = tmplate.join('');
  //     script.innerHTML = `with(bundle){
  //         ${js}
  //     }`;
  //     this.respond.append(script, div);
  //     tagNames.forEach((tagName, index) => {
  //       let dom = this.respond.querySelector(tagName);
  //       dom.addEventListener('change', (e) => {
  //         const { value } = e.detail;
  //         this.eventLine[index + 1][1] = value;
  //         console.log(this.eventLine);
  //       });
  //     });
  //   } else {
  //     if (!this.respond.children.length) {
  //       return;
  //     }
  //     this.respond.children[1].remove();
  //     this.respond.children[0].remove();
  //     this.eventLine = [this.eventLine[0]];
  //   }
  //   console.log(this.eventLine);
  // }
  changeView(e) {
    if (this.tabView === 'design-view') {
      this.tabView = 'relation-ship';
    } else {
      this.tabView = 'design-view';
    }
  }
  cancel(e) {
    this.relationshipGraph.removeItem(this.newEdge);
    this.newEdge = null;
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
    console.log([html, js]);
    // 连线数据
    const edges = this.relationshipGraph.getEdges().map((edge) => {
      const { source, target, label } = edge._cfg.model;
      return {
        source,
        target,
        label,
      };
    });
    console.log(this.idMapTag);
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
                          targetDOM[fn]();
                      })
                  }else{
                      sourceDOM.addEventListener(${JSON.stringify(
                        eventsArray[0][0]
                      )} + event, (e)=>{
                          targetDOM[fn]();
                      })
                  }
              });
          `;
        js += eventJs;
      })
      .join();
    let dom = document.createElement('div'),
      script = document.createElement('script');
    dom.innerHTML = html;
    script.innerHTML = `${js}`;
    document.body.append(script);
  }
  exportCombo(combo) {
    let htmlString = '',
      scriptString = '',
      { html, css, component, className } = combo._cfg.model.config,
      { nodes, combos } = combo.getChildren();
    // 建立 node id与tagName的映射
    const originClass = customElements.get(className),
      index = (originClass as any).index;
    this.idMapTag.set(combo._cfg.id, className + '-' + index);
    //  导出当前combo数据
    let { html: s, js } = (originClass as any).extends({ html, css });
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
    console.log(node._cfg.model.config, originClass);
    this.idMapTag.set(node._cfg.id, className + '-' + index);
    return (originClass as any).extends({ html, css, className });
  }
  onEdit(e) {
    let { detail } = e,
      { dom, value } = detail;
    console.log('编辑状态', value);
    this.jsonOnEdit = value;
  }
  changeNodeLayout(e) {
    // bboxCanvasCache储存的是旧的数据，更新后节点的中心点在model中，而且center不变
    let { detail } = e,
      { value } = detail;
    if (this.focusCombo) {
      const { nodes, combos } = this.focusCombo.getChildren(),
        { minX, minY } = this.focusCombo._cfg.bbox,
        elements = nodes.concat(combos);
      if (value.layout == 'row') {
        // 修改combo layout json
        this.focusCombo._cfg.model.config.css.style['flex-direction'] = 'row';
        console.log(this.focusCombo._cfg.model);
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
    let target = this.focusCombo ? 'focusCombo' : 'focusNode';
    const model = this[target]._cfg.model,
      config = model.config;
    console.log(model.config.html, newConfig);
    Object.assign(model.config.html, newConfig);
    console.log(config, this.focusNode);
    // 节点需要更新 view
    if (this.focusNode) {
      // 更新图
      let relationTarget = this.relationshipGraph.findById(model.id);
      if (this.focusNode) {
        this.graph.updateItem(this.focusNode, {
          ...this.focusNode._cfg.model,
          config,
        });
        // 节点更新数据后，config变成一个普通的对象，丢失了class 的 原型链
        this.graph.findById(model.id)._cfg.model.config = config;
      }
      if (relationTarget) {
        this.relationshipGraph.updateItem(relationTarget, {
          ...relationTarget._cfg.model,
          config,
        });
        this.relationshipGraph.findById(model.id)._cfg.model.config = config;
      }
      this.graph.updateCombos();
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
      });
    this.graph = graph;
    graph.read(this.data);
    this.graphAddEventListener();
  }

  focus(item) {
    this.graph.setItemState(item, 'focus', true);
  }
  unFocus(item) {
    if (!item) {
      return;
    }
    this.graph.setItemState(item, 'focus', false);
  }
  createEdge(e) {
    this.newEdge.update({
      ...this.newEdge._cfg.model,
      label: `${this.eventLine.map((item) => item.join('->')).join('\n')}`,
    });
    this.diaDisplay = false;
  }
  relationshipGraphAddEvent() {
    const graph = this.relationshipGraph;
    // 创建边之前
    graph.on('aftercreateedge', (e) => {
      const newEdge = e.edge,
        { sourceNode, targetNode } = newEdge._cfg,
        { event: sourceOutput, methods: sourceMethods } =
          sourceNode._cfg.model.config.component,
        { methods: targetOutput } = targetNode._cfg.model.config.component,
        edges = graph.save().edges;
      this.sourceOutput = sourceOutput;
      this.sourceMethods = sourceMethods;
      this.targetOutput = targetOutput;
      // this.source1.changeOptions(sourceOutput);
      // this.target1.changeOptions(targetOutput);
      G6.Util.processParallelEdges(edges, 50);
      graph.getEdges().forEach((edge, i) => {
        graph.updateItem(edge, {
          curveOffset: edges[i].curveOffset,
          curvePosition: edges[i].curvePosition,
        });
      });
      this.newEdge = newEdge;
      this.dialog.visibleChange();

      // this.cd.detectChanges();
    });
    graph.on('edge:click', (evt) => {
      const { source, target, label } = evt.item._cfg.model;
      const sourceNode = graph.findById(source),
        targetNode = graph.findById(target);
      const { event: sourceOutput } = sourceNode._cfg.model.config.component,
        { methods: targetOutput } = targetNode._cfg.model.config.component;
      this.sourceList = sourceOutput;
      this.targetList = targetOutput;
      this.dialog.visibleChange();
    });
  }
  graphAddEventListener() {
    const graph = this.graph;
    window['graph'] = graph;
    graph.on('click', (evt) => {
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
      this.eventNodes = [];
      [].concat(nodes, combos).map((item) => {
        this.eventNodes.push({ ...item._cfg.model });
      });
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
    document.addEventListener('keydown', (event) => {});
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
            targetType = (that.dragTarget as any).type;
          // 阻止默认动作（如打开一些元素的链接）
          event.preventDefault();
          // 将拖动的元素到所选择的放置目标节点中

          const nodeSetting = new configModule[
              id.toLocaleUpperCase() + '_CONFIG'
            ](),
            { className, html, css, component } = nodeSetting;
          let config = {
            x: targetX,
            y: targetY,
            id: String(Math.random()),
            type: id,
            config: nodeSetting,
          };
          console.log(nodeSetting, targetType, event.target);

          if (targetType === 'combo') {
            Object.assign(config, {
              label: id,
            });
            that.graph.createCombo({ ...config }, []);
          } else if (targetType === 'node') {
            that.graph.addItem('node', {
              ...config,
            });
          }
          if (
            component &&
            (component.event.length || component.methods.length)
          ) {
            that.relationshipGraph.addItem('node', {
              ...config,
            });
          }
        }
      },
      false
    );
  }
}

import G6 from '../../../g6.min.js';
import { measureText, NODE_CONFIG } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
class API_CONFIG extends NODE_CONFIG {
  className = 'APIComponent'; // 暴露出的组件class名称【组件可以注册到window上，并把配置同时暴露】
  html = {
    method: {
      type: 'array',
      options: [
        { label: 'get', value: 'get' },
        { label: 'post', value: 'post' },
        { label: 'put', value: 'put' },
        { label: 'delete', value: 'delete' },
      ],
      value: 'get',
    },
    api: {
      type: 'string',
      value:
        'https://www.fastmock.site/mock/14c2723aefa052a75b2a6feeed0cf387/suger/records',
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [
      { label: 'loading', value: 'loading' },
      { label: 'error', value: 'error' },
      { label: 'success200', value: 'success200' },
      { label: 'success500', value: 'success500' },
    ],
    methods: [{ label: 'request', value: 'request' }],
    data: ['data', 'message'],
    params: [],
  };
}
function registerAPI(configModule) {
  configModule['API_CONFIG'] = API_CONFIG;
  G6.registerNode(
    'api',
    {
      options: {
        myName: 'text',
        size: [60],
        style: {
          fill: 'l(0) 0:#f5ece4 0.7:#fa9b4b 1:#fd5c13',
          radius: [3, 3],
        },
      },
      draw(cfg, group) {
        const self = this,
          name = '★';
        // 获取配置中的 Combo 内边距
        cfg.padding = [5, 5, 5, 5];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('circle', {
          attrs: {
            ...style,
            size: [30],
          },
          draggable: true,
          name: 'text-border',
        });
      },
      afterDraw(cfg, group) {
        const name = '★',
          width = measureText(name, '14px');
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: name,
            x: -(width + 30) / 2 + 11,
            y: 2,
            fontSize: 24,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#fa5235',
          },
          name: 'text-shape',
        });

        const bbox = group.getBBox();
        const anchorPoints = this.getAnchorPoints(cfg);
        anchorPoints.forEach((anchorPos, i) => {
          group.addShape('circle', {
            attrs: {
              r: 5,
              x: bbox.x + bbox.width * anchorPos[0],
              y: bbox.y + bbox.height * anchorPos[1],
              fill: '#fff',
              stroke: '#5F95FF',
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: `anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
            anchorPointIdx: i, // flag the idx of the anchor-point circle
            links: 0, // cache the number of edges connected to this shape
            visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
            draggable: true, // allow to catch the drag events on this shape
          });
        });
      },
      getAnchorPoints(cfg) {
        return (
          cfg.anchorPoints || [
            [0, 0.5],
            [0.33, 0],
            [0.66, 0],
            [1, 0.5],
            [0.33, 1],
            [0.66, 1],
          ]
        );
      },
      // response the state changes and show/hide the link-point circles
      setState(name, value, item) {
        if (name === 'showAnchors') {
          const anchorPoints = item
            .getContainer()
            .findAll((ele) => ele.get('name') === 'anchor-point');
          anchorPoints.forEach((point) => {
            if (value || point.get('links') > 0) point.show();
            else point.hide();
          });
        }
      },
      update(cfg, node) {
        const name = '★',
          textLength = measureText(name, '14px'),
          group = node.getContainer();
        let textShape, box;
        group.find((item) => {
          if (item.get('name') === 'text-shape') {
            textShape = item;
          }
          if (item.get('name') === 'text-border') {
            box = item;
          }
        });
        textShape.attr('text', name);
        box.attr({
          width: textLength + 30,
        });
      },
    },
    'circle'
  );
}
export { registerAPI };

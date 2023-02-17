import G6 from '../../../g6.min.js';
import { measureText, NODE_CONFIG } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
class BUTTON_CONFIG extends NODE_CONFIG {
  className = 'ButtonComponent'; // 暴露出的组件class名称【组件可以注册到window上，并把配置同时暴露】
  html = {
    disabled: {
      type: 'boolean',
      value: false,
    },
    ghost: {
      type: 'boolean',
      value: false,
    },
    loading: {
      type: 'boolean',
      value: false,
    },
    shape: {
      type: 'array',
      options: [
        { label: 'default', value: '' },
        { label: 'circle', value: 'circle' },
        { label: 'round', value: 'round' },
      ],
      value: '',
    },
    size: {
      type: 'array',
      options: [
        { label: 'default', value: 'default' },
        { label: 'large', value: 'large' },
        { label: 'small', value: 'small' },
      ],
      value: 'default',
    },
    type: {
      type: 'array',
      options: [
        { label: 'primary', value: 'primary' },
        { label: 'dashed', value: 'dashed' },
        { label: 'link', value: 'link' },
        { label: 'text', value: 'text' },
      ],
      value: 'primary',
    },
    block: {
      type: 'boolean',
      value: false,
    },
    danger: {
      type: 'boolean',
      value: false,
    },
    icon: {
      type: 'string',
      value: 'search',
    },
    name: {
      type: 'string',
      value: 'search',
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [{ label: 'click', value: 'click' }],
    methods: [
      { label: 'setLoading', value: 'setLoading' },
      { label: 'normal', value: 'normal' },
      { label: 'setDisabled', value: 'setDisabled' },
    ],
  };
}
function registerButton(configModule) {
  configModule['BUTTON_CONFIG'] = BUTTON_CONFIG;

  G6.registerNode(
    'button',
    {
      options: {
        myName: 'text',
        size: [200, 30],
        style: {
          fill: '#1085cac9',
          radius: [3, 3],
        },
      },
      draw(cfg, group) {
        const self = this,
          name = cfg.config.html.name.value;
        // 获取配置中的 Combo 内边距
        cfg.padding = [5, 5, 5, 5];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg),
          width = measureText(name, '14px');
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('rect', {
          attrs: {
            ...style,
            width: width + 30,
            x: -(width + 30) / 2,
            height: style.height,
          },
          draggable: true,
          name: 'text-border',
        });
      },
      afterDraw(cfg, group) {
        const { html } = cfg.config,
          name = html.name.value,
          width = measureText(name, '14px');
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: name,
            x: -(width + 30) / 2 + 15,
            y: 2,
            fontSize: 14,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#ffffff',
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
        const { html } = cfg.config,
          name = html.name.value,
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
    'rect'
  );
}
export { registerButton };

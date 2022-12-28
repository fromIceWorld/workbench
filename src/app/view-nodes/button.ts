import G6 from '../../../g6.min.js';
import { measureText, NODE_CONFIG } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
class BUTTON_CONFIG extends NODE_CONFIG {
  className = 'ButtonComponent'; // 暴露出的组件class名称【组件可以注册到window上，并把配置同时暴露】
  html = {
    attributes: {},
    properties: {
      disabled: false,
      ghost: false,
      loading: false,
      shape: '',
      size: 'default',
      type: 'primary',
      block: false,
      danger: false,
      icon: 'search',
      name: 'Search',
    },
    config: {
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
          { label: 'default', value: '' },
          { label: 'primary', value: 'primary' },
          { label: 'dashed', value: 'dashed' },
          { label: 'link', value: 'link' },
          { label: 'text', value: 'text' },
        ],
        value: '',
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
      tags: {
        type: 'list',
        options: ['one', 'two'],
        value: 'one',
      },
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [{ label: 'click', value: 'click' }],
    methods: [
      { label: 'loading', value: 'loading' },
      { label: 'normal', value: 'normal' },
      { label: 'disabled', value: 'disabled' },
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
          { properties } = cfg.config.html,
          { name } = properties;
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
        const { properties } = cfg.config.html,
          { name } = properties,
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
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'text-shape',
        });
      },
      update(cfg, node) {
        const { properties } = cfg.config.html,
          { name } = properties,
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
      afterUpdate(cfg, item) {
        // const { json } = cfg,
        //     { text } = json,
        //     group = item.getContainer();
        // let textShape = group.findById('text');
        // textShape.attr('text', text);
      },
    },
    'rect'
  );
}
export { registerButton };

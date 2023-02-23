import G6 from '../../../g6.min.js';
import { NODE_CONFIG } from './node/base/index.js';
let count = 0;
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
function registerCommon(configModule) {
  G6.registerNode(
    'common',
    {
      drawShape: function drawShape(cfg, group) {
        const { img } = cfg;
        const style = this.getShapeStyle(cfg);

        group.addShape('image', {
          attrs: {
            width: img.width,
            height: img.height,
            x: -img.width / 2,
            y: -img.height / 2,
            // DOM's html
            img: `
             ${img.base}
                `,
          },
          // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          name: 'component',
          draggable: true,
          zIndex: -1,
        });
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        const rect = group.addShape('rect', {
          attrs: {
            ...style,
            x: -img.width / 2,
            y: -img.height / 2,
            stroke: '#fff0',
            fill: '#fff0',
            width: img.width,
            height: img.height,
          },
          draggable: true,
          name: 'container', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          zIndex: 100,
        });
        // renderTable(cfg, group, false, null);
        return rect;
      },
      afterUpdate(cfg, node) {
        const { tagName } = cfg,
          dom = document.querySelector(tagName),
          group = node.getContainer();
        const container = group.getFirst(),
          img = group.getLast();
        //@ts-ignore
        html2canvas(dom).then((canvas) => {
          console.log(
            canvas.toDataURL('img'),
            dom.offsetWidth,
            dom.offsetHeight
          );
          container.attr({
            width: dom.offsetWidth,
            height: dom.offsetHeight,
          });
          img.attr('img', canvas.toDataURL('img'));
        });
        console.log();
      },
    },
    'rect'
  );
}
export { registerCommon };

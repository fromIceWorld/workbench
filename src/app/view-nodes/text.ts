import G6 from '../../../g6.min.js';
import { measureText, NODE_CONFIG } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
class TEXT_CONFIG extends NODE_CONFIG {
  className = 'TextComponent';
  html = {
    text: {
      type: 'string',
      value: '姓名',
    },
  };
  css = {
    'font-size': {
      type: 'number',
      value: 14,
      postfix: 'px',
    },
    color: {
      type: 'string',
      value: 'black',
    },
  };
  component = {
    event: [],
    methods: [
      { label: 'showChange', value: 'showChange' },
      { label: 'show', value: 'show' },
      { label: 'hide', value: 'hide' },
    ],
    data: [{ label: 'text', value: 'text' }],
    params: [{ label: 'text', value: 'text' }],
  };
}
function registerText() {
  G6.registerNode(
    'text',
    {
      draw(cfg, group) {
        const self = this,
          { html, css } = cfg.config,
          text = html.text.value,
          fontSize = css['font-size'].value + css['font-size'].postfix;
        // 获取配置中的 Combo 内边距
        cfg.padding = [5, 5, 5, 5];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg),
          width = measureText(text, fontSize);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('rect', {
          attrs: {
            ...style,
            width: width + 10,
            x: -(width + 10) / 2,
            height: style.height,
          },
          draggable: true,
          name: 'text-border',
        });
      },
      afterDraw(cfg, group) {
        const { html, css } = cfg.config,
          text = html.text.value,
          fontSize = css['font-size'].value + css['font-size'].postfix,
          color = css['color'].value,
          width = measureText(text, fontSize);
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: text,
            x: -(width + 10) / 2 + 5,
            y: 2,
            fontSize: css['font-size'].value,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: 'red',
          },
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'text-shape',
        });
      },
      // response the state changes and show/hide the link-point circles
      update(cfg, node) {
        const { html, css } = cfg.config,
          text = html.text.value,
          fontSize = css['font-size'].value + css['font-size'].postfix,
          color = css['color'].value,
          textLength = measureText(text, fontSize),
          group = node.get('group');
        let textShape, box;
        group.find((item) => {
          if (item.get('name') === 'text-shape') {
            textShape = item;
          }
          if (item.get('name') === 'text-border') {
            box = item;
          }
        });
        textShape.attr({
          text: text,
          fill: color,
        });
        box.attr({
          width: textLength + 10,
        });
      },
    },
    'rect'
  );
}
export { registerText };

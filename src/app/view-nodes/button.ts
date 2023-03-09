import G6 from '../../../g6.min.js';
import { measureText } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存

function registerButton() {
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
      },
      // response the state changes and show/hide the link-point circles
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

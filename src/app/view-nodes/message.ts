import G6 from '../../../g6.min.js';
import { measureText } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存

function registerMessage() {
  G6.registerNode(
    'message',
    {
      options: {
        myName: 'text',
        size: [60],
        style: {
          fill: 'l(0) 0:#aee899',
          radius: [3, 3],
        },
      },
      draw(cfg, group) {
        const self = this;
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
        const name = '🔔',
          width = measureText(name, '14px');
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: name,
            x: -(width + 30) / 2 + 10,
            y: 0,
            fontSize: 24,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#fa5235',
          },
          name: 'center-shape',
        });
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: 'message',
            x: -(width + 30) / 2 + 4,
            y: 18,
            fontSize: 10,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#fa5235',
          },
          name: 'text-shape',
        });
      },
      // response the state changes and show/hide the link-point circles
      update(cfg, node) {
        const name = '🔔',
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
export { registerMessage };

import G6 from '../../../g6.min.js';
import { measureText } from './node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存

function registerAPI() {
  G6.registerNode(
    'api',
    {
      options: {
        myName: 'text',
        size: [60],
        style: {
          fill: 'l(0) 0:#f5ece4 0.7:pink',
          radius: [3, 3],
        },
      },
      draw(cfg, group) {
        debugger;
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
        const name = '🕸',
          width = measureText(name, '14px');
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: name,
            x: -(width + 30) / 2 + 12,
            y: 2,
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
            text: 'api',
            x: -(width + 30) / 2 + 16,
            y: 20,
            fontSize: 10,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#fa5235',
          },
          name: 'text-shape',
        });

        // const bbox = group.getBBox();
        // const anchorPoints = this.getAnchorPoints(cfg);
        // anchorPoints.forEach((anchorPos, i) => {
        //   group.addShape('circle', {
        //     attrs: {
        //       r: 5,
        //       x: bbox.x + bbox.width * anchorPos[0],
        //       y: bbox.y + bbox.height * anchorPos[1],
        //       fill: '#fff',
        //       stroke: '#5F95FF',
        //     },
        //     // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
        //     name: `anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
        //     anchorPointIdx: i, // flag the idx of the anchor-point circle
        //     links: 0, // cache the number of edges connected to this shape
        //     visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
        //     draggable: true, // allow to catch the drag events on this shape
        //   });
        // });
      },
      // response the state changes and show/hide the link-point circles
    },
    'circle'
  );
}
export { registerAPI };

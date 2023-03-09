import G6 from '../../../../g6.min.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存

function registerTable() {
  G6.registerNode(
    'table',
    {
      drawShape: function drawShape(cfg, group) {
        const color = cfg.error ? '#F4664A' : '#30BF78';
        const r = 2;
        const shape = group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 60,
            stroke: color,
            radius: r,
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'main-box',
          draggable: true,
        });

        group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 20,
            fill: color,
            radius: [r, r, 0, 0],
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'title-box',
          draggable: true,
        });
        // title text
        group.addShape('text', {
          attrs: {
            textBaseline: 'top',
            y: 4,
            x: 10,
            lineHeight: 20,
            text: 'table',
            fill: '#fff',
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'title',
        });

        return shape;
      },
      afterDraw(cfg, group) {},

      // response the state changes and show/hide the link-point circles
    },
    'rect'
  );
}
export { registerTable };

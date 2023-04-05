import G6 from '../../../g6.min.js'; // 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
function registerCommon() {
  G6.registerNode(
    'common',
    {
      drawShape: function drawShape(cfg, group) {
        const { img, x, y } = cfg;
        let offsetX = x - 20,
          offsetY = y - 20;
        const style = this.getShapeStyle(cfg);
        console.log('cfg', cfg, style);
        group.addShape('image', {
          attrs: {
            // ...style,
            width: img.width,
            height: img.height,
            x: 0,
            y: 0,
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
            x: 0,
            y: 0,
            // x: x + 20,
            // x: x - img.width / 2,
            // y: y - img.height / 2,
            stroke: '#fff0',
            fill: '#fff0',
            width: img.width,
            height: img.height,
          },
          draggable: true,
          name: 'container', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          zIndex: 100,
        });
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
      },
    },
    'rect'
  );
}
export { registerCommon };

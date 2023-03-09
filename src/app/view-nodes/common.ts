import G6 from '../../../g6.min.js';
let count = 0;
// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
function registerCommon() {
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

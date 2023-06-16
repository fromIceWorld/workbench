import G6 from '../../../g6.min.js'; // 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
function registerCommon() {
  G6.registerNode(
    'common',
    {
      drawShape: function drawShape(cfg, group) {
        console.log('cfg', cfg);
        const { img, x, y, config } = cfg;
        const { width, height } = config.css;
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
            cursor: 'pointer',
          },
          // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          name: 'component',
          draggable: true,
          zIndex: 2,
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
            fill: '#00ff0026',
            width: width?.value || img.width,
            height: height?.value || img.height,
            cursor: 'pointer',
          },
          draggable: true,
          name: 'container', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
          zIndex: 1,
        });
        group.sort();
        return rect;
      },
      afterUpdate(cfg, node) {
        const { tagName } = cfg,
          dom = document.querySelector(tagName),
          group = node.getContainer();
        const container = group.getFirst(),
          img = group.getLast();
        // 获取真实组件
        // 获取的 dom 是 生成 web component时定义的一个外层，表现形式类似div，宽度默认是100% 在映射到视图区时有空白内容;
        // 强制 web component 内部只有一个根标签，容易获取。
        // Angular 可直接获取子节点。
        // Vue 有一层 shadowRoot包裹，需要更深入取值。
        let component, children;
        if (dom.shadowRoot) {
          children = dom.shadowRoot.children;
        } else {
          children = dom.children;
        }
        for (let node of children) {
          let tagName = node;
          if (!['STYLE', 'SCRIPT'].includes(tagName)) {
            component = node;
            break;
          }
        }
        console.log('component-----------------------------', component);
        //@ts-ignore
        html2canvas(component).then((canvas) => {
          console.log(
            canvas.toDataURL('img'),
            component.offsetWidth,
            component.offsetHeight
          );
          container.attr({
            width: component.offsetWidth,
            height: component.offsetHeight,
          });
          img.attr('img', canvas.toDataURL('img'));
        });
      },
    },
    'rect'
  );
}
export { registerCommon };

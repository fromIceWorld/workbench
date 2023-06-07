import G6 from '../../../g6.min.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存

function registerBox() {
  G6.registerNode(
    'box',
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
        console.log(cfg);
        const { width, height, config } = cfg;
        const { html, css } = config;
        const backgroundColor = css['background-color'].value || '#fff0',
          borderWidth = css['border-width'].value,
          borderStyle = css['border-style'].value,
          borderColor = css['border-color'].value,
          borderRadius = css['border-radius'].value;
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: width,
            height: height,
            fill: backgroundColor,
            lineWidth: borderWidth,
            stroke: borderColor,
            radius: borderRadius,
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'main-box',
          draggable: true,
        });
      },
      update(cfg, node) {
        debugger;
        const { html, css } = cfg.config,
          group = node.getContainer();
        let box;
        group.find((item) => {
          if (item.get('name') === 'main-box') {
            box = item;
          }
        });
        const backgroundColor = css['background-color'].value || '#30BF78',
          borderWidth = css['border-width'].value,
          borderStyle = css['border-style'].value,
          borderColor = css['border-color'].value,
          borderRadius = css['border-radius'].value;
        box.attr({
          stroke: borderColor,
          fill: backgroundColor,
          lineWidth: borderWidth,
          radius: borderRadius,
        });
      },
    },
    'rect'
  );
}
export { registerBox };

import G6 from '../../../../g6.min.js';

function registerDialog() {
  G6.registerCombo(
    'dialog',
    {
      drawShape: function drawShape(cfg, group) {
        const self = this,
          css = cfg.config.css;
        // 获取配置中的 Combo 内边距
        cfg.padding = [20, 20, 20, 20];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        const rect = group.addShape('rect', {
          attrs: {
            ...style,
            // x: -style.width / 2,
            // y: -style.height / 2,
            width: style.width,
            height: style.height,
          },
          draggable: true,
          name: 'combo-keyShape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });
        group.addShape('rect', {
          attrs: {
            ...style,
            x: -style.width / 2 + 10,
            y: -style.height / 2 + 10,
            width: style.width - 20,
            height: style.height - 20,
          },
          draggable: true,
          name: 'combo-grid', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });
        // 增加label
        group.addShape('text', {
          attrs: {
            ...style,
            text: 'inline-block',
            fill: '#000',
            opacity: 1,
            // cfg.style.width 与 cfg.style.heigth 对应 rect Combo 位置说明图中的 innerWdth 与 innerHeight
            // x: cfg.style.width / 2 + cfg.padding[1],
            // y: (cfg.padding[2] - cfg.padding[0]) / 2,
            x: -style.width / 2,
            y: -style.height / 2,
            r: 5,
          },
          draggable: true,
          name: 'combo-label', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });

        // 增加背景
        return rect;
      },
      afterUpdate: function (cfg, node) {
        const group = node.getContainer();
        let container, grid;
        group.find((item) => {
          const name = item.get('name');
          if (name === 'combo-keyShape') {
            container = item;
          }
          if (name === 'combo-grid') {
            grid = item;
          }
        });
        console.log(container);
        const { width, height, x, y } = container.attrs;
        grid.attr({
          x: x + 10,
          y: y + 10,
          width: width - 20,
          height: height - 20,
        });
      },
    },
    'rect'
  );
}
export { registerDialog };

import G6 from '../../../../g6.min.js';

function registerDialog() {
  G6.registerCombo(
    'dialog_model',
    {
      options: {
        style: {
          lineWidth: 1,
          fill: '#00000000',
          stroke: '#efefef',
          lineDash: [5],
        },
        labelCfg: {
          refX: 1,
          refY: 1,
          style: {
            // fontWeight: 600,
            fill: '#e31366',
            fontSize: 10,
          },
        },
      },
      drawShape: function drawShape(cfg, group) {
        const self = this;
        // 获取配置中的 Combo 内边距
        cfg.padding = [10, 10, 10, 10];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        const rect = group.addShape('rect', {
          attrs: {
            ...style,
            x: -style.width / 2 - (cfg.padding[3] - cfg.padding[1]) / 2,
            y: -style.height / 2 - (cfg.padding[0] - cfg.padding[2]) / 2,
            // width: style.width,
            // height: style.height,
            width: 60,
            height: 50,
          },
          draggable: true,
          name: 'combo-keyShape',
        });
        return rect;
      },
      afterDraw(cfg, group) {},

      // response the state changes and show/hide the link-point circles
    },
    'rect'
  );
}
export { registerDialog };

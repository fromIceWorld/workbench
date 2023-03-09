import G6 from '../../../../g6.min.js';

function registerContainer() {
  G6.registerCombo(
    'container',
    {
      drawShape: function drawShape(cfg, group) {
        const paddingConfig = cfg.config.css,
          padding = [
            paddingConfig['padding-top'].value,
            paddingConfig['padding-right'].value,
            paddingConfig['padding-bottom'].value,
            paddingConfig['padding-left'].value,
          ];
        // 获取配置中的 Combo 内边距
        cfg.padding = padding;
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = this.getShapeStyle(cfg);
        let defaultConfig = {
          lineWidth: 1,
          stroke: '#cbc8c8',
          lineDash: [5],
        };
        // 是否配置border
        if (paddingConfig['border'] && paddingConfig['border'].value) {
          defaultConfig['lineWidth'] = paddingConfig['border-width'].value;
          defaultConfig['stroke'] = paddingConfig['border-color'].value;
          switch (paddingConfig['border-style'].value) {
            case 'solid':
              defaultConfig['lineDash'] = null;
              break;
            case 'dashed':
              defaultConfig['lineDash'] = [5];
              break;
            default:
              defaultConfig['lineDash'] = [5];
              break;
          }
        }
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        const rect = group.addShape('rect', {
          attrs: {
            ...style,
            ...defaultConfig,
          },
          draggable: true,
          name: 'combo-keyShape',
        });
        return rect;
      },
    },
    'rect'
  );
}
export { registerContainer };

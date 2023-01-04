import G6 from '../../../../g6.min.js';
import { COMBINATION_CONFIG } from '../container/index';
class CONTAINER_CONFIG extends COMBINATION_CONFIG {
  className = 'ContainerComponent';
  html = {};
  css = {
    classes: '',
    style: {
      display: 'flex',
    },
  };
  component = {
    event: [],
    methods: [],
  };
}

function registerContainer(configModule) {
  configModule['CONTAINER_CONFIG'] = CONTAINER_CONFIG;
  G6.registerCombo(
    'container',
    {
      options: {
        style: {
          lineWidth: 1,
          fill: '#00000000',
          stroke: '#bfb9b9b3',
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
            width: 60,
            height: 50,
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

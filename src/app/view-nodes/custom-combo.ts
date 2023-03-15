import G6 from '../../../g6.min.js';

function registerBlock() {
  G6.registerCombo(
    'block',
    {
      drawShape: function drawShape(cfg, group) {
        const paddingConfig = cfg.config.css,
          padding = [
            paddingConfig['padding-top'].value,
            paddingConfig['padding-right'].value,
            paddingConfig['padding-bottom'].value,
            paddingConfig['padding-left'].value,
          ];
        const defaultConfig = {
          lineWidth: 1,
          stroke: '#cbc8c8',
          lineDash: [5],
        };
        // 获取配置中的 Combo 内边距
        cfg.padding = padding;
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = this.getShapeStyle(cfg);
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
            x: 0,
            y: 0,
            width: style.width,
            height: style.height,
          },
          draggable: true,
          name: 'combo-keyShape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });
        window['rect'] = rect;
        // 增加右侧圆
        // group.addShape('circle', {
        //   attrs: {
        //     ...style,
        //     fill: '#fff',
        //     opacity: 1,
        //     // cfg.style.width 与 cfg.style.heigth 对应 rect Combo 位置说明图中的 innerWdth 与 innerHeight
        //     x: 0,
        //     y: 0,
        //     r: 5,
        //   },
        //   draggable: true,
        //   name: 'combo-circle-shape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        // });
        return rect;
      },
      update(cfg, combo) {},
      afterUpdate(cfg, combo) {
        const nodes = combo.getNodes();
        const group = combo.get('group');
        // 在该 Combo 的图形分组根据 name 找到右侧圆图形
        const container = group.find(
          (ele) => ele.get('name') === 'combo-keyShape'
        );
        let containerMaxX = 0,
          containerMinX = Infinity,
          containerMinY = Infinity,
          containerMaxY = 0;
        if (nodes.length == 0) {
          return;
        }
        nodes.forEach((node) => {
          const { x, y, img } = node._cfg.model,
            { width, height } = img;
          console.log('x', x);
          console.log('y', y);
          console.log('width', width);
          console.log('height', height);
          containerMaxX = Math.max(containerMaxX, x + width);
          containerMinX = Math.min(containerMinX, x);
          containerMaxY = Math.max(containerMaxY, y + height);
          containerMinY = Math.min(containerMinY, y);
        });
        const style = this.getShapeStyle(cfg);
        container.attr({
          ...style,
          width:
            containerMaxX - containerMinX > 0
              ? containerMaxX - containerMinX + cfg.padding[1] + cfg.padding[3]
              : 20,
          // 200,
          height:
            containerMaxY - containerMinY > 0
              ? containerMaxY - containerMinY + cfg.padding[0] + cfg.padding[2]
              : 20,
        });
        // circle.attr({
        //   r: 50,
        // });
        // group.addShape('rect', {
        //   attrs: {
        //     ...style,
        //     fill: '#fff',
        //     opacity: 1,
        //     width:
        //       containerMaxX - containerMinX > 0
        //         ? containerMaxX -
        //           containerMinX +
        //           cfg.padding[1] +
        //           cfg.padding[3]
        //         : 20,
        //     height:
        //       containerMaxY - containerMinY > 0
        //         ? containerMaxY -
        //           containerMinY +
        //           cfg.padding[0] +
        //           cfg.padding[2]
        //         : 20,
        //   },
        //   draggable: true,
        //   name: 'combo-circle-shape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        // });
        console.log(
          containerMaxX - containerMinX,
          containerMaxY - containerMinY
        );
      },
    },
    'rect'
  );
}
export { registerBlock };

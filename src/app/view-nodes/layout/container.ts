import G6 from '../../../../g6.min.js';

function deepBox(item) {
  const { type, model } = item._cfg;
  let containerMaxX = 0,
    containerMinX = Infinity,
    containerMinY = Infinity,
    containerMaxY = 0;
  if (type == 'node') {
    const { x, y, img } = model,
      { width, height } = img;
    containerMaxX = Math.max(containerMaxX, x + width);
    containerMinX = Math.min(containerMinX, x);
    containerMaxY = Math.max(containerMaxY, y + height);
    containerMinY = Math.min(containerMinY, y);
  } else if (type == 'combo') {
    debugger;
    const { padding, config } = item._cfg.model;
    const widthValue = config.css['width'].value,
      heightValue = config.css['height'].value;
    let width = 0,
      height = 0;
    if (/%/.test(widthValue)) {
      width = (1920 * Number(widthValue.slice(0, widthValue.length - 1))) / 100;
    } else if (/px$/.test(widthValue)) {
      width = Number(widthValue.slice(0, widthValue.length - 2));
    }
    if (/px$/.test(heightValue)) {
      height = Number(heightValue.slice(0, heightValue.length - 2));
    }
    const { nodes, combos } = item.getChildren();
    [...nodes, ...combos].forEach((item) => {
      let {
        containerMaxX: maxX,
        containerMinX: minX,
        containerMaxY: maxY,
        containerMinY: minY,
      } = deepBox(item);
      containerMaxX = Math.max(containerMaxX, maxX + width + padding[1]);
      containerMinX = Math.min(containerMinX, minX - padding[3]);
      containerMaxY = Math.max(containerMaxY, maxY + height + padding[2]);
      containerMinY = Math.min(containerMinY, minY - padding[0]);
    });
  }
  return { containerMaxX, containerMinX, containerMaxY, containerMinY };
}
function registerContainer() {
  G6.registerCombo(
    'container',
    {
      drawShape: function drawShape(cfg, group) {
        const cssConfig = cfg.config.css,
          padding = [
            cssConfig['padding-top'].value,
            cssConfig['padding-right'].value,
            cssConfig['padding-bottom'].value,
            cssConfig['padding-left'].value,
          ],
          borderWidth = cssConfig['border-width'].value,
          widthValue = cssConfig['width'].value,
          heightValue = cssConfig['height'].value;
        let width = 0,
          height = 0;
        if (/%/.test(widthValue)) {
          width =
            (1920 * Number(widthValue.slice(0, widthValue.length - 1))) / 100;
        } else if (/px$/.test(widthValue)) {
          width = Number(widthValue.slice(0, widthValue.length - 2));
        }
        if (/px$/.test(heightValue)) {
          height = Number(heightValue.slice(0, heightValue.length - 2));
        }
        console.log('borderWidth', borderWidth);
        const defaultConfig = {
          lineWidth: borderWidth.value || 1,
          stroke: 'red',
          lineDash: [5],
        };
        // 获取配置中的 Combo 内边距
        cfg.padding = padding;
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = this.getShapeStyle(cfg);
        // 是否配置border
        if (cssConfig['border'] && cssConfig['border'].value) {
          defaultConfig['lineWidth'] = cssConfig['border-width'].value;
          defaultConfig['stroke'] = 'red' || cssConfig['border-color'].value;
          switch (cssConfig['border-style'].value) {
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
            width: width + padding[1] + padding[3],
            height: height + padding[0] + padding[2],
          },
          draggable: true,
          name: 'combo-keyShape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });
        // 增加右侧圆;
        // group.addShape('circle', {
        //   attrs: {
        //     ...style,
        //     fill: '#fff',
        //     opacity: 1,
        //     // cfg.style.width 与 cfg.style.heigth 对应 rect Combo 位置说明图中的 innerWdth 与 innerHeight
        //     x: 0,
        //     y: 0,
        //     r: 50,
        //   },
        //   draggable: true,
        //   name: 'combo-circle-shape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        // });
        return rect;
      },
      // 接管默认的rect更新操作
      update(cfg, combo) {},
      afterUpdate(cfg, combo) {
        const cssConfig = cfg.config.css,
          padding = [
            cssConfig['padding-top'].value,
            cssConfig['padding-right'].value,
            cssConfig['padding-bottom'].value,
            cssConfig['padding-left'].value,
          ],
          borderWidth = cssConfig['border-width'].value,
          widthValue = cssConfig['width'].value,
          heightValue = cssConfig['height'].value;
        let width = 0,
          height = 0;
        if (/%/.test(widthValue)) {
          width =
            (1920 * Number(widthValue.slice(0, widthValue.length - 1))) / 100;
        } else if (/px$/.test(widthValue)) {
          width = Number(widthValue.slice(0, widthValue.length - 2));
        }
        if (/px$/.test(heightValue)) {
          height = Number(heightValue.slice(0, heightValue.length - 2));
        }
        // 判断 children 如果没有新增的children，不更新自身，随着拖动
        const { nodes, combos } = combo.getChildren();
        console.log('combos', combos);
        const group = combo.get('group');
        // 在该 Combo 的图形分组根据 name 找到右侧圆图形
        const container = group.find(
          (ele) => ele.get('name') === 'combo-keyShape'
        );
        let containerMaxX = 0,
          containerMinX = Infinity,
          containerMinY = Infinity,
          containerMaxY = 0;
        // if (nodes.length == 0 || combos.length == 0) {
        //   return;
        // }
        nodes.forEach((node) => {
          const { x, y, img } = node._cfg.model,
            { width, height } = img;
          containerMaxX = Math.max(containerMaxX, x + width);
          containerMinX = Math.min(containerMinX, x);
          containerMaxY = Math.max(containerMaxY, y + height);
          containerMinY = Math.min(containerMinY, y);
        });
        combos.forEach((node) => {
          const {
            containerMaxX: maxX,
            containerMinX: minX,
            containerMaxY: maxY,
            containerMinY: minY,
          } = deepBox(node);
          containerMaxX = Math.max(containerMaxX, maxX);
          containerMinX = Math.min(containerMinX, minX);
          containerMaxY = Math.max(containerMaxY, maxY);
          containerMinY = Math.min(containerMinY, minY);
        });
        if (containerMinX == Infinity) {
          containerMinX = padding[1];
        }
        if (containerMinY == Infinity) {
          containerMinY = padding[2];
        }
        const style = this.getShapeStyle(cfg);
        container.attr({
          ...style,
          stroke: 'red',
          width:
            containerMaxX - containerMinX > 0
              ? Math.max(width, containerMaxX - containerMinX) +
                padding[1] +
                padding[3]
              : width + padding[1] + padding[3],
          // 200,
          height:
            containerMaxY - containerMinY > 0
              ? Math.max(height, containerMaxY - containerMinY) +
                padding[0] +
                padding[2]
              : height + padding[0] + padding[2],
        });
        console.log('width height', width, height);

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
      },
    },
    'rect'
  );
}
export { registerContainer };

import G6 from '../../../../g6.min.js';

// 计算combo width，height
function deepBox(item) {
  const { type, model } = item._cfg;
  let containerMaxX = -Infinity,
    containerMinX = Infinity,
    containerMinY = Infinity,
    containerMaxY = -Infinity;
  if (type == 'node') {
    // 节点的范围是： x,y是左上角的坐标，加上 width，height 就是 右下角坐标
    const { x, y, img } = model,
      { width, height } = img;
    containerMaxX = Math.max(containerMaxX, x + width);
    containerMinX = Math.min(containerMinX, x);
    containerMaxY = Math.max(containerMaxY, y + height);
    containerMinY = Math.min(containerMinY, y);
  } else if (type == 'combo') {
    // combo范围是: 子节点/子combo 的范围 + 自身padding
    const { padding, config } = item._cfg.model;
    const widthValue = config.css['width'].value,
      heightValue = config.css['height'].value;
    let width = 0,
      height = 0;
    if (/%$/.test(widthValue)) {
      width = (1920 * Number(widthValue.slice(0, widthValue.length - 1))) / 100;
    } else if (/px$/.test(widthValue)) {
      width = Number(widthValue.slice(0, widthValue.length - 2));
    }
    if (/px$/.test(heightValue)) {
      height = Number(heightValue.slice(0, heightValue.length - 2));
    }
    // 根据width,height 算出右下坐标
    const { nodes, combos } = item.getChildren();
    [...nodes, ...combos].forEach((item) => {
      let {
        containerMaxX: maxX,
        containerMinX: minX,
        containerMaxY: maxY,
        containerMinY: minY,
      } = deepBox(item);
      containerMaxX = Math.max(containerMaxX, maxX);
      containerMinX = Math.min(containerMinX, minX);
      containerMaxY = Math.max(containerMaxY, maxY);
      containerMinY = Math.min(containerMinY, minY);
    });
    if (nodes.length == 0 && combos.length == 0) {
      // x,y 在节点元素的model中是 左上角的坐标
      // 但在combo中 x,y有一定的偏移 bboxCanvasCache中的x,y才是左上角坐标
      let x, y;
      if (item._cfg.bboxCanvasCache) {
        x = item._cfg.bboxCanvasCache.x;
        y = item._cfg.bboxCanvasCache.y;
      } else {
        x = model.x;
        y = model.y;
      }
      // 当没有子元素时，最小的x,y 就是自身属性
      // 最大的 x,y 就是自身x,y + width，height。padding
      containerMinX = x;
      containerMinY = y;
      containerMaxX = containerMinX + padding[3] + width + padding[1];
      containerMaxY = containerMinY + padding[0] + height + padding[2];
    } else {
      // 有子元素时，确定自身设置的宽度与子元素的宽度比较，取较大值
      // 再向向四周扩展padding
      containerMaxX =
        containerMinX +
        Math.max(containerMaxX - containerMinX, width) +
        padding[1];
      containerMaxY =
        containerMinY +
        Math.max(containerMaxY - containerMinY, height) +
        padding[2];
      containerMinX -= padding[3];
      containerMinY -= padding[0];
    }
  }
  return { containerMaxX, containerMinX, containerMaxY, containerMinY };
}
function registerContainer() {
  G6.registerCombo(
    'container',
    {
      drawShape: function drawShape(cfg, group) {
        const self = this,
          css = cfg.config.css;
        // 获取配置中的 Combo 内边距
        cfg.padding = [
          css['padding-top'].value,
          css['padding-right'].value,
          css['padding-bottom'].value,
          css['padding-left'].value,
        ];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        const rect = group.addShape('rect', {
          attrs: {
            ...style,
            x: -style.width / 2 - (cfg.padding[3] - cfg.padding[1]) / 2,
            y: -style.height / 2 - (cfg.padding[0] - cfg.padding[2]) / 2,
            width: style.width,
            height: style.height,
          },
          draggable: true,
          name: 'combo-keyShape', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
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
            x: -cfg.style.width / 2 - cfg.padding[3],
            y: -cfg.style.height / 2 - cfg.padding[0],
            r: 5,
          },
          draggable: true,
          name: 'combo-label', // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        });
        return rect;
      },
    },
    'rect'
  );
}
export { registerContainer };

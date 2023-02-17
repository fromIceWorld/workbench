import G6 from '../../../../g6.min.js';
import { COMBINATION_CONFIG } from '../container/index.js';
class DIALOG_MODEL_CONFIG extends COMBINATION_CONFIG {
  className = 'DialogComponent';
  html = {
    title: {
      type: 'string',
      value: '对话框',
    },
  };
  css = {
    classes: '',
    style: {
      display: 'flex',
    },
  };
  component = {
    event: [
      { label: 'visible', value: 'visible' },
      { label: 'hiden', value: 'hiden' },
      { label: 'visibleChange', value: 'visibleChange' },
    ],
    methods: [
      { label: 'visible', value: 'visible' },
      { label: 'hiden', value: 'hiden' },
      { label: 'visibleChange', value: 'visibleChange' },
    ],
  };
}

function registerDialog(configModule) {
  configModule['DIALOG_MODEL_CONFIG'] = DIALOG_MODEL_CONFIG;
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
      afterDraw(cfg, group) {
        const bbox = group.getBBox();
        const anchorPoints = this.getAnchorPoints(cfg);
        anchorPoints.forEach((anchorPos, i) => {
          group.addShape('circle', {
            attrs: {
              r: 5,
              x: bbox.x + bbox.width * anchorPos[0],
              y: bbox.y + bbox.height * anchorPos[1],
              fill: '#fff',
              stroke: '#5F95FF',
            },
            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
            name: `anchor-point`, // the name, for searching by group.find(ele => ele.get('name') === 'anchor-point')
            anchorPointIdx: i, // flag the idx of the anchor-point circle
            links: 0, // cache the number of edges connected to this shape
            visible: false, // invisible by default, shows up when links > 1 or the node is in showAnchors state
            draggable: true, // allow to catch the drag events on this shape
          });
        });
      },
      getAnchorPoints(cfg) {
        return (
          cfg.anchorPoints || [
            [0, 0.5],
            [0.33, 0],
            [0.66, 0],
            [1, 0.5],
            [0.33, 1],
            [0.66, 1],
          ]
        );
      },
      // response the state changes and show/hide the link-point circles
      setState(name, value, item) {
        if (name === 'showAnchors') {
          const anchorPoints = item
            .getContainer()
            .findAll((ele) => ele.get('name') === 'anchor-point');
          anchorPoints.forEach((point) => {
            if (value || point.get('links') > 0) point.show();
            else point.hide();
          });
        }
      },
    },
    'rect'
  );
}
export { registerDialog };

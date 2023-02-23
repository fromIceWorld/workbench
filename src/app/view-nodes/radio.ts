import G6 from '../../../g6.min.js';
import { measureText, NODE_CONFIG } from './node/base/index.js';
const innerChecedFill = '#1890ff',
  outerChecedFill = '#1890ff',
  innerNoChecedFill = '#00000000',
  outerNoChecedFill = '#564C4C';

function renderRadio(group, json, destroy) {
  if (destroy) {
    let willDel = group.findAll(function (item) {
      return item.attr('name') !== 'radio-border';
    });
    willDel.forEach((item) => group.removeChild(item));
  }
  const { options, value } = json.options,
    boxWidth = computedWidth(options);
  options.reduce((preWidth, item, index) => {
    group.addShape('text', {
      id: item,
      attrs: {
        x: 15 + preWidth,
        y: 2,
        text: item,
        fontSize: 14,
        textAlign: 'left',
        textBaseline: 'middle',
        fill: '#000000d9',
      },
      name: item + '_label' + Math.random(),
    });
    group.addShape('circle', {
      attrs: {
        x: preWidth,
        y: 0,
        r: 4,
        fill: item === value ? innerChecedFill : innerNoChecedFill,
      },
      // must be assigned in G6 3.3 and later versions. it can be any value you want
      name: item + '_inner-circle' + Math.random(),
    });
    group.addShape('circle', {
      attrs: {
        x: preWidth,
        y: 0,
        r: 7,
        stroke: item === value ? '#1890ff' : '#d9d9d9',
      },
      // must be assigned in G6 3.3 and later versions. it can be any value you want
      name: item + '_outer-circle' + Math.random(),
    });
    return preWidth + 30 + measureText(item);
  }, -35) + 30;
  const box = group.find(function (item) {
    return item.attr('name') === 'radio-border';
  });
  box.attr({
    width: boxWidth,
    height: 30,
  });
}
function computedWidth(optionsString) {
  let width = optionsString.reduce((preWidth, item, index) => {
    return preWidth + 30 + measureText(item);
  }, 0);
  return width;
}
class RADIO_CONFIG extends NODE_CONFIG {
  className = 'RadioComponent';
  html = {
    formcontrol: {
      type: 'string',
      value: 'sex',
    },
    options: {
      type: 'list',
      options: ['男', '女'],
      value: '男',
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [{ label: 'change', value: 'change' }],
    methods: [],
    data: ['value'],
    params: [{ label: 'value', value: 'value' }],
  };
}

function registerRadio(configModule) {
  configModule['RADIO_CONFIG'] = RADIO_CONFIG;
  G6.registerNode(
    'radio',
    {
      options: {
        style: {
          fill: '#00000000',
        },
      },
      draw: function (cfg, group) {
        const self = this,
          { options } = cfg.config.html.options;
        // 获取配置中的 Combo 内边距
        cfg.padding = [0, 0, 0, 0];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg),
          width = computedWidth(options);
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('rect', {
          attrs: {
            ...style,
            x: -width / 2,
            y: -15,
            width: width + 10,
            height: style.height,
            name: 'radio-border',
          },
          draggable: true,
          name: 'radio-border',
        });
      },
      afterDraw(cfg, group) {
        renderRadio(group, cfg.config.html, false);
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
      update(cfg, node) {
        const group = node.get('group');
        renderRadio(group, cfg.config.html, true);
      },
    },
    'rect'
  );
}
export { registerRadio };

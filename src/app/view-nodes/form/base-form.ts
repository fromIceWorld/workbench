import G6 from '../../../../g6.min.js';
import { COMBINATION_CONFIG } from '../container/index.js';
class FormGroup {
  constructor(controls) {
    for (let [key, config] of Object.entries(controls)) {
      this[key] = config;
      config['group'] = this;
    }
  }
  get(key) {
    const { value } = this[key];
    return value;
  }
  subs = [];
  subscribe(fn) {
    this.subs.push(fn);
  }
  change(key, value) {
    this.subs.forEach((fn) => {
      this[key].value = value;
      let valid = new RegExp(this[key].regexp).test(value);
      fn(key, value, valid);
    });
  }
}
class FORM_CONFIG extends COMBINATION_CONFIG {
  className = 'FormComponent';
  html = {
    formgroup: {
      type: 'string',
      value: 'fg',
    },
    api: {
      type: 'string',
      value: '/suger/records',
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
      {
        label: 'submit',
        value: 'submit',
        children: [
          { label: '200', value: '200' },
          { label: '500', value: '500' },
        ],
      },
      {
        label: 'reset',
        value: 'reset',
        children: [],
      },
      {
        label: '200',
        value: '200',
        children: [],
      },
      {
        label: '500',
        value: '500',
        children: [],
      },
    ],
    methods: [
      {
        label: 'submit',
        value: 'submit',
        children: [
          { label: '200', value: 'when200' },
          { label: '500', value: 'when500' },
        ],
      },
      {
        label: 'reset',
        value: 'reset',
        children: [],
      },
    ],
  };
}

function registrForm(configModule) {
  configModule['FORM_CONFIG'] = FORM_CONFIG;
  G6.registerCombo(
    'form',
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
      // 定义新增的右侧圆的位置更新逻辑
      afterUpdate: function afterUpdate(cfg, combo) {
        const group = combo.get('group');
      },
    },
    'rect'
  );
}
export { registrForm };

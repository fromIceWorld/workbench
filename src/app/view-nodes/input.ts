import G6 from '../../../g6.min.js';
import { NODE_CONFIG } from './node/base/index.js';

class INPUT_CONFIG extends NODE_CONFIG {
  className = 'InputComponent';
  html = {
    placeholder: {
      type: 'string',
      value: '请输入姓名',
    },
    formcontrol: {
      type: 'string',
      value: 'name',
    },
    value: {
      type: 'string',
      value: '',
    },
    updateOn: {
      type: 'string',
      options: [
        {
          label: 'change',
          value: 'change',
        },
      ],
      value: 'change',
    },
    regexp: {
      type: 'string',
      value: '/^[1-9]{1,10}$/',
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [
      { label: 'validateTrue', value: 'validateTrue' },
      { label: 'validateFalse', value: 'validateFalse' },
      { label: 'change', value: 'change' },
      { label: 'clear', value: 'clear' },
      { label: 'focus', value: 'focus' },
      { label: 'blur', value: 'blur' },
    ],
    methods: [
      { label: 'validate', value: 'validate' },
      { label: 'change', value: 'change' },
      { label: 'clear', value: 'clear' },
      { label: 'blur', value: 'blur' },
    ],
  };
}
function registerInput(configModule) {
  configModule['INPUT_CONFIG'] = INPUT_CONFIG;
  G6.registerNode(
    'input',
    {
      options: {
        myName: 'Input',
        size: [202, 32],
        style: {
          fill: '#00000000',
        },
      },
      afterDraw(cfg, group) {
        const { config } = cfg,
          { placeholder } = config.html;
        cfg.padding = [0, 0, 0, 0];
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: placeholder.value,
            x: -95,
            y: 1,
            fontSize: 14,
            textAlign: 'left',
            textBaseline: 'middle',
            fill: '#000',
            opacity: 0.85,
          },
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'text-shape',
        });
        group.addShape('rect', {
          attrs: {
            x: -100,
            y: -15,
            width: 200,
            height: 30,
            stroke: '#d9d9d9',
            radius: [2, 2],
          },
          // must be assigned in G6 3.3 and later versions. it can be any value you want
          name: 'rect-shape',
        });
      },
      update(cfg, node) {
        const { html } = cfg.config,
          { placeholder } = html,
          group = node.getContainer();
        let textShape = group.findById('text');
        textShape.attr('text', placeholder.value);
      },
    },
    'rect'
  );
}
export { registerInput };

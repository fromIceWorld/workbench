import G6 from '../../../g6.min.js';
import { NODE_CONFIG } from './node/base/index.js';

class INPUT_CONFIG extends NODE_CONFIG {
  className = 'my-input';
  html = {
    attributes: {
      placeholder: '请输入姓名',
      formcontrol: 'name',
    },
    properties: {
      value: '',
      updateOn: 'change',
      regexp: '^[1-9]{1,10}$',
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [
      { label: 'validate', value: 'validate' },
      { label: 'change', value: 'change' },
      { label: 'clear', value: 'clear' },
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
          { attributes } = config.html,
          { placeholder } = attributes;
        cfg.padding = [0, 0, 0, 0];
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: placeholder,
            x: -95,
            y: 1,
            fontSize: 14,
            textAlign: 'left',
            textBaseline: 'middle',
            fill: '#000000d9',
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
        console.log('input update', cfg);
        const { html } = cfg.config,
          { attributes, properties } = html,
          { placeholder } = attributes,
          group = node.getContainer();
        let textShape = group.findById('text');
        textShape.attr('text', placeholder);
      },
      afterUpdate(cfg, item) {
        // const { config } = cfg,
        //     group = item.getContainer();
        // let text = group.findById('text');
        // text.attr('text', config.placeholder);
      },
    },
    'rect'
  );
}
export { registerInput };

import G6 from '../../../../g6.min.js';
import { COMBINATION_CONFIG } from '../container/index.js';
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
export { registrForm };

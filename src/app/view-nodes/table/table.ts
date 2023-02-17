import G6 from '../../../../g6.min.js';
import { NODE_CONFIG } from './../node/base/index.js';

// 独属于每一个节点的render函数，在G6中会被抹除，通过原型保存
class TABLE_CONFIG extends NODE_CONFIG {
  className = 'TableComponent';
  tag = '';
  html = {
    bordered: {
      type: 'boolean',
      value: false,
    },
    loading: {
      type: 'boolean',
      value: false,
    },
    pagination: {
      type: 'boolean',
      value: true,
    },
    sizeChanger: {
      type: 'boolean',
      value: false,
    },
    title: {
      type: 'boolean',
      value: false,
    },
    header: {
      type: 'boolean',
      value: true,
    },
    footer: {
      type: 'boolean',
      value: false,
    },
    expandable: {
      type: 'boolean',
      value: false,
    },
    checkbox: {
      type: 'boolean',
      value: false,
    },
    fixHeader: {
      type: 'boolean',
      value: false,
    },
    noResult: {
      type: 'boolean',
      value: false,
    },
    ellipsis: {
      type: 'boolean',
      value: false,
    },
    simple: {
      type: 'boolean',
      value: false,
    },
    size: {
      type: 'array',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'middle', label: 'Middle' },
        { value: 'small', label: 'Small' },
      ],
      value: 'default',
    },
    tableScroll: {
      type: 'array',
      options: [
        { value: 'unset', label: 'Unset' },
        { value: 'scroll', label: 'Scroll' },
        { value: 'fixed', label: 'Fixed' },
      ],
      value: 'unset',
    },
    tableLayout: {
      type: 'array',
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'fixed', label: 'Fixed' },
      ],
      value: 'auto',
    },
    position: {
      type: 'array',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'both', label: 'Both' },
      ],
      value: 'top',
    },
    headers: {
      type: 'list',
      options: ['Name:100', 'Age:100', 'Address:200'],
      width: [100, 100, 200],
      value: 'Name',
    },
    row: {
      type: 'number',
      value: 10,
    },
  };
  css = {
    classes: '',
    style: {},
  };
  component = {
    event: [],
    methods: [
      { label: 'setList', value: 'setList' },
      { label: 'setLoading', value: 'setLoading' },
    ],
  };
}
function registerTable(configModule) {
  configModule['TABLE_CONFIG'] = TABLE_CONFIG;
  G6.registerNode(
    'table',
    {
      drawShape: function drawShape(cfg, group) {
        const color = cfg.error ? '#F4664A' : '#30BF78';
        const r = 2;
        const shape = group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 60,
            stroke: color,
            radius: r,
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'main-box',
          draggable: true,
        });

        group.addShape('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: 200,
            height: 20,
            fill: color,
            radius: [r, r, 0, 0],
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'title-box',
          draggable: true,
        });
        // title text
        group.addShape('text', {
          attrs: {
            textBaseline: 'top',
            y: 4,
            x: 10,
            lineHeight: 20,
            text: 'table',
            fill: '#fff',
          },
          // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
          name: 'title',
        });

        return shape;
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
export { registerTable };

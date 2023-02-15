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
      value: false,
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
      value: 1,
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
    },
    'single-node'
  );
}
function renderTable(cfg, group, destroy, combo) {
  if (destroy) {
    let willDel = group.findAll(function (item) {
      return item.attr('name') !== 'combo-keyShape';
    });
    willDel.forEach((item) => group.removeChild(item));
  }
  const { headers, row } = cfg.config.html;

  // 获取配置中的 Combo 内边距
  let width = 0,
    height = (row.value + 1) * 55,
    headerList = headers.options.map((header) => {
      let [title, len] = header.split(':');
      width += Number(len);
      return [title, Number(len)];
    });
  // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
  // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致

  // 添加headers
  let length = headerList.reduce((pre, cur, index) => {
    group.addShape('rect', {
      attrs: {
        x: pre - width / 2,
        y: -height / 2,
        width: cur[1],
        height: 55,
        fill: '#fafafa',
      },
      // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
      name: 'rect-shape',
    });
    //   table header
    group.addShape('text', {
      attrs: {
        text: cur[0],
        x: pre - width / 2 + 5,
        y: -height / 2 + cfg.padding[0] / 2,
        fontSize: 14,
        textAlign: 'left',
        textBaseline: 'middle',
        fontWeight: 600,
        fill: '#000000d9',
      },
    });
    // 分隔符
    if (index > 0) {
      group.addShape('path', {
        attrs: {
          path: [
            ['M', -width / 2 + pre - 5, -height / 2 + -10 + cfg.padding[0] / 2],
            ['L', -width / 2 + pre - 5, -height / 2 + 10 + cfg.padding[0] / 2],
          ],
          stroke: 'black',
          lineWidth: 0.2,
        },
        // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        name: 'path-shape',
      });
    }
    return pre + cur[1];
  }, 0);
  // header-bottom
  group.addShape('path', {
    attrs: {
      path: [
        ['M', -width / 2, -height / 2 + cfg.padding[0]],
        ['L', -width / 2 + length, -height / 2 + cfg.padding[0]],
      ],
      stroke: 'black',
      lineWidth: 0.15,
    },
    // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
    name: 'path-shape',
  });
  // 添加body
  for (let i = 0; i < row.value; i++) {
    headerList.reduce((pre, cur) => {
      group.addShape('text', {
        attrs: {
          text:
            i === Math.floor(row.value / 2) - 1 ||
            i === Math.ceil(row.value / 2) - 1
              ? ''
              : '-',
          x: 10 + pre - width / 2,
          y: -height / 2 + (i + 1) * 55 + cfg.padding[0] / 2,
          fontSize: 14,
          textAlign: 'left',
          textBaseline: 'middle',
          fill: '#000000d9',
        },
      });
      // 分割线
      group.addShape('path', {
        attrs: {
          path: [
            ['M', -width / 2, -height / 2 + 55 * (i + 1), 0],
            ['L', -width / 2 + length, -height / 2 + 55 * (i + 1)],
          ],
          stroke: 'black',
          lineWidth: 0.05,
        },
        // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
        name: 'path-shape',
      });
      return pre + cur[1];
    }, 0);
    // headerList.forEach((item, index) => {
    //   group.addShape('text', {
    //     attrs: {
    //       text: i === 0 ? '' : '-',
    //       x: 10 + index * 100 - width / 2,
    //       y: i * 55,
    //       fontSize: 14,
    //       textAlign: 'left',
    //       textBaseline: 'middle',
    //       fill: '#000000d9',
    //     },
    //   });
    //   // 分割线
    //   group.addShape('path', {
    //     attrs: {
    //       path: [
    //         ['M', -width / 2, 60 * (i + 1) - cfg.padding[0] / 2],
    //         ['L', -width / 2 + length, 60 * (i + 1) - cfg.padding[0] / 2],
    //       ],
    //       stroke: 'black',
    //       lineWidth: 0.05,
    //     },
    //     // 在 G6 3.3 及之后的版本中，必须指定 name，可以是任意字符串，但需要在同一个自定义元素类型中保持唯一性
    //     name: 'path-shape',
    //   });
    // });
  }

  // 更新框架
  const box = group.find(function (item) {
    return item.attr('name') === 'combo-keyShape';
  });
  // let shapeCfg = combo.getShapeCfg();
  window['combo'] = combo;
  if (combo) {
  }
  // box.attr({
  //   width,
  //   height: height,
  // });
}
export { registerTable };

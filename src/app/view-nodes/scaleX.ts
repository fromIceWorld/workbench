import G6 from '../../../g6.min.js';

function registerScaleX() {
  G6.registerNode(
    'scaleX',
    {
      options: {
        myName: 'text',
        size: [200, 15],
        style: {
          fill: 'black',
        },
      },
      draw(cfg, group) {
        group.addShape('rect', {
          attrs: {
            width: 1942,
            fill: 'black',
            height: 22,
          },
          draggable: true,
          name: 'text-border',
        });
        for (let i = 0; i < 1942; i++) {
          if (i % 10 === 0) {
            group.addShape('text', {
              attrs: {
                text: '|',
                x: i + 21,
                y: 17,
                fontSize: 10,
                textAlign: 'left',
                textBaseline: 'middle',
                fill: '#8f9cb8',
              },
              // must be assigned in G6 3.3 and later versions. it can be any value you want
              name: 'scale-shape',
            });
          }

          if (i % 100 === 0) {
            group.addShape('text', {
              attrs: {
                text: i % 20 === 0 ? '|' : '',
                x: i + 21,
                y: 7,
                fontSize: 10,
                textAlign: 'left',
                textBaseline: 'middle',
                fill: '#8f9cb8',
              },
              // must be assigned in G6 3.3 and later versions. it can be any value you want
              name: 'scale-shape',
            });
            group.addShape('text', {
              attrs: {
                text: i,
                x: i + 26,
                y: 8,
                fontSize: 10,
                textAlign: 'left',
                textBaseline: 'middle',
                fill: 'white',
              },
              // must be assigned in G6 3.3 and later versions. it can be any value you want
              name: 'scale-num',
            });
          }
        }

        return group;
      },
      setState() {},
    },
    'rect'
  );
}
export { registerScaleX };

import G6 from '../../../g6.min.js';
import { measureText } from './node/base/index.js';

// G6.Util.processParallelEdges processes the edges with same source node and target node,
// on this basis, processParallelEdgesOnAnchorPoint consider the end nodes and anchor points in the same time.
const processParallelEdgesOnAnchorPoint = (
  edges,
  offsetDiff = 15,
  multiEdgeType = 'quadratic',
  singleEdgeType = undefined,
  loopEdgeType = undefined
) => {
  const len = edges.length;
  const cod = offsetDiff * 2;
  const loopPosition = [
    'top',
    'top-right',
    'right',
    'bottom-right',
    'bottom',
    'bottom-left',
    'left',
    'top-left',
  ];
  const edgeMap = {};
  const tags = [];
  const reverses = {};
  for (let i = 0; i < len; i++) {
    const edge = edges[i];
    const { source, target, sourceAnchor, targetAnchor } = edge;
    const sourceTarget = `${source}|${sourceAnchor}-${target}|${targetAnchor}`;

    if (tags[i]) continue;
    if (!edgeMap[sourceTarget]) {
      edgeMap[sourceTarget] = [];
    }
    tags[i] = true;
    edgeMap[sourceTarget].push(edge);
    for (let j = 0; j < len; j++) {
      if (i === j) continue;
      const sedge = edges[j];
      const {
        source: src,
        target: dst,
        sourceAnchor: srcAnchor,
        targetAnchor: dstAnchor,
      } = sedge;

      // 两个节点之间共同的边
      // 第一条的source = 第二条的target
      // 第一条的target = 第二条的source
      if (!tags[j]) {
        if (
          source === dst &&
          sourceAnchor === dstAnchor &&
          target === src &&
          targetAnchor === srcAnchor
        ) {
          edgeMap[sourceTarget].push(sedge);
          tags[j] = true;
          reverses[
            `${src}|${srcAnchor}|${dst}|${dstAnchor}|${
              edgeMap[sourceTarget].length - 1
            }`
          ] = true;
        } else if (
          source === src &&
          sourceAnchor === srcAnchor &&
          target === dst &&
          targetAnchor === dstAnchor
        ) {
          edgeMap[sourceTarget].push(sedge);
          tags[j] = true;
        }
      }
    }
  }

  for (const key in edgeMap) {
    const arcEdges = edgeMap[key];
    const { length } = arcEdges;
    for (let k = 0; k < length; k++) {
      const current = arcEdges[k];
      if (current.source === current.target) {
        if (loopEdgeType) current.type = loopEdgeType;
        // 超过8条自环边，则需要重新处理
        current.loopCfg = {
          position: loopPosition[k % 8],
          dist: Math.floor(k / 8) * 20 + 50,
        };
        continue;
      }
      if (
        length === 1 &&
        singleEdgeType &&
        (current.source !== current.target ||
          current.sourceAnchor !== current.targetAnchor)
      ) {
        current.type = singleEdgeType;
        continue;
      }
      current.type = multiEdgeType;
      const sign =
        (k % 2 === 0 ? 1 : -1) *
        (reverses[
          `${current.source}|${current.sourceAnchor}|${current.target}|${current.targetAnchor}|${k}`
        ]
          ? -1
          : 1);
      if (length % 2 === 1) {
        current.curveOffset = sign * Math.ceil(k / 2) * cod;
      } else {
        current.curveOffset = sign * (Math.floor(k / 2) * cod + offsetDiff);
      }
    }
  }
  return edges;
};

// custom a node with anchor-point shapes

function registerDefault() {
  G6.registerNode(
    'rect-node',
    {
      options: {
        myName: 'text',
        size: [200, 30],
        style: {
          fill: '#1085cac9',
          radius: [3, 3],
        },
      },
      draw(cfg, group) {
        const self = this,
          name = cfg.label;
        // 获取配置中的 Combo 内边距
        cfg.padding = [5, 5, 5, 5];
        // 获取样式配置，style.width 与 style.height 对应 rect Combo 位置说明图中的 width 与 height
        const style = self.getShapeStyle(cfg),
          width = measureText(name, '14px');
        // 绘制一个矩形作为 keyShape，与 'rect' Combo 的 keyShape 一致
        return group.addShape('rect', {
          attrs: {
            ...style,
            width: width + 30,
            x: -(width + 30) / 2,
            height: style.height,
          },
          draggable: true,
          name: 'text-border',
        });
      },
      afterDraw(cfg, group) {
        const name = cfg.label,
          width = measureText(name, '14px');
        group.addShape('text', {
          id: 'text',
          attrs: {
            text: name,
            x: -(width + 30) / 2 + 15,
            y: 2,
            fontSize: 14,
            textAlign: 'start',
            textBaseline: 'middle',
            fill: '#ffffff',
          },
          name: 'text-shape',
        });

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
        const name = cfg.label,
          textLength = measureText(name, '14px'),
          group = node.getContainer();
        let textShape, box;
        group.find((item) => {
          if (item.get('name') === 'text-shape') {
            textShape = item;
          }
          if (item.get('name') === 'text-border') {
            box = item;
          }
        });
        textShape.attr('text', name);
        box.attr({
          width: textLength + 30,
        });
      },
    },
    'rect'
  );
}
export { registerDefault };

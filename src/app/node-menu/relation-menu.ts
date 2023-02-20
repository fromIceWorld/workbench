import G6 from '../../../g6.min.js';
let graph;
const ralationMenu = new G6.Menu({
  offsetX: 6,
  offsetY: 10,
  itemTypes: ['node'],
  getContent(e) {
    console.log(e);
    graph = e.currentTarget;
    const outDiv = document.createElement('div');
    outDiv.style.width = '100px';
    outDiv.innerHTML = `<ul>
          <ol>复制</ol>
        </ul>`;
    return outDiv;
  },
  handleMenuClick(target, item) {
    const { id, x, y } = item.getModel(),
      [pre, UUID, index] = id.split('-');
    console.log(target, item, item.getModel());
    graph.addItem('node', {
      ...item.getModel(),
      x: x + 20,
      y: y + 20,
      id: `${pre}-${UUID}-${Math.random()}`,
    });
  },
});

export { ralationMenu };

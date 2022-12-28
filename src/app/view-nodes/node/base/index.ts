let configModule = {};
class NODE_CONFIG {}
function measureText(
  text,
  fontSize = getFontSize(),
  fontFamily = getFontFamily()
) {
  let canvas = document.createElement('canvas'),
    context = canvas.getContext('2d');
  context.font = fontSize + ' ' + fontFamily;
  let result = context.measureText(text);
  return result.width;
}
function getFontFamily() {
  return getComputedStyle(document.body).getPropertyValue('font-family');
}
function getFontSize() {
  return getComputedStyle(document.body).getPropertyValue('font-size');
}

export { configModule, NODE_CONFIG, measureText };

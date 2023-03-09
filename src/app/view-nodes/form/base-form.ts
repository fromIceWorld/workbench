import G6 from '../../../../g6.min.js';

function registrForm() {
  G6.registerCombo(
    'form',
    {
      afterDraw(cfg, group) {},

      // response the state changes and show/hide the link-point circles
    },
    'rect'
  );
}
export { registrForm };

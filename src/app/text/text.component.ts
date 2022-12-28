import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { transformValue } from 'src/common';
@Component({
  selector: 'app-text',
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.css'],
})
export class TextComponent implements OnInit {
  static index = 0;
  static tagNamePrefix: string = 'my-text';
  text: string = '';
  // 导出渲染数据
  /**
   *
   * @param option 参数配置
   * @returns {
   *      html, js
   * }
   */
  static extends(option): { html: string; js: string } {
    const index = TextComponent.index++,
      tagName = `${TextComponent.tagNamePrefix}-${index}`;
    const { html: config, css, className } = option;
    const init = Object.keys(config)
      .map((key) => {
        return `this.${key} = ${transformValue(config[key])}`;
      })
      .join('\n');
    return {
      html: `<${tagName}></${tagName}>`,
      js: `class MyText${index} extends ${className}{
              constructor(){
                  super();
                  ${init}
              }
          }
          MyText${index}.ɵcmp.factory = () => { console.log(${index}); return new MyText${index}()};
          customElements.define('${tagName}',createCustomElement(MyText${index}, {  injector: injector,}));
          document.body.append(document.createElement('${tagName}'))
          `,
    };
  }
  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit(): void {}
}

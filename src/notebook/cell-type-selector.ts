import { MarkdownCellElement } from "./markdown-cell";
import { JavascriptCellElement } from "./javascript-cell";
import { TypescriptCellElement } from "./typescript-cell";

export class CellTypeSelector extends HTMLElement {
  static template = `
<style>
:root {
  
}

:host {
  display: flex;
  flex-direction: row;
  gap: 15px;
  justify-content: flex-end;
  outline: none;
  border: none;
  --font-size: 20px;
}

label {
  font-size: var(--font-size);
}

@media not screen {
  div {
    display: none;
  }
  
  /*
  input {
    display: none;
  }

  div:has(input[type=radio]:checked) {
    display: inline-block;
  }
  */
}
</style>

<div>
  <input class="cell-type markdown" type="radio" name="cell-type" value="markdown">
  <label class="label markdown">Markdown</label>
</div>
<div>
  <input class="cell-type typescript" type="radio" name="cell-type" value="typescript">
  <label class="label typescript">TypeScript</label>
</div>
<div>
  <input class="cell-type javascript" type="radio" name="cell-type" value="javascript">
  <label class="label javascript">JavaScript</label>
</div>
  `;

  static observedAttributes: string[] = ["data-selected"];

  //#region public properties
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;

  get selected(): string {
    const option = this.qs('.cell-type[checked]') as HTMLInputElement;
    return option.value;
  }

  set selected(selection: string){
    if(selection !== this.dataset.selected){
      this.qs(`.cell-type[checked]`).removeAttribute('checked');
      this.qs(`.cell-type.${selection}`).setAttribute('checked', 'true');
    }
  }
  //#endregion

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot!.innerHTML = CellTypeSelector.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelectorAll.bind(this.shadowRoot);
    this.setupSelectors();
  }

  //#region public methods
  attributeChangedCallback(name: string, old: string, value: string): void {
    switch(name){
      case "data-selected":
        this.selected = value;
        break;
    }
  }
  //#endregion

  //#region private methods
  private setupSelectors(): void {
    const md = this.qs('.cell-type.markdown');
    const js = this.qs('.cell-type.javascript');
    const ts = this.qs('.cell-type.typescript');

    md.addEventListener('click', this.onMarkdownClick.bind(this));
    js.addEventListener('click', this.onJavascriptClick.bind(this));
    ts.addEventListener('click', this.onTypescriptClick.bind(this));

    this.qs('.label.markdown').addEventListener('click', this.onMarkdownClick.bind(this));
    this.qs('.label.javascript').addEventListener('click', this.onJavascriptClick.bind(this));
    this.qs('.label.typescript').addEventListener('click', this.onTypescriptClick.bind(this));

    switch(this.dataset.selected){
      case 'markdown':
        md.setAttribute('checked', 'checked');
        break;
      case 'javascript':
        js.setAttribute('checked', 'checked');
        break;
      case 'typescript':
        ts.setAttribute('checked', 'checked');
        break;
    }
  }

  private getOld(): MarkdownCellElement | JavascriptCellElement | TypescriptCellElement{
    const md = (this.getRootNode() as any).host.closest('markdown-cell') as MarkdownCellElement;
    const js = (this.getRootNode() as any).host.closest('javascript-cell') as JavascriptCellElement;
    const ts = (this.getRootNode() as any).host.closest('typescript-cell') as TypescriptCellElement;
    const old = md ?? js ?? ts;
    return old;
  }

  private onMarkdownClick(): void {
    const cell = new MarkdownCellElement();
    const old = this.getOld();
    const text = old.source;
    old.replaceWith(cell);
    cell.source = text;
    cell.view.focus();
  }

  private onJavascriptClick(): void {
    const cell = new JavascriptCellElement();
    const old = this.getOld();
    const text = old.source;
    old.replaceWith(cell);
    cell.source = text;
    cell.view.focus();
  }

  private onTypescriptClick(): void {
    const cell = new TypescriptCellElement();
    const old = this.getOld();
    const text = old.source;
    old.replaceWith(cell);
    cell.source = text;
    cell.view.focus();
  }
  //#endregion
}
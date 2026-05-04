import { MarkdownCellElement } from "../markdown-cell/markdown-cell";
import { JavascriptCellElement } from "../javascript-cell/javascript-cell";
import { TypescriptCellElement } from "../typescript-cell/typescript-cell";

export class CellTypeSelector extends HTMLElement {
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
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelectorAll.bind(this.shadowRoot);

    this.setupUI();
  }

  async setupUI(){
    await this.fetchStyle();
    await this.fetchTemplate();
    this.setupSelectors();
  }

  async fetchStyle(): Promise<void> {
    const sheet = new CSSStyleSheet();
    const file = await fetch(new URL(`./cell-type-selector.css`, import.meta.url));
    const css = await file.text();
    sheet.replaceSync(css);
    this.shadowRoot!.adoptedStyleSheets = [sheet];
  }

  async fetchTemplate(): Promise<void> {
    const file = await fetch(new URL(`./cell-type-selector.html`, import.meta.url));
    const html = await file.text();
    this.shadowRoot!.innerHTML = html;
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
    cell.ready.then(() => {
      const old = this.getOld();
      const text = old.source;
      old.replaceWith(cell);
      cell.source = text;
      cell.view.focus();
    });
  }

  private onJavascriptClick(): void {
    const cell = new JavascriptCellElement();
    cell.ready.then(() => {
      const old = this.getOld();
      const text = old.source;
      old.replaceWith(cell);
      cell.source = text;
      cell.view.focus();
    });
  }

  private onTypescriptClick(): void {
    const cell = new TypescriptCellElement();
    cell.ready.then(() => {
      const old = this.getOld();
      const text = old.source;
      old.replaceWith(cell);
      cell.source = text;
      cell.view.focus();
    });
  }
  //#endregion
}
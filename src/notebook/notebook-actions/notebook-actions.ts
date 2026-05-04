import { JavascriptCellElement } from "../javascript-cell/javascript-cell";
import { MarkdownCellElement } from "../markdown-cell/markdown-cell";
import { NotebookElement } from "../notebook";
import { TypescriptCellElement } from "../typescript-cell/typescript-cell";

export class NotebookActionsElement extends HTMLElement {

  //#region public properties
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;
  //#endregion

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.setupUI();
  }

  async setupUI(){
    await this.fetchStyle();
    await this.fetchTemplate();
    this.setupNotebookActions();
  }

  async fetchStyle(): Promise<void> {
    const sheet = new CSSStyleSheet();
    const file = await fetch(new URL(`./notebook-actions.css`, import.meta.url));
    const css = await file.text();
    sheet.replaceSync(css);
    this.shadowRoot!.adoptedStyleSheets = [sheet];
  }

  async fetchTemplate(): Promise<void> {
    const file = await fetch(new URL(`./notebook-actions.html`, import.meta.url));
    const html = await file.text();
    this.shadowRoot!.innerHTML = html;
  }

  //#region private methods
  private setupNotebookActions(): void {
    this.qs('.add-cell').addEventListener('click', () => this.onAddCellClick());
    this.qs('.run-cells').addEventListener('click', () => this.onRunCellsClick());
    this.qs('.reset-cells').addEventListener('click', () => this.onResetCellsClick());
  }

  private getParent(): MarkdownCellElement | JavascriptCellElement | TypescriptCellElement {
    return this.getRootNode().host;
  }

  private onAddCellClick(): void {
    const cell = new MarkdownCellElement();
    this.getParent().qs('.cells').appendChild(cell);
    cell.ready.then(() => cell.view.focus());
  }

  private onRunCellsClick(): void {
    this.getParent().qsa('.cells>*').forEach(async cell => {
      if(cell instanceof JavascriptCellElement || cell instanceof TypescriptCellElement){
        await cell.run();
      }
    })
  }

  private onResetCellsClick(): void {
    this.getParent().qsa('.cells>*').forEach(cell => {
      if(cell instanceof JavascriptCellElement || cell instanceof TypescriptCellElement){
        cell.resetOutput();
      }
    })
  }
  //#endregion
}
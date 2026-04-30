import { JavascriptCellElement } from "./javascript-cell";
import { MarkdownCellElement } from "./markdown-cell";
import { TypescriptCellElement } from "./typescript-cell";

type Runnable = JavascriptCellElement | TypescriptCellElement;

export class CellActionsElement extends HTMLElement {
  static template: string = `
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

button {
  margin: 0;
  border: 0;
  padding: 0;

  color: var(--ui-color);
  background-color: var(--bg-color);
  font-size: var(--font-size);
}
</style>


<div>
  <button class="run-cell">Run</button>
</div>
<div>
  <button class="reset-cell">Reset</button>
</div>
<div>
  <button class="delete-cell">Delete</button>
</div>
<div>
  <button class="prepend-cell">Add Above</button>
</div>
<div>
  <button class="append-cell">Add Below</button>
</div>

  `;

  //#region public properties
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;
  //#endregion

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot!.innerHTML = CellActionsElement.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.setupCellActions(); 
  }

  //#region private methods
  private setupCellActions(): void {
    this.qs('.delete-cell')!.addEventListener('click', () => this.onDeleteCellClick());
    this.qs('.prepend-cell')!.addEventListener('click', () => this.onPrependCellClick());
    this.qs('.append-cell')!.addEventListener('click', () => this.onAppendCellClick());
    const cell = this.getParent();
    if(cell instanceof JavascriptCellElement || cell instanceof TypescriptCellElement){
      this.qs('.run-cell').addEventListener('click', () => this.onRunClick());
      this.qs('.reset-cell').addEventListener('click', () => this.onResetCellClick());
    }else{
      this.qs('.run-cell').parentElement?.remove();
      this.qs('.reset-cell').parentElement?.remove();
    }

  }

  private getParent(): MarkdownCellElement | JavascriptCellElement | TypescriptCellElement {
    const md = (this.getRootNode() as any).host.closest('markdown-cell');
    const ts = (this.getRootNode() as any).host.closest('typescript-cell');
    const js = (this.getRootNode() as any).host.closest('javascript-cell');
    return md ?? ts ?? js;
  }

  private onDeleteCellClick(): void {
    this.getParent().remove();
  }

  private onResetCellClick(): void {
    (this.getParent() as Runnable).resetOutput();
  }

  private onPrependCellClick(): void {
    const cell = new MarkdownCellElement();
    this.getParent().before(cell);
    cell.view.focus();
  }

  private onAppendCellClick(): void {
    const cell = new MarkdownCellElement();
    this.getParent().after(cell);
    cell.view.focus();
  }

  private onRunClick(): void {
    (this.getParent() as Runnable)?.run();
  }
  //#endregion
}
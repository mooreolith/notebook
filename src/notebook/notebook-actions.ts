import { JavascriptCellElement } from "./javascript-cell";
import { MarkdownCellElement } from "./markdown-cell";
import { NotebookElement } from "./notebook";
import { TypescriptCellElement } from "./typescript-cell";

export class NotebookActionsElement extends HTMLElement {
  static template: string = `
<style>
:root {
}

:host {
  display: flex;
  flex-direction: row;
  gap: 15px;
  justify-content: flex-start;
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

@media not screen {
  :host {
    display: none;
  }
}
</style>

<div>
  <button class="add-cell">Add Cell</button>
</div>
<div>
  <button class="run-cells">Run All</button>
</div>
<div>
  <button class="reset-cells">Reset Cells</button>
</div>

  `;

  //#region public properties
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;
  //#endregion

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot!.innerHTML = NotebookActionsElement.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelector.bind(this.shadowRoot); 
    this.setupNotebookActions();
  }

  //#region private methods
  private setupNotebookActions(): void {
    this.qs('.add-cell').addEventListener('click', () => this.onAddCellClick());
    this.qs('.run-cells').addEventListener('click', () => this.onRunCellsClick());
    this.qs('.reset-cells').addEventListener('click', () => this.onResetCellsClick());
  }

  private getParent(): MarkdownCellElement | JavascriptCellElement | TypescriptCellElement {
    return this.getRootNode().host.closest('notebook-el');
  }

  private onAddCellClick(): void {
    const cell = new MarkdownCellElement();
    this.getParent().qs('.cells').appendChild(cell);
    cell.view.focus();
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
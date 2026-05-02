import { JavascriptCellElement } from "./javascript-cell";
import { MarkdownCellElement } from "./markdown-cell";
import { TypescriptCellElement } from "./typescript-cell";

export class NotebookElement extends HTMLElement {
  static template: string = `
<style class="notebook-styles">
:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

:host {
}

@media screen and (min-width: 800px){
  :host {  
    --font-size: 20px;

    margin: 50px transparent;
    
    max-width: 80ch;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;

    --spiral-width: 75px;
    background: url('spiral-small.png') left top repeat-y;
    background-size: var(--spiral-width);
    padding-left: calc(var(--spiral-width) + 15px);
    padding-right: 25px;
    padding-bottom: 25px;
    border: 1px solid black;
    border-left: none;
  }
}

h1 {
  border: none;
  border-bottom: 1px solid black;
  font-family: serif;
}

h1:focus {
  outline: none;
}

.notebook-actions {
  display: flex;
  flex-direction: row;
  gap: 15px;
}

button {
  margin: 0;
  border: 0;
  padding: 0;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 20px;

  color: var(--ui-color);
  background-color: var(--bg-color);
  font-size: var(--font-size);
}

.cover {
  width: 28px;
  height: 0px;
  border: 1px solid white;
  position: relative;
  left: -92px;
}

.cover.top {
  top: -1px;
}

.cover.bottom {
  bottom: -26px;
}

notebook-actions:first-of-type {
  margin-bottom: 15px;
}

notebook-actions:last-of-type {
  margin-top: 15px;
}
</style>

<article class="notebook">
  <div class="cover top"></div>

  <h1 contenteditable>Notebook Title</h1>
  <notebook-actions></notebook-actions>

  <div class="cells">
    <markdown-cell></markdown-cell>
  </div>

  <notebook-actions></notebook-actions>

  <div class="cover bottom"></div>
</div>
  `;

  //#region public properties
  qs: (query: string) => HTMLElement;
  qsa: (query: string) => NodeList;
  context: object = {};

  get title(): string {
    return this.qs('h1')!.innerText;
  }

  set title(val: string){
    this.qs('h1')!.innerText = val;
  }
  //#endregion

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot!.innerHTML = NotebookElement.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelectorAll.bind(this.shadowRoot);
  }

  //#region public methods
  toJSON(): any {
    type CellType = MarkdownCellElement | JavascriptCellElement | TypescriptCellElement;

    const cells: CellType[] = [];
    this.qsa('.cells>*').forEach(cell => {
      cells.push((cell as CellType).toJSON());
    })

    return {
      "metadata": {
        "kernelspec": {
          "display_name": "JavaScript",
          "language": "javascript",
          "name": "javascript"
        },
        "language_info": {
          "codemirror_mode": {
            "name": "javascript",
            "version": 6
          },
          "file_extension": ".js",
          "mimetype": "text/javascript",
          "name": "javascript",
          "nbconvert_exporter": "javascript"
        },
        "title": this.title
      },
      "nbformat": 4,
      "nbformat_minor": 2,
      "cells": cells
    }
  }

  static fromJSON(obj: any): NotebookElement {
    const notebook = new NotebookElement();
    notebook.qs('.cells').innerHTML = '';
    notebook.fromJSON(obj);
    return notebook;
  }

  fromJSON(obj: any, clearFirst: boolean=false): void {
    if(clearFirst){
      this.qs('.cells').innerHTML = '';
    }

    this.title = obj.metadata.title;
    obj.cells.forEach((spec: any) => {
      console.log(spec)
      let cell;
      if(spec.cell_type === 'markdown') 
        cell = MarkdownCellElement.fromJSON(spec);
      if(spec.metadata.language === 'javascript')
        cell = JavascriptCellElement.fromJSON(spec);
      if(spec.metadata.language === 'typescript')
        cell = TypescriptCellElement.fromJSON(spec);

      this.qs('.cells').appendChild(cell as HTMLElement);
    })
  }

  toString(): string {
    return JSON.stringify(this.toJSON())
  }

  static fromString(str: string): NotebookElement {
    const obj = JSON.parse(str);
    return NotebookElement.fromJSON(obj);
  }

  fromString(str: string, clearFirst: boolean=false): void {
    const obj = JSON.parse(str);
    this.fromJSON(obj, clearFirst);
  }
  //#endregion
}
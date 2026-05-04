import { JavascriptCellElement } from "./javascript-cell/javascript-cell";
import { MarkdownCellElement } from "./markdown-cell/markdown-cell";
import { TypescriptCellElement } from "./typescript-cell/typescript-cell";

export class NotebookElement extends HTMLElement {
  static template: string = `

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
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelectorAll.bind(this.shadowRoot);
    this.fetchStyle();
    this.fetchTemplate();
  }

  async fetchStyle(): Promise<void> {
    const sheet = new CSSStyleSheet();
    const file = await fetch(new URL(`./notebook.css`, import.meta.url));
    const css = await file.text();
    sheet.replaceSync(css);
    this.shadowRoot!.adoptedStyleSheets = [sheet];
  }

  async fetchTemplate(): Promise<void> {
    const file = await fetch(new URL(`./notebook.html`, import.meta.url));
    const html = await file.text();
    this.shadowRoot!.innerHTML = html;
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
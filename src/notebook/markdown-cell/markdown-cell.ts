import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { indentWithTab } from "@codemirror/commands";

let tabSize = new Compartment();

import {
  mathPlugin,
  blockMathField,
  tableField,
  tableEditorPlugin,
  codeBlockField,
  imageField,
  linkPlugin,
  livePreviewPlugin,
  markdownStylePlugin,
  editorTheme,
  mouseSelectingField,
  collapseOnSelectionFacet,
  setMouseSelecting,
} from 'codemirror-live-markdown'

export class MarkdownCellElement extends HTMLElement {
  //#region public properties
  view!: EditorView;
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;
  ready: Promise<boolean>;
  
  set source(val: string){
    this.view?.dispatch({
      changes: { 
        from: 0, 
        to: this.view.state.doc.length, 
        insert: val 
      }
    });
  }

  get source(): string {
    return this.view.state.doc.toString();
  }
  //#endregion

  constructor(){
    // Call parent constructor
    super();
    
    // attach shadowRoot
    this.attachShadow({mode: "open"});
    
    // setup querySelector and querySelectorAll shorthands
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelector.bind(this.shadowRoot);

    this.ready = new Promise(async (resolve, reject) => {
      await this.setupUI();
      resolve(true);
    })
  }

  async setupUI(){
    await this.fetchStyle();
    await this.fetchTemplate();
    this.setupCodeMirror();
  }

  async fetchStyle(): Promise<void> {
    const sheet = new CSSStyleSheet();
    const file = await fetch(new URL(`./markdown-cell.css`, import.meta.url));
    const css = await file.text();
    sheet.replaceSync(css);
    this.shadowRoot!.adoptedStyleSheets = [sheet];
  }

  async fetchTemplate(): Promise<void> {
    const file = await fetch(new URL(`./markdown-cell.html`, import.meta.url));
    const html = await file.text();
    this.shadowRoot!.innerHTML = html;
  }


  //#region public methods
  toJSON(): any {
    return {
      "cell_type": "markdown",
      "metadata": {},
      "source": this.source
    };
  }

  static fromJSON(obj: any): MarkdownCellElement {
    const cell = new MarkdownCellElement();
    cell.fromJSON(obj)
    return cell;
  }

  fromJSON(obj: {source: string | string[]}): void {
    if(typeof obj.source === 'string'){
      this.source = obj.source;
    }
    if(Array.isArray(obj.source)){
      this.source = obj.source.join('')
    }
  }

  static fromString(str: string): MarkdownCellElement {
    const obj = JSON.parse(str);
    const cell = MarkdownCellElement.fromJSON(obj);
    return cell;
  }

  fromString(str: string): void {
    const obj = JSON.parse(str);
    this.fromJSON(obj);
  }

  disconnectedCallback(): void { 
    this.view.destroy();
  }
  //#endregion

  //#region private methods
  private setupCodeMirror(): void {
    const clickableLinks = EditorView.domEventHandlers({
      mousedown(event, view){
        if(!(event.ctrlKey || event.metaKey)) return;

        let pos = view.posAtCoords({x: event.clientX, y: event.clientY});
        if(pos === null) return;

        let node = syntaxTree(view.state).resolveInner(pos, 1);
        if(node.name === "URL" || node.name === "Link"){
          let url = view.state.doc.sliceString(node.from, node.to);
          window.open(url, '_blank');
          return true;
        }
      }
    })
    
    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          mathPlugin,
          blockMathField,
          tableField,
          tableEditorPlugin(),
          codeBlockField({
            copyButton: true,
            lineNumbers: true,
            defaultLanguage: 'text'
          }),
          imageField(),
          linkPlugin(),
          markdown(),
          collapseOnSelectionFacet.of(true),
          mouseSelectingField,
          livePreviewPlugin,
          markdownStylePlugin,
          editorTheme,
          EditorView.theme({
            "&.cm-focused": { outline: 'none' }
          }),
          EditorView.lineWrapping,
          keymap.of([ indentWithTab ]),
          tabSize.of( EditorState.tabSize.of(2) ),
          placeholder("Write here..."),
          clickableLinks
        ]
      }),
      parent: this.qs('.cell-editor')!
    });

    this.view.contentDOM.addEventListener('mouseDown', (e) => {
      this.view.dispatch({ effects: setMouseSelecting.of(true) });
    });

    document.addEventListener('mouseup', () => {
      requestAnimationFrame(() => {
        this.view.dispatch({ effects: setMouseSelecting.of(false) });
      });
    });
  }
  //#endregion
}
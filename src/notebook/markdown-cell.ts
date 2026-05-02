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
  static template: string = `
<style class="cell-styles">
:root { 
}

:host {
  --font-size: 20px;
  --cell-border: 1px solid black;
  --ui-color: 0x000000;
  --bg-color: 0xffffff;
}

section.cell.markdown-cell {
  display: flex;
  flex-direction: column;
  position: relative;
}

fieldset {
  border: none;
}

fieldset.cell-actions {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  font-size: var(--font-size);
}

.cell-actions button {
  margin: 0;
  border: 0;
  padding: 0;

  color: var(--ui-color);
  background-color: var(--bg-color);
  font-size: var(--font-size);
}

fieldset {
  padding: 0;
  border: 0;
  margin: 0;
}

cell-type { 
  margin-top: 0;
  padding-top: 0;
}

.cell-editor {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.cm-codeblock, .cm-codeblock-source {
  font-family: monospace;
}

.cm-line {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 20px;
}

hr {
  border: none;
  height: 1px;
  background-image: linear-gradient(to right, transparent, #000, transparent);
}
</style>

<section class="cell markdown-cell">
  <!-- Cell Types -->
  <cell-type class="cell-types" data-selected="markdown"></cell-type>

  <!-- Cell Editor --> 
  <fieldset class="cell-editor">
  </fieldset>
  
  <!-- Output -->
  <output class="cell-output"></output>

  <!-- Cell Actions -->
  <cell-actions></cell-actionss>
</section>
<hr>
  `;

  //#region public properties
  view!: EditorView;
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;
  
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

    // setup ui elements
    this.shadowRoot!.innerHTML = MarkdownCellElement.template;
    this.setupCodeMirror();
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
import { basicSetup, EditorView } from "codemirror";
import { EditorState, Compartment } from "@codemirror/state";
import { keymap, placeholder } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { indentWithTab } from "@codemirror/commands";
import { NotebookElement } from "./notebook";
import * as ts from "typescript"

let language = new Compartment();
let tabSize = new Compartment();

export class TypescriptCellElement extends HTMLElement {
  static template: string = `
<style>
fieldset.cell-editor {
  outline: none;
  border: none;
}

.cell-outputs {
  display: block;
  width: content;
  height: content;
  overflow-wrap: anywhere;
}

.error {
  color: red;
}

fieldset.cell-outputs {
  outline: none;
  border: none;
}

hr {
  border: none;
  height: 1px;
  background-image: linear-gradient(to right, transparent, #000, transparent);
}
</style>
<section class="cell typescript-cell">
  <!-- Cell Types -->
  <cell-type class="cell-types" data-selected="typescript"></cell-type>

  <!-- Cell Editor -->
  <fieldset class="cell-editor">
  </fieldset>

  <!-- Output -->
  <fieldset class="cell-outputs">
    <output class="cell-output indicator"></output>
    <output class="cell-output messages"></output>
    <output class="cell-output result"></output>
  </fieldset>

  <!-- Cell Actions -->
  <cell-actions></cell-actions>
</section>
<hr>`;

  //#region properties
  view!: EditorView;
  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => HTMLElement[];

  #execution_count?: number = 0;
  #result: any[] | null = null;
  //#endregion

  constructor(){
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML = TypescriptCellElement.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.setupCodeMirror();
  }

  //#region public properties
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

  public set result(result: any){
    const output = this.qs('.cell-output.result') as HTMLOutputElement;
    this.#result = result;

    if(result instanceof HTMLElement){
      output.append(result);
    }else if(typeof result in new Set(['number', 'string', 'boolean', 'bigint'])){
      output.innerText = result;
    }else if((typeof result === 'object') || (typeof result === 'array')){
      output.innerHTML = `<pre>${ JSON.stringify(result, null, 2) }</pre>`;
    }else if(result === null){
      output.innerText = 'null';
    }else if(result === undefined){
      output.value = '';
    }else{
      output.innerText = JSON.stringify(result);
    }
  }

  get result(): any {
    return this.#result;
  }
  //#endregion

  //#region public methods
  log(...args: string[]): void {
    const messages = this.qs('.cell-output.messages');
    args.forEach((arg: string) => {
      const p = document.createElement('p');
      p.classList.add('log');
      p.innerText = arg;
      messages.appendChild(p);
    })
  }

  error(...args: string[]){
    const messages = this.qs('.cell-output.messages');
    args.forEach((arg: string) => {
      const p = document.createElement('p');
      p.classList.add('error');
      p.innerText = arg;
      messages.appendChild(p);
    })
  }

  async run(): Promise<any> {
    const context = this.createContext();
    const func = this.createFunction(context);
    const indicator = this.createIndicator(); 

    try{
      this.resetOutput();
      this.result = await func( ... Object.values( context ));
      this.#execution_count!++;
    }catch(error){
      this.error(`Error ${error} ${(error as Error).stack}`);
    }finally{
      this.stopIndicator(indicator);
    }
  }

  resetOutput(): void {
    let p;
    while(p = this.qs('.messages>.error, .messages>.log')) p.remove();
    this.result = undefined;
  }

  toJSON(): any {
    const outputs = [];

    // console.log and console.error outputs
    const messages = this.qs('.cell-output.messages');
    [...messages.children].forEach((p: any) => {
      let output;
      if(p.classList.contains('log')){
        output = {
          "output_type": "stream",
          "name": "stdout",
          "text": p.innerText
        }
      }

      if(p.classList.contains('error')){
        output = { 
          "output_type": "stream",
          "name": "stderr",
          "text": p.innerText
        }
      }

      outputs.push(output);
    });
  
    // execute_result outputs
    if(this.result){
      outputs.push({
        "output_type": "execute_result",
        "execution_count": this.#execution_count!,
        "data": {
          "text/plain": this.result
        }
      });
    }

    const obj = {
      "cell_type": "code",
      "execution_count": this.#execution_count,
      "metadata": {
        "language": "typescript",
        "collapsed": false,
        "autoscroll": false
      },
      "source": this.source,
      "outputs": outputs
    };

    return obj;
  }

  static fromJSON(incoming: any): TypescriptCellElement {
    const cell = new TypescriptCellElement();
    cell.fromJSON(incoming);
    return cell;
  }

  fromJSON(incoming: any): void {
    this.#execution_count = incoming.execution_count;
    
    if(typeof incoming.source === 'string'){
      this.source = incoming.source;
    }
    if(Array.isArray(incoming.source)){
      this.source = incoming.source.join('');
    }
    
    for(let output of incoming.outputs){
      if(output.name === 'stdout') this.log(output.text);
      if(output.name === 'stderr') this.error(output.text);
      if(output.output_type === 'execute_result') this.result = output.data["text/plain"];
    }
  }

  toString(): string {
    return JSON.stringify(this.toJSON());
  }

  static fromString(str: string): TypescriptCellElement {
    const obj = JSON.parse(str);
    const cell = TypescriptCellElement.fromJSON(obj);
    return cell;
  }

  disconnectedCallback(){
    this.view.destroy();
  }
  //#endregion

  //#region private methods
  private setupCodeMirror(): void {
    const cell = this;

    function CtrlEnter(){
      return keymap.of([{
        key: "Ctrl-Enter",
        run(){
          cell.run();
          return true;
        }
      }])
    }

    this.view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [
          EditorView.contentAttributes.of({
            "aria-label": "Cell Editor"
          }),
          CtrlEnter(),
          basicSetup,
          keymap.of([ indentWithTab ]),
          language.of( javascript({ typescript: true })),
          tabSize.of( EditorState.tabSize.of( 2 )),
          placeholder('TypeScript code...'),
          EditorView.lineWrapping
        ]
      }),
      parent: this.qs('.cell-editor')!
    })
  }

  private createContext(): any {
    const outputs = this.qs('.cell-outputs') as HTMLOutputElement;
    const indicator = this.qs('.cell-output.indicator') as HTMLOutputElement;
    const messages = this.qs('.cell-output.messages') as HTMLOutputElement;
    const result = this.qs('.cell-output.result') as HTMLOutputElement;

    outputs.value = '';
    indicator.innerText = '';
    messages.value = '';
    result.value = '';

    outputs.appendChild(indicator);
    outputs.appendChild(messages);
    outputs.appendChild(result);

    const notebook = (this.getRootNode() as any).host.closest('notebook-el') as NotebookElement;
    const context = {
      ...notebook.context,
      output: outputs,
      console: {
        log: (...args: string[]) => {
          this.log(...args);
          console.log(...args);
        },
        error: (...args: string[]) => {
          this.error(...args);
          console.error(...args);
        }
      }
    }

    return context;
  }

  private createFunction(context: any) {
    const AsyncFunction = async function(){}.constructor;
    const source = ts.transpileModule(this.source, {
      module: ts.ModuleKind.ESNext,
      compact: false
    }).outputText;

    const func = new AsyncFunction( ...Object.keys( context ), `
      try{
        ${source}
      }catch(e){
        console.error(e.message);
        console.error(e.stack);
      }
    `)

    return func;
  }

  private createIndicator(): any {
    let indicator = this.qs('.cell-output.indicator');
    if(!indicator){
      const outputs = this.qs('.cell-outputs');
      indicator = document.createElement('output');
      indicator.classList.add('cell-output', 'indicator')
      outputs.prepend(indicator);
    }
    
    let i = 0;
    const states = ['...', ':..', '.:.', '..:'];
    let indicating = setInterval(() => {
      indicator.innerText = states[i++ % states.length];
      if(i === states.length) i = 0;
    }, 250);

    return { indicator, indicating };
  }

  private stopIndicator(pkg: {indicator: HTMLElement, indicating: number}): void {
    clearInterval(pkg.indicating);
    (pkg.indicator as HTMLOutputElement).value = '';
  }
  //#endregion 
}
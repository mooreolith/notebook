
import { basicSetup, EditorView } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { indentWithTab } from '@codemirror/commands';
import { marked } from 'marked';
let language = new Compartment, tabSize = new Compartment;

const create = function(innerText){
  const temp = document.createElement( 'div' );
  temp.innerHTML = innerText;
  return temp.firstChild;
}

class Cell {
  #notebook;
  #element;
  #editor;
  type = undefined;

  constructor(notebook, type){
    this.#notebook = notebook;

    this.#element = create( `<section class="cell">
      <form>
        <input class="cell-type code" type="radio" name="cell-type" value="code" ${type === 'code' ? 'checked' : ''} />
        <label>Code</label>
        <input class="cell-type markdown" type="radio" name="cell-type" value="markdown" ${type === 'markdown' ? 'checked' : ''} />
        <label>Markdown</label>
      </form>
        <div class="input-container"></div>

        <output class="messages"></output>
        <output class="output"></output>

        <div class="cell-buttons">
          <button class="cell-button run">Run</button>
          <button class="cell-button remove">Delete</button>
          <button class="cell-button prepend">Add Above</button>
          <button class="cell-button append">Add Below</button>
        </div>
      </section>` );

    this.qs( '.cell-button.run' ).addEventListener( 'click', this.run.bind( this ) );
    this.qs( '.cell-button.remove' ).addEventListener( 'click', this.remove.bind( this ) );
    this.qs( '.cell-button.prepend' ).addEventListener( 'click', this.prepend.bind( this) );
    this.qs( '.cell-button.append' ).addEventListener( 'click', this.append.bind( this ) );
    this.qs( '.cell-type.code' ).addEventListener( 'change', this.onCellTypeCodeClick.bind( this ) );
    this.qs( '.cell-type.markdown' ).addEventListener( 'change', this.onCellTypeMarkdownClick.bind( this ) );

    const cell = this;
    
    function CtrlEnter(){
      return keymap.of([{
        key: 'Ctrl-Enter',
        run(){
          cell.run();
          return true;
        }
      }]);
    }
    
    const extensions = [
      CtrlEnter(),
      basicSetup,
      keymap.of( [ indentWithTab ] ),
      language.of( type === 'code' ? javascript() : markdown() ),
      tabSize.of( EditorState.tabSize.of( 2 ) )
    ];

    if(type === 'markdown') extensions.push(EditorView.lineWrapping);
    const state = EditorState.create( { extensions } );
    
    this.#editor = new EditorView({ state, parent: this.qs('.input-container') });
  }

  get messages(){
    return [];
  }

  set messages(val){
    return;
  }

  remove(){
    const index = this.#notebook.cellsArr.findIndex( cell => cell === this );
    this.#notebook.cellsArr.splice( index, 1 );
    this.#element.remove();
  }

  prepend(){
    const index = this.#notebook.cellsArr.findIndex( cell => cell === this );
    const cell = new CodeCell( this.#notebook );
    this.#notebook.cellsArr.splice( index - 1, 0, cell );
    this.#element.before( cell.#element )
  }

  append(){
    const index = this.#notebook.cellsArr.findIndex( cell => cell === this );
    const cell = new CodeCell( this.#notebook );
    this.#notebook.cellsArr.splice( index + 1, 0, cell );
    this.#element.after( cell.#element );
  }

  onCellTypeCodeClick(){
    const cell = new CodeCell( this.#notebook );
    const index = this.#notebook.cellsArr.findIndex( cell => cell === this );
    cell.source = this.source;
    this.#notebook.cellsArr.splice( index, 1, cell );
    this.#element.replaceWith( cell.element );
  }

  onCellTypeMarkdownClick(){
    const cell = new MarkdownCell( this.#notebook );
    const index = this.#notebook.cellsArr.findIndex( cell => cell === this );
    cell.source = this.source;
    cell.output = '';
    cell.messages = [];
    this.#notebook.cellsArr.splice( index, 1, cell );
    this.#element.replaceWith( cell.element );
  }

  get source(){
    return this.#editor.state.doc.toString();
  }

  set source(text){
    this.#editor.dispatch( {
      changes: {
        from: 0,
        to: this.#editor.state.doc.length,
        insert: text
      }
    } );
  }

  get element(){
    return this.#element;
  }

  qs(sel){
    return this.#element.querySelector( sel );
  }

  qsa(sel){
    return this.#element.querySelectorAll( sel );
  }
}

class CodeCell extends Cell {
  #element;
  #editor;
  #execution_count = 0;
  type = 'code';

  constructor(notebook){
    super(notebook, 'code');
  }

  get messages(){
    return [ ...this.qsa( '.messages>.log' ) ].map( p => p.innerHTML )
  }

  set messages(msgs){
    msgs.forEach( msg => this.#log(msg) );
  }

  get output(){
    const output = this.qs( '.output' );
    return output.innerHTML;
  }

  set output(result){
    const output = this.qs( '.output' );

    if (result && (result instanceof HTMLElement)) {
      output.innerHTML = '';
      output.appendChild( result );
    } else if (typeof result === 'number') {
      output.innerText = result;
    } else if (typeof result === 'string') {
      output.innerText = result;
    } else if (typeof result === 'boolean') {
      output.innerText = result;
    } else if ((typeof result === 'object') || (typeof result === 'array')) {
      output.innerHTML = `<pre>${ JSON.stringify( result, null, 2 ) }</pre>`;
    } else if (result === null) {
      output.innerText = result;
    }
  }

  get element(){
    return super.element;
  }

  async run(){
    const cell = this.element;
    const messages = this.qs( '.messages' );
    const output = this.qs( '.output' );
    
    this.#execution_count += 1;

    const originalLog = console.log.bind( console );
    console.log = (...args) => { 
      this.#log( ...args ); 
      originalLog( ...args ); 
    };

    messages.innerHTML = '';
    output.innerHTML = '';

    function scopedEval(code, context){
      const AsyncFunction = async function(){}.constructor;
      const func = new AsyncFunction( ...Object.keys( context ), code );
      return func( ...Object.values( context ) );
    }

    this.output = await scopedEval( this.source, { cell, output } );

    console.log = originalLog;
  }

  remove(){
    super.remove();
  }

  #log(...args){
    const p = create(`<p class="log">${ args.map(arg => arg).join(' ') }</p>`);
    this.qs( '.messages' ).appendChild( p );
  }

  toJSON(){
    return {
      "cell_type": "code",
      "execution_count": this.#execution_count,
      "metadata": {},
      "source": this.source,
      "outputs": [{
          "name": "stdout",
          "output": "stream",
          "text": this.messages
        }, {
          "data": {
            "text/plain": this.output
          },
          "execution_count": this.#execution_count,
          "metadata": {},
          "output_type": "execute_result"
        }
      ]
    }
  }

  static fromJSON(notebook, json){
    const cell = notebook.addCodeCell();
    cell.execution_count = json.execution_count;
    cell.source = json.source;
    cell.messages = json.outputs.filter( o => o.name === 'stdout' ).map( o => o.text );
    cell.output = json
      .outputs
      .filter( o => o.output_type === "execute_result" )[ 0 ]
      .data[ "text/plain" ];
    return cell;
  }
}

class MarkdownCell extends Cell {
  #element;
  #editor;
  type = "markdown";

  constructor(notebook){
    super(notebook, 'markdown');
  }

  run(){
    const html = marked.parse( this.source );

    const input = super.qs( '.input-container' );
    const output = super.qs( '.output' );

    const previous = input.style.display;
    input.style.display = 'none';
    output.innerHTML = html

    output.addEventListener( 'dblclick', () => {
      output.innerHTML = '';
      input.style.display = previous;
    })
  }

  remove(){
    super.remove();
  }

  toJSON(){
    return {
      "cell_type": "markdown",
      "metadata": {},
      "source": this.source
    }
  }

  static fromJSON(notebook, json){
    const cell = notebook.addMarkdownCell();
    cell.source = json.source;
    cell.run();
    return cell;
  }

  get element(){
    return super.element;
  }
}

class Notebook {
  #parent;
  #element;
  cellsArr = [];
  cellsEl;

  constructor(container){
    this.#parent = container;
    this.#element = create( `<article class="notebook">
      <h2 class="title" contenteditable="true">Notebook Title</h2>
      <ol class="cells"></ol>

      <div class="notebook-buttons">
        <button class="notebook-button run-all">Run All</button>
        <button class="notebook-button add-cell">Add Cell</button>
      </div>
    </article>` );

    this.#parent.appendChild( this.#element );
    this.cellsEl = this.qs( '.cells' );
    
    // button click event handlers
    this.qs( '.notebook-button.run-all' ).addEventListener( 'click', this.runAll.bind(this) );
    this.qs( '.notebook-button.add-cell' ).addEventListener( 'click', this.addCodeCell.bind(this) );
  }

  async runAll(){
    for(let cell of this.cellsArr){
      await cell.run();
    }
  }

  addCodeCell(){
    const cell = new CodeCell( this );
    this.cellsArr.push( cell );
    this.cellsEl.appendChild( cell.element );
    return cell;
  }

  addMarkdownCell(){
    const cell = new MarkdownCell( this );
    this.cellsArr.push( cell );
    this.cellsEl.appendChild( cell.element );
    return cell;
  }

  get element(){
    return this.#element;
  }

  toJSON(){
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
        }
      },
      "nbformat": 4,
      "nbformat_minor": 2,
      "cells": this.cellsArr.map( cell => cell.toJSON() )
    }
  }

  static fromJSON(container, title, json){
    const notebook = new Notebook( container );
    notebook.title = title;
    json.cells.forEach( json => {
      const CellType = json.cell_type === 'code' ? CodeCell : MarkdownCell;
      const cell = CellType.fromJSON( notebook, json );
      notebook.cellsArr.push( cell );
      notebook.cellsEl.appendChild( cell.element );
    } );

    return notebook;
  }

  get title(){
    return this.qs( '.title' ).innerText;
  }

  set title(title){
    this.qs( '.title' ).innerText = title;
  }

  get element(){
    return this.#element;
  }

  qs(sel){
    return this.#element.querySelector( sel );
  }

  qsa(sel){
    return this.#element.querySelectorAll( sel );
  }
}

class App {
  #parent;
  #element;
  #notebook;

  constructor(container){
    this.#parent = container;
    this.#element = create( `<div>
        <div class="app-buttons">
          <button class="app-button new">New</button>
          <button class="app-button upload">Open</button>
          <button class="app-button download">Save</button>
          <button class="app-button load">Load from Browser</button>
          <button class="app-button store">Store to Browser</button>
          <button class="app-button close">Close</button>
        </div>
        <input type="file" class="notebook-input" style="display: none;" />
        <a class="download-link" style="display: none;"></a>
        <div class="notebook-container"></div>
      </div>` );
    this.#parent.appendChild( this.#element );

    this.qs('.app-button.new').addEventListener( 'click', this.onNewClick.bind(this) );
    this.#notebook = new Notebook( this.qs( '.notebook-container' ) );
    this.qs( '.app-button.upload' ).addEventListener( 'click', () => this.qs( '.notebook-input' ).click() );
    this.qs( '.notebook-input' ).addEventListener( 'change', this.onUploadChange.bind( this ) );
    this.qs( '.app-button.download' ).addEventListener( 'click', this.onDownloadClick.bind( this ) );
    this.qs( '.app-button.load' ).addEventListener( 'click', this.onLoadClick.bind( this ) );
    this.qs( '.app-button.store' ).addEventListener( 'click', this.onStoreClick.bind( this ) );
    this.qs( '.app-button.close' ).addEventListener( 'click', this.onCloseClick.bind(this) );
  }

  onNewClick(){
    this.#notebook = new Notebook( this.#element );
  }

  onUploadChange(){
    const input = this.qs( '.notebook-input' );
    if(input.files.length){
      const file = input.files[0];
      const title = file.name.slice( 0, file.name.length - '.ipynb'.length );
      const reader = new FileReader();
      reader.addEventListener( 'load', () => {
        const text = reader.result;
        const json = JSON.parse( text );
        const notebook = Notebook.fromJSON( this.#element, title, json );
        this.#notebook = notebook;
        this.qs( '.notebook-container' ).appendChild( notebook )
      })
      reader.readAsDataURL( file );
    }
  }

  onDownloadClick(){
    const json = this.#notebook.toJSON();
    const text = JSON.stringify( json );
    const blob = new Blob( [ text ] );
    const url = URL.createObjectURL( blob );
    const a = this.qs( '.download-link' );
    a.setAttribute( 'href', url );
    a.setAttribute( 'download', `${this.#notebook.title}.ipynb` );
    a.click();
  }

  onLoadClick(){
    let filename = prompt( 
      'Notebook (Browser Storage) Filename: ', 
      localStorage.getItem( 'notebook.lastItem' ) ?? ''
    );
    if(filename){
      this.#notebook?.element.remove();
      this.#notebook = null;

      if(!filename.endsWith( '.ipynb' )){
        filename = `${ filename }.ipynb`;
      }

      const title = filename.substring( 0, filename.length - '.ipynb'.length );
      const text = localStorage.getItem( filename );
      const json = JSON.parse( text );

      this.#notebook = Notebook.fromJSON( this.qs( '.notebook-container' ), title, json );
      this.qs( '.notebook-container' ).appendChild( this.#notebook.element )
    }
  }

  onStoreClick(){
    if(!this.#notebook.title) this.#notebook.title = prompt( "Notebook (localStorage) Filename: " );
    if(!this.#notebook.title) return;
    const text = JSON.stringify( this.#notebook.toJSON() );
    localStorage.setItem( `${ this.#notebook.title }.ipynb`, text );
    localStorage.setItem( 'notebook.lastItem', this.#notebook.title );
  }

  onCloseClick(){
    this.#notebook.element.remove();
    this.#notebook = null;
  }

  qs(sel){
    return this.#element.querySelector( sel );
  }
}

export { App }
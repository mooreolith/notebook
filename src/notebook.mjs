/**
 * notebook.mjs
 * 
 * Joshua Moore
 * March 29th, 2025
 * 
 * Source Code: https://github.com/mooreolith/notebook
 * Live Example: https://mooreolith.github.io/notebook
 * 
 * License: MIT License
 * 
 * Copyright © 2025 Joshua M. Moore
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { basicSetup, EditorView } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { markdown } from "@codemirror/lang-markdown";
import { indentWithTab } from '@codemirror/commands';
import { marked } from 'marked';
import { parse } from './lib/parser';
let language = new Compartment, tabSize = new Compartment;

if("serviceWorker" in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./service-worker.js', import.meta.url), {
      scope: '/notebook/',
      type: 'module'
    })
    .catch(error => {
      console.error(`Service Worker registration failed: `, error);
    });

    navigator.serviceWorker.ready
    .then(registration => {
      navigator.storage.persist()
    })
    .catch(error => {
      console.error("Service Worker failed to become ready", error);
    })
  });
}

// utility function
const create = function(innerText){
  const temp = document.createElement( 'div' );
  temp.innerHTML = innerText;
  return temp.firstChild;
}

class Cell {
  notebook;
  #element;
  #editor;
  type = undefined;

  constructor(notebook, type){
    this.notebook = notebook;

    this.#element = create( `<li class="cell">
      <form class="cell-types">
        <input class="cell-type code" type="radio" name="cell-type" value="code" ${type === 'code' ? 'checked' : ''} aria-label="Code" />
        <label>Code</label>
        <input class="cell-type markdown" type="radio" name="cell-type" value="markdown" ${type === 'markdown' ? 'checked' : ''} aria-label="Markdown" />
        <label>Markdown</label>
      </form>
        <div class="input-container"></div>
        <span class="indicator"></span>

        <output class="messages" aria-label="Console messages"></output>
        <output class="output" aria-label="Return value"></output>

        <div class="cell-buttons">
          <button class="cell-button run" aria-label="Run cell">Run</button>
          <button class="cell-button remove" aria-label="Delete cell">Delete</button>
          <button class="cell-button prepend" aria-label="Add cell above">Add Above</button>
          <button class="cell-button append" aria-label="Add cell below">Add Below</button>
        </div>
      </li>` );

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
      EditorView.contentAttributes.of({
        'aria-label': "Cell editor"
      }),
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

  clear(){}

  remove(){
    const index = this.notebook.cellsArr.findIndex( cell => cell === this );
    this.notebook.cellsArr.splice( index, 1 );
    this.#element.remove();
  }

  prepend(){
    const index = this.notebook.cellsArr.findIndex( cell => cell === this );
    const cell = new CodeCell( this.notebook );
    this.notebook.cellsArr.splice( index - 1, 0, cell );
    this.#element.before( cell.#element )
  }

  append(){
    const index = this.notebook.cellsArr.findIndex( cell => cell === this );
    const cell = new CodeCell( this.notebook );
    this.notebook.cellsArr.splice( index + 1, 0, cell );
    this.#element.after( cell.#element );
  }

  onCellTypeCodeClick(){
    const cell = new CodeCell( this.notebook );
    const index = this.notebook.cellsArr.findIndex( cell => cell === this );
    cell.source = this.source;
    this.notebook.cellsArr.splice( index, 1, cell );
    this.#element.replaceWith( cell.element );
  }

  onCellTypeMarkdownClick(){
    const cell = new MarkdownCell( this.notebook );
    const index = this.notebook.cellsArr.findIndex( cell => cell === this );
    cell.source = this.source;
    cell.output = '';
    cell.messages = [];
    this.notebook.cellsArr.splice( index, 1, cell );
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

  clear(){
    this.qs( '.messages' ).innerHTML = '';
    this.qs( '.output' ).innerHTML = '';
  }

  get element(){
    return super.element;
  }

  async run(){
    const messages = this.qs( '.messages' );
    const output = this.qs( '.output' );
    
    this.#execution_count += 1;

    const originalLog = console.log.bind( console );
    console.log = (...args) => { 
      this.#log( ...args ); 
      originalLog( ...args ); 
    };

    const originalError = console.error.bind( console );
    console.error = (...args) => {
      this.#error( ...args );
      originalError( ...args );
    }

    const originalDebug = console.debug.bind( console );
    console.debug = (...args) => {
      this.#debug( ...args );
      originalDebug( ...args);
    }

    messages.innerHTML = '';
    output.innerHTML = '';

    function scopedEval(code, context){
      const AsyncFunction = async function(){}.constructor;
      const func = new AsyncFunction( ...Object.keys( context ), `try{
        ${code}
      } catch(e) {
       console.error(e.message);
       console.error(e.stack);
      }` );
      return func( ...Object.values( context ) );
    }

    const indicator = this.qs('.indicator');
    let i = 0;
    const states = ['...', ':..', '.:.', '..:'];
    const animation = setInterval(() => {
      indicator.innerText = states[i++ % states.length];
    }, 250);
    this.output = await scopedEval( this.source, { cell: this, parse, output, ...this.notebook.context } );
    clearInterval(animation);
    indicator.innerText = '';

    console.log = originalLog.bind( console );
    console.error = originalError.bind( console );
    console.debug = originalDebug.bind( console );
  }

  remove(){
    super.remove();
  }

  #log(...args){
    const p = create(`<p class="log">${ args.join(' ') }</p>`);
    this.qs( '.messages' ).appendChild( p );
  }

  #error(...args){
    const p = create(`<p class="error">${ args.join( ' ' ) }</p>`);
    this.qs( '.messages' ).appendChild( p );
  }

  #debug(...args){
    const p = create(`<p class="debug">${ args.map( a => (typeof a === 'object') || (typeof a === 'array') ? JSON.stringify( a, null, 2 ) : a ).join( '  ' )  }</pre>`);
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
          "output_type": "stream",
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
  context;
  cellsArr = [];
  cellsEl;

  constructor(container, context = {}){
    this.#parent = container;
    this.#element = create( `<article class="notebook">
      <div class="notebook-inner">
        <h2 class="title" contenteditable="true" aria-label="Notebook title">Notebook Title</h2>
        <ol class="cells"></ol>

        <div class="notebook-buttons">
          <button class="notebook-button run-all" aria-label="Run all cells">Run All</button>
          <button class="notebook-button add-cell" aria-label="Append cell">Add Cell</button>
          <button class="notebook-button clear-outputs" aria-label="Clear cell outputs">Clear Outputs</button>
        </div>
      </div>
    </article>` );

    this.#parent.appendChild( this.#element );
    this.context = context;
    this.cellsEl = this.qs( '.cells' );
    
    // button click event handlers
    this.qs( '.notebook-button.run-all' ).addEventListener( 'click', this.runAll.bind( this ) );
    this.qs( '.notebook-button.add-cell' ).addEventListener( 'click', this.addCodeCell.bind( this ) );
    this.qs( '.notebook-button.clear-outputs' ).addEventListener( 'click', this.clearOutputs.bind( this ) );
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

  clearOutputs(){
    for(let cell of this.cellsArr){
      cell.clear();
    }
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
    document.title = title;
    json.cells.forEach( json => {
      const CellType = json.cell_type === 'code' ? CodeCell : MarkdownCell;
      CellType.fromJSON( notebook, json );
    } );

    return notebook;
  }

  get title(){
    return this.qs( '.title' ).innerText;
  }

  set title(title){
    document.title = title;
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

  constructor(container, context = {}){
    this.#parent = container;
    this.#element = create( `<div>
        <div class="app-buttons">
          <label><b>Open: </b></label>
          <button class="app-button new" aria-label="New notebook">New</button>
          <button class="app-button upload" aria-label="Upload notebook">File</button>
          <button class="app-button get" aria-label="Open notebook URL">URL</button>
          <button class="app-button load" aria-label="Load notebook from localStorage">Browser</button>

          <label style="margin-left: 25px;"><b>Save: </b></label>
          <button class="app-button download" aria-label="Download notebook">File</button>
          <button class="app-button post" aria-label="Send notebook to URL via post request">URL</button>
          <button class="app-button store" aria-label="Save notebook to localStorage">Browser</button>

          <label class="app-button" style="margin-left: 25px;" aria-label="About Notebook" onclick="window.location = 'https://github.com/mooreolith/notebook/'"><b>About</b></label>
        </div>
        <input type="file" class="notebook-input" style="display: none;" />
        <a class="download-link" style="display: none;"></a>
        <div class="notebook-container"></div>
      </div>` );
    this.#parent.appendChild( this.#element );

    this.qs( '.app-button.new').addEventListener( 'click', this.onNewClick.bind(this) );
    this.#notebook = new Notebook( this.qs( '.notebook-container' ), context );

    // open file menu items
    this.qs( '.app-button.upload'   ).addEventListener( 'click', () => this.qs( '.notebook-input' ).click() );
    this.qs( '.notebook-input'      ).addEventListener( 'change', this.onUploadChange.bind( this ) );
    this.qs( '.app-button.get'      ).addEventListener( 'click',  this.onGetClick.bind( this ));
    this.qs( '.app-button.load'     ).addEventListener( 'click',  this.onLoadClick.bind( this ) );

    // save file menu items
    this.qs( '.app-button.download' ).addEventListener( 'click',  this.onDownloadClick.bind( this ) );  
    this.qs( '.app-button.post'     ).addEventListener( 'click',  this.onPostClick.bind( this ));
    this.qs( '.app-button.store'    ).addEventListener( 'click',  this.onStoreClick.bind( this ) );

    const opened = this.openSearchParams();
    if(!opened) this.#notebook.addCodeCell();
  }

  openSearchParams() {
    const query = window.location.search;
    const searchParams = new URLSearchParams(query);

    if (searchParams.has('url')) {
      if (this.#notebook) this.close();
      const url = decodeURI(searchParams.get('url'));
      this.fromURL(url);
      return true;
    }
    if (searchParams.has(`ls`)) {
      if (this.#notebook) this.close();
      const filename = searchParams.get('ls');
      this.fromLocalStorage(filename);
      return true;
    }

    return false;
  }

  get element(){
    return this.#element;
  }

  onNewClick(e){
    window.location.search = '';
    if(this.#notebook) this.close();
    this.#notebook = new Notebook( this.qs('.notebook-container') );
  }

  onUploadChange(e){
    if(this.#notebook) this.close();
    const input = this.qs( '.notebook-input' );
    if(input.files.length){
      const file = input.files[0];
      const title = file.name.slice( 0, file.name.length - '.ipynb'.length );
      const reader = new FileReader();
      reader.addEventListener( 'load', () => {
        const json = JSON.parse( reader.result );
        this.#notebook = Notebook.fromJSON( this.qs( '.notebook-container' ), title, json );
      })
      reader.readAsText( file );
    }
  }

  onGetClick(e){
    const url = prompt( "Please enter a URL to open: " );
    if(!url) return;
    if(this.#notebook) this.close();

    this.fromURL(url);
  }

  async fromURL(url){
    const response = await fetch(url);
    if(!response.ok){
      console.error(`Error fetching ${url}`)
      return;
    }

    const title = url.split('/').at(-1).split('.').at(-2);
    const json = await response.json();

    this.#notebook = Notebook.fromJSON( this.qs( '.notebook-container' ), title, json );
  }

  onLoadClick(e){
    let filename = prompt( 
      'Notebook (Browser Storage) Filename: ',
      localStorage.getItem( 'notebook.lastItem' ) ?? ''
    );
    if(filename){
      if(this.#notebook) this.close();
      if(!filename.endsWith( '.ipynb' )){
        filename = `${ filename }.ipynb`;
      }
      
      this.fromLocalStorage( filename );
    }
  }

  fromLocalStorage(filename){
    const title = filename.substring( 0, filename.length - '.ipynb'.length );
    const json = JSON.parse( localStorage.getItem( filename ) );
    this.#notebook = Notebook.fromJSON( this.qs( '.notebook-container' ), title, json );
  }

  onDownloadClick(e){
    if(!this.#notebook) return;
    const text = JSON.stringify( this.#notebook.toJSON() );
    const data = `data:application/x-ipynb+json;charset=utf-8,${encodeURIComponent(text)}`;
    const a = this.qs( '.download-link' );
    a.setAttribute( 'href', data );
    a.setAttribute( 'download', `${this.#notebook.title}.ipynb` );
    a.click();
  }

  async onPostClick(e){
    const url = prompt( "Where would you like to POST this notebook: " );
    if(!url) return;

    if(this.#notebook){
      const title = this.#notebook.title;
      const json = this.#notebook.toJSON();

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': "application/x-ipynb+json"
        },
        body: JSON.stringify(json)
      });

      if(response.ok){
        alert( `${title} successfully sent to ${url}` );
      }else{
        alert( `Error: ${title} NOT successfully sent to ${url}` );
      }
    }
  }

  onStoreClick(e){
    if(!this.#notebook) return;
    if(!this.#notebook.title) this.#notebook.title = prompt( "Notebook (localStorage) Filename: " );
    if(!this.#notebook.title) return;
    const text = JSON.stringify( this.#notebook.toJSON() );
    localStorage.setItem( `${ this.#notebook.title }.ipynb`, text );
    localStorage.setItem( 'notebook.lastItem', this.#notebook.title );
    alert(`${this.#notebook.title} stored in browser's localStorage`)
  }

  clear(){
    if(this.#notebook) this.close();
    this.#notebook = new Notebook( this.qs('.notebook-container'), context )
  }

  close(){
    this.#notebook.element.remove();
    this.#notebook = null;
  }

  qs(sel){
    return this.#element.querySelector( sel );
  }
}

export { App }
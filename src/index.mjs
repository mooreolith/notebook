/*
  mooreolith.github.io/notebook

  Joshua M. Moore
  December 23rd, 2024

  This is my third attempt at writing a Jupyter Notebook compatible Javascript Notebook.
  vscode is able to open my Jupyter file, although holes still exist. Right now I deal 
  with nothing but Code files, but saving and opening works.
*/

// imports
import {basicSetup, EditorView} from 'codemirror';
import {EditorState, Compartment} from '@codemirror/state';
import {javascript} from "@codemirror/lang-javascript";
let language = new Compartment, tabSize = new Compartment;

// UI elements
const notebookTemplate = document.querySelector('template.notebook-template');
const cellTemplate = document.querySelector('template.cell-template');
const addNotebookButton = document.querySelector('button.add-notebook');
const openNotebookButton = document.querySelector('button.open-notebook');
const loadNotebookButton = document.querySelector('button.load-notebook');

// program data
let newCellId = 0;
const cellEditors = new Map([]);
const scope = {eval};
const notebooks = document.querySelector('.notebooks');

/*
  Cell Inputs and Outputs
*/
// Get a cell's input
function getCellInputs(cell){
  const cellId = cell.dataset.cellId;
  const editor = cellEditors.get(cellId);
  
  // It's one string. It includes newlines on most line ends
  const input = editor.state.doc.toString().split('\n').map(text => text.concat('\n'));
  return input;
}

// Retrieve output from a cell (as opposed to logs)
function getCellOutput(cell){
  const output = cell.querySelector('.output');
  return output.value;
}

// Set a cell to an input
function setCellInput(cell, values){
  const cellId = cell.dataset.cellId;
  const editor = cellEditors.get(cellId);
  editor.dispatch({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: values.join('')
    }
  });
}

// Given a cell, return its log lines
function getCellLogs(cell){
  const cellConsole = cell.querySelector('.console');
  return [...cellConsole.querySelectorAll('.line')].map(line => line.innerText);
}


/*
 Console Magic
*/
let cellConsole = null;
scope.console = console;
scope.cellLogs = null;
scope.cellOutput = null;

// Rebound log function
const log = console.log.bind(console);
scope.console.log = function(){
  log(...arguments);
  for(let item of [...arguments]){
    const line = document.createElement('p');
    line.innerText = item; // JSON.stringify(item)
    line.classList.add('log');
    line.classList.add('line');
    cellConsole?.appendChild(line);
  }
};

// Rebound warn function
const warn = console.warn.bind(console);
scope.console.warn = function(){
  warn(...arguments);
  for(let item of [...arguments]){
    const line = document.createElement('p');
    line.innerText = item;
    line.classList.add('warn');
    line.classList.add('line');
    cellConsole?.appendChild(line);
  }
};

// Rebound info function
const info = console.info.bind(console);
scope.console.info = function(){
  info(...arguments);
  for(let item of [...arguments]){
    const line = document.createElement('p');
    line.innerText = item;
    line.classList.add('info');
    line.classList.add('line');
    cellConsole?.appendChild(line);
  }
};

// Rebound debug function
const debug = console.debug.bind(console);
scope.console.debug = function(){
  debug(...arguments);
  for(let item of [...arguments]){
    const line = document.createElement('p');
    line.innerText = item;
    line.classList.add('debug');
    line.classList.add('line');
    cellConsole?.appendChild(line);
  }
};

/*
  Execute a code cell
*/
function runCell(e){
  const cell = e.target.closest('.cell');
  if(!cell.dataset.execution_count){
    cell.dataset.execution_count = 0;
  }
  cell.dataset.execution_count = parseInt(cell.dataset.execution_count) + 1;

  // Get references to logs and outputs
  cellConsole = cell.querySelector('.console');
  const output = cell.querySelector('.output');
  
  // get cell input
  const texts = getCellInputs(cell);

  // try and run cell with input
  try{
    // clear previous outputs
    cellConsole.innerHTML = "";
    output.innerHTML = "";

    // begin calculation
    const result = scope.eval(texts.join(''));    
    if(output.classList.contains("error")) output.classList.remove('error');
    
    // display final output value, if any
    output.value = JSON.stringify(result, null, 2);
  }catch(e){
    // show error message
    output.classList.add('error');
    output.value = `${e.name}, Line: ${e.lineNumber}: ${e.message}`
  }

  return true;
}

/*
  Cell Functions
*/

// Remove a cell from a notebook
function removeCell(e){
  // Get reference to cell
  const cell = e.target.closest('.cell');

  // Get cell's cellid
  const cellId = cell.dataset.cellId;

  // Remove the cell
  cell.remove();

  // Remove the saved editor for that cell
  cellEditors.delete(cellId);
}

// Setup a text editor for a cell
function setupEditor(cell){
  // Get a unique id for the cell
  const cellId = (++newCellId).toString();
  cell.dataset.cellId = cellId;

  // Get a place into which to stick a codemirror editor
  const inputContainer = cell.querySelector('.input-container');

  // Create an EditorState and use it to construct a EditorView
  let state = EditorState.create({
    extensions: [
      basicSetup,
      language.of(javascript()),
      tabSize.of(EditorState.tabSize.of(2))
    ]
  });

  const editor = new EditorView({state, parent: inputContainer});

  // Save editor for later reference
  cellEditors.set(cellId, editor);
}

// Setup button evens for the cell
function setupButtonEvents(cell){
  // execute a cell and print its logs and output
  const runCellButton = cell.querySelector('button.run-cell');
  runCellButton.onclick = runCell;

  // remove a cell, including its logs and outputs
  const removeCellButton = cell.querySelector('button.remove-cell');
  removeCellButton.onclick = removeCell;

  // clone a cell and add it to the notebook
  const copyCellButton = cell.querySelector('button.copy-cell');
  copyCellButton.onclick = copyCell;}

// Create and add a clone of a cell
function copyCell(e){
  const notebook = e.target.closest('.notebook');
  const cells = notebook.querySelector('.cells');
  const originalCell = e.target.closest('.cell');
  const copiedCell = cellTemplate.content.cloneNode(true).querySelector('.cell');

  setupButtonEvents(copiedCell);
  setupEditor(copiedCell);
  
  const originalInputs = getCellInputs(originalCell);
  const originalOutput = originalCell.querySelector('.output').value;

  setCellInput(copiedCell, originalInputs);
  copiedCell.querySelector('.output').value = originalOutput;

  cells.appendChild(copiedCell);
}

/*
  Notebook Functions
*/

// Add a cell to a notebook
function addCell(e){
  const notebook = e.target.closest('.notebook');
  const cells = notebook.querySelector('.cells');
  const cell = cellTemplate.content.cloneNode(true).querySelector('.cell');

  setupButtonEvents(cell);
  setupEditor(cell);
  cells.appendChild(cell);
}

// Remove a notebook from the app
function removeNotebook(e){
  const notebook = e.target.closest('.notebook');
  notebook.remove();
}

/*
  Save a notebook to json and write it to a downloadable file
*/
function notebookToJSON(notebook) {
  let title = notebook.querySelector('.title').innerText.trim();

  const json = {
    "cells": [...notebook.querySelectorAll('.cell')].map(cell => {
      // this is one cell
      const cellOutput = {
        "cell_type": "code",
        "execution_count": parseInt(cell.dataset.execution_count),
        "metadata": {},
        "outputs": [
          {
            "name": "stdout",
            "output_type": "stream",
            "text": getCellLogs(cell)
          }, {
            "data": {
              "text/plain": [getCellOutput(cell)]
            },
            "execution_count": parseInt(cell.dataset.execution_count),
            "metadata": {},
            "output_type": "execute_result"
          }
        ],
        "source": getCellInputs(cell),
      };

      return cellOutput;
    }),
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
        "nbconvert_exporter": "javascript",
      }
    },
    "nbformat": 4,
    "nbformat_minor": 2,
  };

  const text = JSON.stringify(json);
  return { text, title };
}

function saveNotebook(e){ 
  const notebook = e.target.closest('.notebook');
  let { text, title } = notebookToJSON(notebook);
  if(!title.endsWith('.ipynb')) title = `${[title]}.ipynb`;

  const blob = new Blob([text], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title}.ipynb`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function storeNotebook(e){
  const notebook = e.target.closest('.notebook');
  let {text, title} = notebookToJSON(notebook);

  if(!title){
    title = prompt("Notebook Name: ");
  }

  if(!title.endsWith('.ipynb')){
    title = title.concat('.ipynb');
  }

  localStorage.setItem(title, text);
  localStorage.setItem('lastItem', title);
}

function loadNotebook(e){
  const lastItem = localStorage.getItem('lastItem');
  let title;
  if(lastItem){
    title = prompt("Notebook Name: ", lastItem);
  }else{
    title = prompt("Notebook Name: ");
  }
  if(!title) return;

  let text = localStorage.getItem(title);
  if(text === null){
    text = localStorage.getItem(`${title}.ipynb`);
  }
  if(!text) return;

  let json;
  try{
    json = JSON.parse(text);
  }catch(e){
    alert("Error reading JSON");
  }

  try{
    openNotebook(json, title);
  }catch(e){
    alert("Error opening notebook");
    console.debug(e)
  }
}

/*
  App Functions
*/
function addNotebook(e){
  // fetch us some elements
  const notebooks = document.querySelector('.notebooks')
  const notebook = notebookTemplate.content.cloneNode(true);

  // wire up notebook buttons
  const addCellButton = notebook.querySelector('button.add-cell');
  addCellButton.onclick = addCell;

  // open at least one cell
  notebook.querySelector('button.add-cell').click();

  const removeCellButton = notebook.querySelector('button.remove-notebook');
  removeCellButton.onclick = removeCell;

  const removeNotebookButton = notebook.querySelector('button.remove-notebook');
  removeNotebookButton.onclick = removeNotebook;

  // download as file
  const saveNotebookButton = notebook.querySelector('button.save-notebook');
  saveNotebookButton.onclick = saveNotebook;

  // store to browser
  const storeNotebookButton = notebook.querySelector('button.store-notebook');
  storeNotebookButton.onclick = storeNotebook;

  // add notebook to page
  notebooks.appendChild(notebook);
}

/*
  Open a notebook from json and add it to the screen
*/
function openCell(notebook, json){
  const cells = notebook.querySelector('.cells');

  for(let cellSource of json.cells){
    let cell = cellTemplate.content.cloneNode(true).querySelector('.cell');
    cellConsole = cell.querySelector('.console');
    const cellOutput = cell.querySelector('.output');

    // setup cell button event handlers
    setupButtonEvents(cell);

    // setup codemirror editor
    setupEditor(cell);

    // set cell execution count
    cell.dataset.execution_count = 0;

    // set cell input
    const originalInputs = cellSource.source;
    setCellInput(cell, originalInputs);

    // set cell logs
    cellSource.outputs
      .filter(output => output?.outputs?.output_type === 'stdout')
      .map(output => output.text)
      .map(log);
    
    // set cell log
    cellOutput.value = cellSource.outputs
      .filter(output => output?.outputs.output_type === 'execute_result')
      [0]
      .data['text/plain'];
  }
}

// Remove a notebook and clear the app's cellEditors 
function closeNotebook(notebook){
  cellEditors.clear();
  notebook.remove();
}

// Construct a notebook given json and a filename
function openNotebook(json, filename){
  // get a reference to .notebooks
  const notebooks = document.querySelector('.notebooks');

  /*
  // close notebook if one is open
  if(notebooks.children.length && !confirm("Close Notebook")) return;
  let notebook = notebooks.querySelector('.notebook');
  if(notebooks.children.length) closeNotebook(notebook);
  */

  // instantiate a notebook template
  notebook = notebookTemplate.content.cloneNode(true);

  // set notebook title
  notebook.querySelector('.title').innerText = filename;
  
  // wire up notebook buttons
  const addCellButton = notebook.querySelector('button.add-cell');
  addCellButton.onclick = addCell;

  const removeCellButton = notebook.querySelector('button.remove-notebook');
  removeCellButton.onclick = removeCell;

  const removeNotebookButton = notebook.querySelector('button.remove-notebook');
  removeNotebookButton.onclick = removeNotebook;

  const saveNotebookButton = notebook.querySelector('button.save-notebook');
  saveNotebookButton.onclick = saveNotebook;

  // add cells
  // for the sake of simplicity, I'm dealing only with code cells. 
  const cells = notebook.querySelector('.cells');

  for(let cellSource of json.cells){
    const cell = cellTemplate.content.cloneNode(true).querySelector('.cell');

    // wire up cell buttons
    setupButtonEvents(cell);

    // set up codemirror editor
    setupEditor(cell);

    // set cell input
    setCellInput(cell, cellSource.source);

    // set cell output, if present
    cellConsole = cell.querySelector('.console');
    const cellOutput = cell.querySelector('.output');

    const originalOutput = cellSource.outputs.map(output => {
      if(output.name === 'stdout'){
        const line = document.createElement('p');
        line.innerText = output
        line.classList.add('log');
        line.classList.add('line');
        cellConsole.appendChild(line);
      }else if(output.output_type === 'execute_result'){
        cellOutput.value = output.data["text/plain"];
      }
    });
    cell.querySelector('.output').value = originalOutput;

    // add cell to notebook
    cells.appendChild(cell);
  }

  notebooks.appendChild(notebook);
}

// Hidden file input, triggered by other button click
const notebookInput = document.querySelector('input.notebook-input');
openNotebookButton.onclick = function(){
  notebookInput.click();
}

// Read the file and call openNotebook
notebookInput.onchange = function(){
  if(notebookInput.files.length){
    const file = notebookInput.files[0];
    const fileName = file.name.slice(0, file.name.length - '.ipynb'.length);
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
      const result = event.target.result;
      openNotebook(JSON.parse(result), fileName);
    });

    reader.readAsText(file);
  }
}

loadNotebookButton.onclick = loadNotebook;

// Add a notebook upon button click
addNotebookButton.onclick = addNotebook;

// Open at least one notebook
addNotebook();
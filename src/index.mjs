/*
  mooreolith.github.io/notebook

  Joshua M. Moore
  December 23rd, 2024

  This is my third attempt at writing a Jupyter Notebook compatible Javascript Notebook.
  vscode is able to open my Jupyter file, although holes still exist. Right now I deal 
  with nothing but Code files, but saving and opening works.
*/

// imports
import { basicSetup, EditorView } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { keymap } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { indentWithTab } from '@codemirror/commands';
let language = new Compartment, tabSize = new Compartment;

// UI elements
const notebookTemplate = document.querySelector('template.notebook-template');
const cellTemplate = document.querySelector('template.cell-template');
const addNotebookButton = document.querySelector('button.add-notebook');
const uploadNotebookButton = document.querySelector('button.upload-notebook');
const openNotebookButton = document.querySelector('button.open-notebook');

// program data
let newCellId = 0;
const cellEditors = new Map([]);
const scope = {};
const notebooks = document.querySelector('.notebooks');
let urlSearchParams = new URLSearchParams(window.location.search);

/*
  Cell Inputs and Outputs
*/
// Get a cell's input
function getCellInputs(cell){
  const cellId = cell.dataset.cellId;
  const editor = cellEditors.get(cellId);
  
  // It's one string. It includes newlines on most line ends
  const input = editor.state.doc.toString().trim()
    .split('\n')
    .map(text => text.concat('\n'));

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
      insert: values.join('').trim()
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
    window.cell = cell;
    const result = eval(texts.join(''));
    window.cell = undefined;    
    if(output.classList.contains("error")) output.classList.remove('error');
    
    // display final output value, if any
    output.value = JSON.stringify(result, null, 2);
  }catch(e){
    // show error message
    output.classList.add('error');
    output.value = `${e.name}, Line: ${e.lineNumber}: ${e.message}`;
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

  // Ctrl-Enter
  function CtrlEnter(){
    return keymap.of([{
      key: "Ctrl-Enter",
      run() { runCell({target: cell.children[0]}); return true; }
    }]);
  }

  // Create an EditorState and use it to construct a EditorView
  let state = EditorState.create({
    extensions: [
      CtrlEnter(),
      basicSetup,
      keymap.of([indentWithTab]),
      language.of(javascript()),
      tabSize.of(EditorState.tabSize.of(2))
    ]
  });

  const editor = new EditorView({state, parent: inputContainer});

  // Save editor for later reference
  cellEditors.set(cellId, editor);
}

// Setup button evens for the cell
function setupCellButtons(cell){
  // execute a cell and print its logs and output
  const runCellButton = cell.querySelector('button.run-cell');
  runCellButton.onclick = runCell;

  // remove a cell, including its logs and outputs
  const removeCellButton = cell.querySelector('button.remove-cell');
  removeCellButton.onclick = removeCell;

  // clone a cell and add it to the notebook
  const copyCellButton = cell.querySelector('button.copy-cell');
  copyCellButton.onclick = copyCell;

  // create a new cell and add it below the current cell
  const addCellBelowButton = cell.querySelector('button.add-cell-below');
  addCellBelowButton.onclick = addCellBelow;

  // cell.addEventListener('keydown', handleCtrlEnter);
}

function handleCtrlEnter(e){
  if(e.ctrlKey && e.key === 'Enter') runCell(e);
}

function addCellBelow(e){
  const originalCell = e.target.closest('.cell');
  const addedCell = cellTemplate.content.cloneNode(true).querySelector('.cell');
  
  setupCellButtons(addedCell);
  setupEditor(addedCell);

  originalCell.after(addedCell);
}

// Create and add a clone of a cell
function copyCell(e){
  const notebook = e.target.closest('.notebook');
  const cells = notebook.querySelector('.cells');
  const originalCell = e.target.closest('.cell');
  const copiedCell = cellTemplate.content.cloneNode(true).querySelector('.cell');

  setupCellButtons(copiedCell);
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

  setupCellButtons(cell);
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
  let title = notebook.querySelector('.title').innerText.replace('<br>', '').trim();
  title = title.endsWith('.ipynb') ? title : `${title}.ipynb`;

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

  const blob = new Blob([text], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', title);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function storeNotebook(e){
  const notebook = e.target.closest('.notebook');
  let { text, title } = notebookToJSON(notebook);

  localStorage.setItem(title, text);
  localStorage.setItem('lastItem', title);
}

function closeIfPristine(notebook){
  const cell = notebook.querySelector('.cell');
  if(
    cell.dataset.execution_count === undefined 
    && notebook.querySelectorAll('.cell').length === 1
    && notebook.querySelector('.title').textContent === 'Notebook Title'){
    closeNotebook(notebook)
  }
}

async function open(_){
  document.querySelectorAll('.notebook').forEach(closeIfPristine);
  const lastItem = localStorage.getItem('lastItem');
  let title, json;

  if(lastItem) title = prompt("Notebook Name: ", lastItem);
  else title = prompt("Notebook Name: ");
  if(!title) return;
  const filename = title.endsWith('.ipynb') ? title : `${title}.ipynb`;
  const url = URL.parse(filename);

  if(url === null){
    const text = localStorage.getItem(filename);
    if(!text) return;
    try{
      json = JSON.parse(text);
    }catch(err){
      return alert("Error parsing notebook!");
    }
  }else{
    // parse title
    const parts = title.split('/');
    title = parts[parts.length - 1];

    // fetch file and parse json
    const response = await fetch(url);
    json = await response.json();
  }

  // open notebook with json and title
  try{
    openNotebook(json, title);
  }catch(err){
    alert("Error opening notebook!")
  }
}

/*
  App Functions
*/
function addNotebook(e){
  // fetch us some elements
  const notebooks = document.querySelector('.notebooks')
  const notebook = notebookTemplate.content.cloneNode(true).querySelector('.notebook');

  // wire up notebook buttons
  const addCellButton = notebook.querySelector('button.add-cell');
  addCellButton.onclick = addCell;

  // open at least one cell
  notebook.querySelector('button.add-cell').click();

  setupNotebookButtons(notebook);

  // add notebook to page
  notebooks.appendChild(notebook);
}

function setupNotebookButtons(notebook) {
  const addCellButton = notebook.querySelector('button.add-cell');
  addCellButton.onclick = addCell;

  const removeNotebookButton = notebook.querySelector('button.remove-notebook');
  removeNotebookButton.onclick = removeNotebook;

  // download as file
  const saveNotebookButton = notebook.querySelector('button.save-notebook');
  saveNotebookButton.onclick = saveNotebook;

  // store to browser
  const storeNotebookButton = notebook.querySelector('button.store-notebook');
  storeNotebookButton.onclick = storeNotebook;
}

// Remove a notebook and clear the app's cellEditors 
function closeNotebook(notebook){
  cellEditors.clear();
  notebook.remove();
}

// Construct a notebook given json and a filename
function openNotebook(json, filename){
  // close any opened pristine notebook
  document.querySelectorAll('.notebook').forEach(closeIfPristine);

  // get a reference to .notebooks
  const notebooks = document.querySelector('.notebooks');

  // instantiate a notebook template
  const notebook = notebookTemplate.content.cloneNode(true).querySelector('.notebook');

  // set notebook title
  if(filename.endsWith('.ipynb')){
    filename = filename.slice(0, filename.length - '.ipynb'.length)
  }
  notebook.querySelector('.title').innerText = filename;
  
  setupNotebookButtons(notebook);

  // add cells
  // for the sake of simplicity, I'm dealing only with code cells. 
  const cells = notebook.querySelector('.cells');

  for(let cellSource of json.cells){
    const cell = cellTemplate.content.cloneNode(true).querySelector('.cell');

    // wire up cell buttons
    setupCellButtons(cell);

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

// Read the file and call openNotebook
const notebookInput = document.querySelector('input.notebook-input');

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

uploadNotebookButton.onclick = function(){
  notebookInput.click();
}

openNotebookButton.onclick = open;

// Add a notebook upon button click
addNotebookButton.onclick = addNotebook;

// Check urlParams for ?url=
// Open Notebook URL if present
const url = urlSearchParams.get('url');
if(url && url.endsWith('.ipynb')){
  fetch(url).then(async response => {
    const json = await response.json();
    console.log("JSON", json)
    const filename = url.split('/').pop().slice(0, -6);
    openNotebook(json, filename);
  })
}else{
  // Open at least one notebook
  addNotebook();
}

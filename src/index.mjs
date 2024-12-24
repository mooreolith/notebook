import {basicSetup, EditorView} from 'codemirror';
import {EditorState, Compartment} from '@codemirror/state';
import {javascript} from "@codemirror/lang-javascript";
let language = new Compartment, tabSize = new Compartment;

const notebookTemplate = document.querySelector('template.notebook-template');
const cellTemplate = document.querySelector('template.cell-template');
const addNotebookButton = document.querySelector('button.add-notebook');
const openNotebookButton = document.querySelector('button.open-notebook');
let newCellId = 0;
const cellEditors = new Map([]);
const scope = {eval};
const notebooks = document.querySelector('.notebooks');

/*
  Cell Inputs and Outputs
*/
function getCellInputs(cell){
  const cellId = cell.dataset.cellId;
  const editor = cellEditors.get(cellId);
  
  // It's one string. It includes newlines on most line ends
  const input = editor.state.doc.toString().split('\n').map(text => text.concat('\n'));
  return input;
}

function getCellOutput(cell){
  const output = cell.querySelector('.output');
  return output.value;
}

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

function getCellLogs(cell){
  const cellConsole = cell.querySelector('.console');
  return [...cellConsole.querySelectorAll('.line')].map(line => line.innerText);
}


/*
 Console Magic
*/
let cellConsole = null;
scope.console = console;

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


function runCell(e){
  const cell = e.target.closest('.cell');
  if(!cell.dataset.execution_count){
    cell.dataset.execution_count = 0;
  }
  cell.dataset.execution_count = parseInt(cell.dataset.execution_count) + 1;

  cellConsole = cell.querySelector('.console');
  const output = cell.querySelector('.output');
  
  const texts = getCellInputs(cell);
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
function removeCell(e){
  const cell = e.target.closest('.cell');
  const cellId = cell.dataset.cellId;
  cell.remove();
  cellEditors.delete(cellId);
}

function setupEditor(cell){
  const cellId = (++newCellId).toString();
  cell.dataset.cellId = cellId;
  const inputContainer = cell.querySelector('.input-container');

  let state = EditorState.create({
    extensions: [
      basicSetup,
      language.of(javascript()),
      tabSize.of(EditorState.tabSize.of(2))
    ]
  });

  const editor = new EditorView({state, parent: inputContainer});
  cellEditors.set(cellId, editor);
}

function setupButtonEvents(cell){
  const runCellButton = cell.querySelector('button.run-cell');
  runCellButton.onclick = runCell;

  const removeCellButton = cell.querySelector('button.remove-cell');
  removeCellButton.onclick = removeCell;

  const copyCellButton = cell.querySelector('button.copy-cell');
  copyCellButton.onclick = copyCell;
}

function copyCell(e){
  const notebook = e.target.closest('.notebook');
  const cells = notebook.querySelector('.cells');
  const originalCell = e.target.closest('.cell');
  const copiedCell = cellTemplate.content.cloneNode(true);
  copiedCell

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
function addCell(e){
  const notebook = e.target.closest('.notebook');
  const cells = notebook.querySelector('.cells');
  const cell = cellTemplate.content.cloneNode(true).querySelector('.cell');

  setupButtonEvents(cell);
  setupEditor(cell);
  cells.appendChild(cell);
}

function removeNotebook(e){
  const notebook = e.target.closest('.notebook');
  notebook.remove();
}

/*
  Save a notebook to json and write it to a downloadable file
*/
function saveNotebook(e){ 
  const notebook = e.target.closest('.notebook');
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
  }

  const text = JSON.stringify(json);
  const blob = new Blob([text], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title}.ipynb`);
  document.body.appendChild(link);
  link.click();
  link.remove();
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

  const saveNotebookButton = notebook.querySelector('button.save-notebook');
  saveNotebookButton.onclick = saveNotebook;

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

function closeNotebook(notebook){
  cellEditors.clear();
  notebook.remove();
}

function openNotebook(json, filename){
  // get a reference to .notebooks
  const notebooks = document.querySelector('.notebooks');

  // close notebook if one is open
  if(notebooks.children.length && !confirm("Close Notebook")) return;
  let notebook = notebooks.querySelector('.notebook');
  if(notebooks.children.length) closeNotebook(notebook);

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

const notebookInput = document.querySelector('input.notebook-input');
openNotebookButton.onclick = function(){
  notebookInput.click();
}

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


// add a notebook upon button click
addNotebookButton.onclick = addNotebook;

// open at least one notebook
addNotebook();
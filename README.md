# [🔗](https://mooreolith.github.io/notebook/) Notebook

Welcome to Notebook, a client-side Markdown/JavaScript notebook. 

## How to install Notebook
Clone the notebook repository


`git clone https://github.com/mooreolith/notebook`

Change to the newly created directory.

`cd notebook`

Run install the dependencies

`npm install`

Run the start script

`npm run start`

This should open a server on port 8080, which you can then access at http://localhost:8080/.

## How to use Notebook
You can either install the notebook locally, or run the github hosted version: https://mooreolith.github.io/notebook/. 

### Cells
The notebook contains markdown cells for prose, and javascript cells to evaluate. To render or run a cell, respectively, press CTRL+Enter within the text area. Alternatively, you can click the `Run` button underneath the cell. To switch between the cell types, select the labelled radio buttons at the top of a cell. 

Cells have four buttons beneath them: 

* Run, renders a markdown cell or evaluates a Javascript cell
* Delete, deletes this cell
* Add Above, adds a cell above this cell
* Add Below, adds a cell below this cell

#### Markdown Cells
Once a markdown cell is rendered, the textarea disappears. To get it back, double click the rendered text. 

#### Code Cell
When a code cell is run, you should see a small animation indicating the cell is still evaluating. A code cell evaluates its code in the context of an async function. Several return types are possible:

* Number, gets displayed underneath the cell input, in the output area
* String, gets displayed underneath the cell input
* Array, displays an indented, comma-separated list of values.
* Object, displays an indented, comma-separated list of key value pairs
* HTMLElement, simply appends the HTMLElement to the cell's output element

A code cell also makes available special variables you can use in your own code: 

* `cell`, a reference to the current cell such as `source`
* `output`, a refernece to the current cell's `<output>` element

Since the code cell evaluates as an async function, you can use `await` in a code cell. Variables declared as var, let, or const are private to the current cell, while global variables (declared without var, let or const) can be read and written to in subsequent cells. 

### Notebook
Above the notebook are seven menu options. four to open a notebook, three to save the current notebook.Opening a notebook will clear the current notebook.

Open:
  * New, clears the notebook and opens a new one
  * File, prompts for a file input to open in the notebook app
  * URL, prompts for a URL from which to load a notebook
  * Browser, prompts for a notebook title for which to search in the browser's localStorage

Save
  * File, for downloading the file as "Notebook Title.ipynb", where Notebook Title is the current notebook title
  * URL, prompts for a URL to which to post the current notebook
  * Browser, saves the notebook to the browser's localStorage, overriding anything with the same title

At the bottom of a notebook, you'll find three buttons:

* Run All, runs all cells in order
* Add Cell, adds a cell at the bottom
* Clear Outputs, clears all cells' outputs (the notebook's state remains unchanged)

## Attribution
This project wouldn't have been possible without [these projects](./oss-attribution/attribution.txt). Follow the link for license information and links to the dependency sources. 
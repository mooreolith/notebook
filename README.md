# notebook

[This](https://mooreolith.github.io/notebook) is my third version of a JavaScript notebook in the spirit of jupyter files. It's a light UI wrapped around window.eval. It should work alright on desktops and phones. 

## How are variables handled? 
Variables are local to the cell they are created in, unless they are global variables. Under the hood, it's a new Function. Additionally, your cell defines three variables: 
* notebook, a reference to the notebook html element
* cell, a reference to the notebook cell element
* output, a reference to the notebook cell's output element. You can set it's value to something, or use appendChild. 

Using return in a cell prints the returned value to the output.

## What do the buttons do?

Click the "Notebook Title" to edit it. The line beginning with line number "1" is a code cell. For simplicity, I don't have markdown cells, I just use comments. 

Click "Run Cell" to run the code above. Below you'll see console log, info, and warn output, and below that the return value of the cell, which may be "undefined" if your last call doesn't have a return value. Alternatively, hit Ctrl-Enter to run the current cell. The extra newline is a known bug.

"Remove Cell" removes a cell, copy cell creates a cell with the same contents. 

"Add Cell" appends another cell to the notebook, in the future I may allow reordering cells. For the time being, that's not the case.

"Remove Notebook" closes this notebook. 

"Download Notebook" downloads a "Notebook Title.ipynb" file, or if that file already exists, a Notebook Title(1).ipynb and so on. You can select this file and open it again by clicking "Upload Notebook". 

"Store Notebook" writes this notebook into your browser's localStorage, where you can access it from "Open Notebook". There is no menu, but if you enter the filename of a previously stored notebook into the Open Notebook prompt, you should  get that notebook back. 

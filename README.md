Vertices and Edges .net
proudly presents:

# Notebook
## Introduction
The notebook app aims to provide a notebook experience similar to that of Jupyter Notebook, except that this is browser Javascript and Typescript. The notebooks uses the ipynb format for writing and reading files, but sets the language field to javascript. 

## Features
The notebook consists of cells, which come in three types:
* Markdown
* Typescript
* Javascript

The markdown cell offers a wysiwyg markdown editor, and has support for code blocks and even math blocks.

Typescript and Javascript cells are run in the context of a AsyncFunctions, which means you can use the await keyword inside of code cells (unless you're in a non-async function).

You can save notebooks to File, URL for POST request, or the Browser's IndexedDB. You can open notebooks from File, URL for GET request, or from the Browser's IndexedDB via the notebook title. 

Don't forget to give the notebook a title! The header is contenteditable. The notebook title becomes the filename for file download and browser storage. 

## Development
```bash
git clone https://github.com/verticesandedges/notebook.git
cd notebook
npm install
npm run build
```
import { NotebookElement } from "./notebook/notebook";

export class NotebookAppElement extends HTMLElement {
  static template: string = `
<style>
:root{
}

:host {
  box-sizing: content-box;
  display: block;
  float: none;
  padding-bottom: 100vh;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 20px;
}

@media screen {
  .notebook-app-actions {
    display: flex;
    flex-direction: row;
    gap: 15px;
    justify-content: center;
    align-items: center;
    outline: none;
    border: none;
    --font-size: 20px;
    margin-top: 15px;
    margin-bottom: 15px;
  }
}

@media not screen {
  .notebook-app-actions {
    display: none;
  }
}

label {
  font-weight: bold;

}

button {
  margin: 0;
  border: 0;
  padding: 0;

  color: var(--ui-color);
  background-color: var(--bg-color);
  font-size: var(--font-size);
}
</style>

<div class="notebook-app-actions">
  <label>Save:</label>
  <div>
    <button class="save-file">File</button>
  </div>
  <div>
    <button class="save-url">URL</button>
  </div>
  <div>
    <button class="save-browser">Browser</button>
  </div>
  <label>Open:</label>
  <div>
    <button class="open-file">File</button>
  </div>
  <div>
    <button class="open-url">URL</button>
  </div>
  <div>
    <button class="open-browser">Browser</button>
  </div>
</div>

<notebook-el></notebook-el>
  `;

  qs!: (query: string) => HTMLElement;
  qsa!: (query: string) => NodeList;

  constructor(){
    super();
    this.attachShadow({mode: "open"});
    this.shadowRoot!.innerHTML = NotebookAppElement.template;
    this.qs = this.shadowRoot!.querySelector.bind(this.shadowRoot);
    this.qsa = this.shadowRoot!.querySelectorAll.bind(this.shadowRoot);

    this.qs('.save-file').addEventListener('click', () => this.onSaveToFileClick());
    this.qs('.save-url').addEventListener('click', () => this.onSaveToURLClick());
    this.qs('.save-browser').addEventListener('click', () => this.onSaveToBrowserClick());
    
    this.qs('.open-file').addEventListener('click', () => this.onOpenFromFileClick());
    this.qs('.open-url').addEventListener('click', () => this.onOpenFromURLClick());
    this.qs('.open-browser').addEventListener('click', () => this.onOpenFromBrowserClick());

    this.openURLParams();
    this.openLaunchFile();
  }

  async openURLParams(){
    const queryString = window.location.search;
    const params = new URLSearchParams(queryString);
    const url = params.get('url');
    if(!url) return;
    const response = await fetch(url);
    if(!response.ok){
      alert(`Error opening url parameter ${url}. ${response.status}: ${response.statusText}`);
      return;
    }
    const text = await response.text();
    const nb = this.qs('notebook-el') as NotebookElement;
    nb.fromString(text, true);
  }

  openLaunchFile(){
    if('launchQueue' in window){
      const nb = this.qs('notebook-el') as NotebookElement;
      window.launchQueue.setConsumer(async launchParams => {
        const params = new URL(launchParams.targetURL).searchParams;
        if((params.files && params.files.length) || params.has('open-file')){
          const handle = launchParams.files[0];
          const title = handle.name.slice(0, handle.name.length - '.ipynb'.length);
          const file = await handle.getFile();
          const text = await file.text();
          nb.fromString(text, true);
          nb.title = title;
          return;
        }
      });
    }
  }

  async onSaveToFileClick(): Promise<void> {
    const nb = this.qs('notebook-el') as NotebookElement;
    const contents = nb.toString();
      
    if("showSaveFilePicker" in window){
      const fileHandle = await window.showSaveFilePicker();
      const writable = await fileHandle.createWritable();
      await writable.write(contents);
      await writable.close();
    }else{
      const anchor = document.createElement('a');
      const url = URL.createObjectURL(new Blob([contents]));
      document.body.appendChild(anchor);
      anchor.href = url;
      anchor.download = `${nb.title}${nb.title.includes('.ipynb') ? "" : ".ipynb"}`;
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }
  }

  async onSaveToURLClick(): Promise<void> {
    let previous = localStorage.getItem('notebook.previousURL') ?? '';
    const url = prompt("URL:", previous);
    if(!url) return;
    localStorage.setItem('notebook.previousURL', url);
    const nb = this.qs('notebook-el') as NotebookElement;
    const response = await fetch(url, {method: "POST", body: nb.toString()});
    if(response.ok){
      alert(`${nb.title} successfully sent to ${url}`);
    }else{
      alert(`Error sending ${nb.title} to ${url}. ${response.status}: ${response.statusText}`);
    }
  }

  onSaveToBrowserClick(): void {
    const open = window.indexedDB.open("notebook.notebookDB", 1);
    const notebook = this.qs('notebook-el') as NotebookElement;
    localStorage.setItem('notebook.lastTItle', notebook.title);

    open.onupgradeneeded = () => {
      const db = open.result;
      const store = db.createObjectStore("notebookStore", {keyPath: "metadata.title"});
      const index = store.createIndex("notebookTitleIndex", ["metadata.title"]);
    };

    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('notebookStore', "readwrite");
      const store = transaction.objectStore("notebookStore");
      // const index = store.index("notebookTitleIndex");

      store.put(notebook.toJSON());

      transaction.oncomplete = () => {
        db.close();
        alert(`Notebook ${notebook.title} successfully written to browser's indexedDB.`);
      };
    };

    open.onerror = () => {
      alert(`Error opening DB. Notebook ${notebook.title} not saved to browser's indexedDB.`);
    };
  }

  private removeExt(filename: string): string {
    return filename.slice(0, filename.lastIndexOf('.ipynb'));
  }

  async onOpenFromFileClick(): Promise<void> {
    if("showOpenFilePicker" in window){
      const [fileHandle] = await window.showOpenFilePicker({multipel: false});
      const file: File = await fileHandle.getFile();
      const contents = await file.text();
      const nb = this.qs('notebook-el') as NotebookElement;
      const object = JSON.parse(contents);
      nb.fromJSON(object, true);
      nb.title = this.removeExt(file.name) ?? object.metadata.title;
    }else{
      const input = document.createElement('input');
      input.type = 'file';
      input.click();
      input.onchange = async () => {
        if(input.files.length){
          const file = input.files[0];
          const contents = await file.text();
          const object = JSON.parse(contents);
          const nb = this.qs('notebook-el') as NotebookElement;
          nb.fromJSON(object, true);
          nb.title = this.removeExt(file.name) ?? object.metadata.title;
        }
      }
    }
  }

  async onOpenFromURLClick(): Promise<void> {
    let previous = localStorage.getItem('notebook.previousURL') ?? '';
    const url = prompt("URL:", previous);
    if(!url) return;
    const response = await fetch(url);
    if(response.ok){
      localStorage.setItem('notebook.previousURL', url);
      const nb = this.qs('notebook-el') as NotebookElement;
      const contents = await response.text();
      nb.fromString(contents, true);
    }else{
      alert(`Error loading Notebook from ${url}: ${response.status} ${response.statusText}`);
    }
  }

  onOpenFromBrowserClick(): void {
    const notebook = this.qs('notebook-el') as NotebookElement;
    let previous = localStorage.getItem('notebook.lastTitle') ?? '';
    const title = prompt("title", previous);
    if(!title) return;
    localStorage.setItem('notebook.lastTitle', title);
    
    const open = indexedDB.open('notebook.notebookDB', 1);
    open.onupgradeneeded = () => {
      alert(`No DB "notebook.notebookDB" present. Thus no such notebook could be found.`);
    };
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction("notebookStore", "readonly");
      const store = transaction.objectStore("notebookStore");
      const index =  store.index("notebookTitleIndex");

      const getNotebook = index.get([title]);

      getNotebook.onsuccess = () => {
        const json = getNotebook.result;
        notebook.fromJSON(json, true);
      }

      getNotebook.onerror = () => {
        alert(`Error reading ${title} from browser's indexedDB.`);
      }

      transaction.oncomplete = () => db.close();
    }
  }
}
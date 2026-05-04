import { CellTypeSelector } from "./notebook/cell-type-selector/cell-type-selector";
import { MarkdownCellElement } from "./notebook/markdown-cell/markdown-cell";
import { NotebookElement } from "./notebook/notebook";
import { CellActionsElement } from "./notebook/cell-actions/cell-actions";
import { JavascriptCellElement } from "./notebook/javascript-cell/javascript-cell";
import { TypescriptCellElement } from "./notebook/typescript-cell/typescript-cell";
import { NotebookActionsElement } from "./notebook/notebook-actions/notebook-actions";
import { NotebookAppElement } from "./notebook-app";

window.customElements.define("markdown-cell", MarkdownCellElement);
window.customElements.define("notebook-el", NotebookElement);
window.customElements.define("cell-type", CellTypeSelector)
window.customElements.define("cell-actions", CellActionsElement);
window.customElements.define("javascript-cell", JavascriptCellElement);
window.customElements.define('typescript-cell', TypescriptCellElement);
window.customElements.define('notebook-actions', NotebookActionsElement);
window.customElements.define('notebook-app', NotebookAppElement);

if("serviceWorker" in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(new URL('./service-worker.js', import.meta.url), {
      scope: "/notebook/",
      type: "module"
    })
    .catch(error => {
      console.error(`Service Worker registration failed: ${error}`);
    });

    navigator.serviceWorker.ready
    .then(registration => {
      navigator.storage.persist();
    })
    .catch(error => {
      console.error(`Service Worker failed to become ready: ${error}`);
    });
  });
}
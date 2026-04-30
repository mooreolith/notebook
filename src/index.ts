import { CellTypeSelector } from "./cell-type-selector";
import { MarkdownCellElement } from "./markdown-cell";
import { NotebookElement } from "./notebook";
import { CellActionsElement } from "./cell-actions";
import { JavascriptCellElement } from "./javascript-cell";
import { TypescriptCellElement } from "./typescript-cell";
import { NotebookActionsElement } from "./notebook-actions";
import { NotebookAppElement } from "./notebook-app";

window.customElements.define("markdown-cell", MarkdownCellElement);
window.customElements.define("notebook-el", NotebookElement);
window.customElements.define("cell-type", CellTypeSelector)
window.customElements.define("cell-actions", CellActionsElement);
window.customElements.define("javascript-cell", JavascriptCellElement);
window.customElements.define('typescript-cell', TypescriptCellElement);
window.customElements.define('notebook-actions', NotebookActionsElement);
window.customElements.define('notebook-app', NotebookAppElement);
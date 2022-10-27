import { History } from 'notebookEditor/extension/history/History';
import { BasicKeymap } from 'notebookEditor/extension/basicKeymap/BasicKeymap';
import { Extension } from 'notebookEditor/extension/type';

// ********************************************************************************
// the Extensions whose Plugins get added to the View when it gets mounted
// (SEE: Editor.ts)
export const editorExtensions: Extension[] = [
  BasicKeymap,
  History,
];

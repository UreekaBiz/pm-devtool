import { History } from 'notebookEditor/plugin/history/History';
import { BasicKeymap } from 'notebookEditor/plugin/basicKeymap/BasicKeymap';
import { Extension } from 'notebookEditor/plugin/type';

// ********************************************************************************
// the Extensions whose Plugins get added to the View when it gets mounted
// (SEE: Editor.ts)
export const editorExtensions: Extension[] = [
  BasicKeymap,
  History,
];

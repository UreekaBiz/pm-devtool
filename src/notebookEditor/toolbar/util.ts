import { SelectionDepth } from 'common';

import { Editor } from 'notebookEditor/editor';

// ********************************************************************************
/**
 * default behavior for whether or not a ToolItem
 * should be shown in the Toolbar
 */
 export const shouldShowToolItem = (editor: Editor, depth: SelectionDepth) =>
  depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/;


import { SelectionDepth } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';

import { Toolbar } from './type';

// ********************************************************************************
/**
 * default behavior for whether or not a ToolItem
 * should be shown in the Toolbar
 */
 export const shouldShowToolItem = (editor: Editor, depth: SelectionDepth) =>
  depth === undefined || editor.view.state.selection.$anchor.depth === depth/*direct parent*/;


/**
 * decide whether the Toolbar or the ToolbarBreadcrumbItem should be shown for a
 * given Node by checking the properties of its Toolbar object
 */
export const shouldShowToolbarOrBreadcrumb = (editor: Editor, toolbar: Toolbar, depth: SelectionDepth): boolean => {
  // if at least one Tool in the ToolCollection does not have the shouldShow
  // property defined, or if at least one of the Tools that have it should be
  // shown, show the Toolbar or BreadcrumbItem
  const shouldShow = toolbar.toolsCollections.some(toolCollection =>
    toolCollection.some(tool => !tool.shouldShow || (tool.shouldShow(editor, depth))));

  return shouldShow;
};

import { useEffect } from 'react';

import { isNodeSelection, setNodeSelectionCommand } from 'common';

import { useValidatedEditor } from 'notebookEditor/hook/useValidatedEditor';
import { isValidHTMLElement } from 'notebookEditor/extension/util/parse';
import { TOOL_ITEM_DATA_TYPE } from 'notebookEditor/toolbar/type';

// ********************************************************************************
// handles Editor-related logic that requires the use of hooks (and hence it must
// be a component)
export const EditorUserInteractions = () => {
  const editor = useValidatedEditor();

 // == Effect ====================================================================
  // Handles shortcuts with the editor that requires interaction with a React state.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if(!editor) return/*nothing to do*/;

      if(event.code === 'Period' && event.altKey && event.metaKey) {
        // Selects the first item in the toolbar
        event.preventDefault();

        const toolItems = [...document.querySelectorAll(`[datatype=${TOOL_ITEM_DATA_TYPE}]`)];
        if(toolItems.length < 1) return/*nothing to do*/;

        const firstToolItem = toolItems[0];
        if(!isValidHTMLElement(firstToolItem)) { console.warn('toolItem is not a valid HTML Element'); return/*do nothing*/;}
        /* else -- valid html element */

        firstToolItem.focus();
      }

      if(event.code === 'Comma' && event.altKey && event.metaKey) {
        event.preventDefault();

        // focus the last focused item. If none select the Editor
        if(isNodeSelection(editor.state.selection)) {
          setNodeSelectionCommand(editor.state.selection.anchor)(editor.state, editor.view.dispatch);
          editor.view.focus();
        } else {
          editor.view.focus();
        }
      } /* else -- not selecting Editor */
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editor]);


  // == UI ========================================================================
  if(!editor) return null/*nothing to do*/;

  return null/*currently nothing*/;
};

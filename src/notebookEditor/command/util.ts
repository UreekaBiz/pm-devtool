import { Command } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { SelectionDepth } from 'common';

import { CoreEditor } from 'notebookEditor/editor';

// ********************************************************************************
// == Wrapper =====================================================================
/**
 * Executes the given {@link Command} with the current {@link CoreEditor} props.
 * Used by Keyboard Shortcuts
 */
export const shortcutCommandWrapper = (editor: CoreEditor, command: Command) => {
  const { state, view, dispatch } = getCommandPropsFromEditor(editor);
  return focusViewAndReturn(command(state, dispatch), view);
};

/**
 * Executes the given {@link Command} with the current {@link CoreEditor} props.
 * Used by ToolItems
 */
 export const toolItemCommandWrapper = (editor: CoreEditor, depth: SelectionDepth, command: Command) => {
  const { state, view, dispatch } = getCommandPropsFromEditor(editor);
  return focusViewAndReturn(command(state, dispatch), view);
};

/** Returns the required props to execute a {@link Command} from a given {@link CoreEditor} */
const getCommandPropsFromEditor = (editor: CoreEditor) => ({
  state: editor.view.state,
  view: editor.view,
  dispatch: editor.view.dispatch,
});

/** Focuses the {@link EditorView} and returns the result from the executed {@link Command} */
const focusViewAndReturn = (commandResult: boolean, view: EditorView) => {
  if(commandResult) {
    setTimeout(() => view.focus()/*immediately after the View updates*/);
  } /* else -- Command was not executed, do not focus the View */

  return commandResult;
};

// == Apply =======================================================================
/**
 * apply the first Command whose effects are valid from the given array of
 * Commands. These Commands may be ProseMirror Commands or custom Commands
 */
export const applyFirstValidCommand = (editor: CoreEditor, commands: Command[]): boolean => {
  for(let i = 0; i < commands.length; i++) {
    if(commands[i](editor.view.state, editor.view.dispatch, editor.view)) {
      return true/*Command applied*/;
    }
  }
  return false/*no Command was valid*/;
};

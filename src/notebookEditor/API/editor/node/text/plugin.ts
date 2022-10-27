import { keymap } from 'prosemirror-keymap';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { Editor } from '../../Editor';
import { insertTabCommand } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const textPlugin = (editor: Editor) => keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, insertTabCommand) });

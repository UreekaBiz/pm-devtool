import { keymap } from 'prosemirror-keymap';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { Editor } from '../../Editor';
import { setParagraphCommand } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const paragraphPlugin = (editor: Editor) => keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) });
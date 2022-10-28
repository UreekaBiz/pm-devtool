import { keymap } from 'prosemirror-keymap';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { Editor } from '../../../editor/Editor';
import { setParagraphCommand } from './command';

// ********************************************************************************
// == Plugin ======================================================================
export const paragraphPlugin = (editor: Editor) => keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) });

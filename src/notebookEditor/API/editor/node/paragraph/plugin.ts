import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { keymap } from 'prosemirror-keymap';

import { Editor } from '../../Editor';

import { setParagraphCommand } from './command';

// ********************************************************************************
export const paragraphPlugin = (editor: Editor) => keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) });

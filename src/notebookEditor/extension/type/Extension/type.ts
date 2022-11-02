import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { Editor } from 'notebookEditor/editor';
import { NodeViewStorage, DialogStorage } from 'notebookEditor/model';
import { InputRule } from 'notebookEditor/plugin/inputRule';
import { PasteRule } from 'notebookEditor/plugin/pasteRule';

// == Constant ====================================================================
/** priority used by Extensions whose order of execution is not relevant*/
export const DEFAULT_EXTENSION_PRIORITY = 100;

// == Type ========================================================================
/** the type of the Storage used by the Extension */
export type ExtensionStorageType = NodeViewStorage<any> | DialogStorage | undefined/*Extension does not need storage*/;

// == Interface ===================================================================
export interface ExtensionDefinition {
  name: string;
  priority: number;

  /** the Storage used by the Extension */
  addStorage?: () => ExtensionStorageType;

  /** the InputRules added by the Extension */
  inputRules: (editor: Editor) => InputRule[];

  /** the PasteRules added by the Extension */
  pasteRules: (editor: Editor) => PasteRule[];

  /** the ProseMirrorPlugins added by the Extension */
  addProseMirrorPlugins: (editor: Editor, extensionStorage: ExtensionStorageType) => ProseMirrorPlugin[];
}

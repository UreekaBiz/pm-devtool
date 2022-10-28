import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { Editor } from 'notebookEditor/editor';

// ********************************************************************************
// == Constant ====================================================================
export const DEFAULT_EXTENSION_PRIORITY = 100;

// == Interface ===================================================================
export interface ExtensionProps {
  readonly name: string;
  readonly addProseMirrorPlugins: (editor: Editor) => ProseMirrorPlugin[];
  readonly priority: number;
}

// == Class =======================================================================
export class Extension {
  constructor(public readonly props: ExtensionProps) {
    // nothing additional
  }
}

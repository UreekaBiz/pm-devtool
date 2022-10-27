import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { ExtensionName } from 'notebookEditor/model/type';

// ********************************************************************************
/**
 * abstraction to encapsulate ProseMirror functionality that gets
 * added to the Editor on creation (SEE: Editor.ts)
 */
export type Extension = {
  name: ExtensionName;

  // the ProseMirror plugins that get added by this Extension
  proseMirrorPlugins: ProseMirrorPlugin[];
};

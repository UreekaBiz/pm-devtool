import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { Editor } from 'notebookEditor/editor';

// ********************************************************************************
// == Constant ====================================================================
export const DEFAULT_EXTENSION_PRIORITY = 100;

// == Interface ===================================================================
export interface ExtensionProps {
  readonly name: string;

  /** the ProseMirror Plugins added by this Extension */
  readonly addProseMirrorPlugins: (editor: Editor) => ProseMirrorPlugin[];

  /**
   * defines the order in which the Extension's Plugins get executed
   * a higher priority means the Plugins of the Extension get executed
   * those of Extensions with lower priority
   */
  readonly priority: number;
}

// == Class =======================================================================
export class Extension {
  constructor(public readonly props: ExtensionProps) {/*nothing additional*/}
}

import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { Editor } from 'notebookEditor/editor';
import { DialogStorage, NodeViewStorage } from 'notebookEditor/model';
import { InputRule } from 'notebookEditor/plugin/inputRule';

// ********************************************************************************
// == Constant ====================================================================
export const DEFAULT_EXTENSION_PRIORITY = 100;

// == Type ========================================================================
export type DefaultAttributeType = string | number | boolean | string[] | undefined;
export type ParseHTMLAttributeType = (element: HTMLElement) => string | string[] | boolean | number | null;

// == Interface ===================================================================
/** defines how the attributes of an extension's spec should look when included  */
export interface AttributeSpecWithParseHTML {
  default: DefaultAttributeType;
  parseHTML: ParseHTMLAttributeType;
}

export interface ExtensionProps {
  readonly name: string;

  /**
   * defines the order in which the Extension's Plugins get executed
   * a higher priority means the Plugins of the Extension get executed
   * those of Extensions with lower priority
   */
  readonly priority: number;

  /**
   * since only a single InputRule Plugin may be present on the
   * {@link Editor} at a time, if an Extension must add InputRules
   * it can do so through this method
   */
  readonly inputRules: (editor: Editor) => InputRule[];

  /** function to add the ProseMirror Plugins required by this Extension */
  readonly addProseMirrorPlugins: (editor: Editor) => ProseMirrorPlugin[];

  /** the Storage used by this Extension */
  readonly storage?: NodeViewStorage<any> | DialogStorage | undefined/*Extension does not need storage*/;
}

// == Class =======================================================================
export class Extension {
  constructor(public readonly props: ExtensionProps) {/*nothing additional*/}
}

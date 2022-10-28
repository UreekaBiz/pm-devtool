import { Plugin as ProseMirrorPlugin } from "prosemirror-state";

// ********************************************************************************
// == Constant ====================================================================
const DEFAULT_EXTENSION_PRIORITY = 100;

// == Interface ===================================================================
export interface ExtensionProps {
  readonly name: string;
  readonly proseMirrorPlugins: ProseMirrorPlugin[];
  readonly priority: number;
}

// == Class =======================================================================
export class Extension {
  constructor(public readonly props: ExtensionProps) {
    // nothing additional
  }

  public static create({ name, proseMirrorPlugins = [/*default empty*/], priority = DEFAULT_EXTENSION_PRIORITY }: ExtensionProps) {
    return new Extension({ name, proseMirrorPlugins, priority });
  }
}

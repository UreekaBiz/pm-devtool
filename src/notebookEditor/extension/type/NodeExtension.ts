import { NodeSpec } from 'prosemirror-model';

import { AttributeSpecWithParseHTML, Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Interface ===================================================================
export interface NodeExtensionProps extends ExtensionProps {
  readonly nodeSpec: Exclude<NodeSpec, 'attrs'> & { attrs: { [name: string]: AttributeSpecWithParseHTML; }; };
}

// == Class =======================================================================
export class NodeExtension extends Extension {
  constructor(public readonly props: NodeExtensionProps) {
    super(props);

    // nothing additional
  }
}

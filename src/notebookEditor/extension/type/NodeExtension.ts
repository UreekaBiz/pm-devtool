import { NodeSpec } from 'prosemirror-model';

import { AttributeSpecWithParseHTML, Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Type ========================================================================
export type NodeExtensionAttributes<T> = Record<keyof T, AttributeSpecWithParseHTML>;
export type NodeExtensionAttributesType = { attrs: NodeExtensionAttributes<any/*defined by the Extension*/>;  };

// == Interface ===================================================================
export interface NodeExtensionProps extends ExtensionProps {
  readonly nodeSpec: Exclude<NodeSpec, 'attrs'> & NodeExtensionAttributesType;
}

// == Class =======================================================================
export class NodeExtension extends Extension {
  constructor(public readonly props: NodeExtensionProps) {
    super(props);

    // nothing additional
  }
}

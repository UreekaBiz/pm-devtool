import { NodeSpec } from 'prosemirror-model';

import { Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Interface ===================================================================
export interface NodeExtensionProps extends ExtensionProps {
  readonly nodeSpec: NodeSpec;
}

// == Class =======================================================================
export class NodeExtension extends Extension {
  constructor(public readonly props: NodeExtensionProps) {
    super(props);

    // nothing additional
  }
}

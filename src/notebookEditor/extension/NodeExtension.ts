import { NodeSpec } from 'prosemirror-model';

import { Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Interface ===================================================================
export interface NodeExtensionProps extends ExtensionProps {
  readonly spec: NodeSpec;
}

// == Class =======================================================================
export class NodeExtension extends Extension {
  constructor(public readonly props: NodeExtensionProps) {
    super(props);
  }
}

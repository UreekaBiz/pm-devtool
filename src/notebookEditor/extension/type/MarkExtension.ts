import { MarkSpec } from 'prosemirror-model';

import { Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Interface ===================================================================
export interface MarkExtensionProps extends ExtensionProps {
  readonly markSpec: MarkSpec;
}

// == Class =======================================================================
export class MarkExtension extends Extension {
  constructor(public readonly props: MarkExtensionProps) {
    super(props);

    // nothing additional
  }
}

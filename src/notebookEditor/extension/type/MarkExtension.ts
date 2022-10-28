import { MarkSpec } from 'prosemirror-model';

import { AttributeSpecWithParseHTML, Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Interface ===================================================================
export interface MarkExtensionProps extends ExtensionProps {
  readonly nodeSpec: Exclude<MarkSpec, 'attrs'> & { attrs: { [name: string]: AttributeSpecWithParseHTML; }; };
}

// == Class =======================================================================
export class MarkExtension extends Extension {
  constructor(public readonly props: MarkExtensionProps) {
    super(props);

    // nothing additional
  }
}

import { MarkSpec } from 'prosemirror-model';

import { AttributeSpecWithParseHTML, Extension, ExtensionProps } from './Extension';

// ********************************************************************************
// == Type ========================================================================
export type MarkExtensionAttributes<T> = Record<keyof T, AttributeSpecWithParseHTML>;
export type MarkExtensionAttributesType = { attrs: MarkExtensionAttributes<any/*defined by the Extension*/>;  };

// == Interface ===================================================================
export interface MarkExtensionProps extends ExtensionProps {
  readonly markSpec: Exclude<MarkSpec, 'attrs'> & MarkExtensionAttributesType;
}

// == Class =======================================================================
export class MarkExtension extends Extension {
  constructor(public readonly props: MarkExtensionProps) {
    super(props);

    // nothing additional
  }
}

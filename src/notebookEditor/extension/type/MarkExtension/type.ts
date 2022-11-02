import { DOMOutputSpec, Mark as ProseMirrorMark, MarkSpec, ParseRule } from 'prosemirror-model';

import { AttributeSpecWithParseHTML } from 'notebookEditor/extension/util';

import { ExtensionDefinition, ExtensionStorageType } from '../Extension';

// ********************************************************************************
// == Type ========================================================================
/**
 * type of the Attributes used by a MarkExtension, which defines how they
 * should be parsed from a {@link HTMLElement}
 */
export type MarkExtensionAttributes<T> = Record<keyof T, AttributeSpecWithParseHTML>;

/** type of the Attributes Object used by a MarkExtension */
export type MarkExtensionAttributesType = { attrs: MarkExtensionAttributes<any/*defined by the Extension*/>;  };

/** type of the MarkSpec used by a MarkExtension */
export type MarkExtensionMarkSpec = Exclude<MarkSpec, 'attrs'> & MarkExtensionAttributesType;

// == Interface ===================================================================
export interface MarkExtensionDefinition extends ExtensionDefinition {
  /** define the Attributes used by the Node this NodeExtension adds */
  defineMarkAttributes: (extensionStorage: ExtensionStorageType | undefined/*Extension has no storage*/) => MarkExtensionAttributes<any/*not known*/>;

  /**
   * the {@link MarkSpec} of the Node added by this Extension, without the Attrs object,
   * since the parse functions must have access to the Storage of the Extension
   */
  partialMarkSpec: Exclude<MarkSpec, 'attrs'>;

  /** define how the Node should be parsed and rendered from the DOM */
  defineDOMBehavior: (extensionStorage: ExtensionStorageType | undefined/*Extension has no storage*/) => ({
    parseDOM?: ParseRule[];
    toDOM?: ((mark: ProseMirrorMark, inline: boolean) => DOMOutputSpec);
  });
}

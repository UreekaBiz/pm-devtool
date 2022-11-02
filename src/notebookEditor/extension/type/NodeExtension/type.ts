import { DOMOutputSpec, Node as ProseMirrorNode, NodeSpec, ParseRule } from 'prosemirror-model';

import { AttributeSpecWithParseHTML } from 'notebookEditor/extension/util';

import { ExtensionDefinition, ExtensionStorageType } from '../Extension';

// ********************************************************************************
// == Type ========================================================================
/**
 * type of the Attributes used by a NodeExtension, which defines how they
 * should be parsed from a {@link HTMLElement}
 */
export type NodeExtensionAttributes<T> = Record<keyof T, AttributeSpecWithParseHTML>;

/** type of the Attributes Object used by a NodeExtension */
export type NodeExtensionAttributesType = { attrs: NodeExtensionAttributes<any/*defined by the Extension*/>;  };

/** type of the NodeSpec used by a NodeExtension */
export type NodeExtensionNodeSpec = Exclude<NodeSpec, 'attrs'> & NodeExtensionAttributesType;

// == Interface ===================================================================
export interface NodeExtensionDefinition extends ExtensionDefinition {
  /** define the Attributes used by the Node this NodeExtension adds */
  defineNodeAttributes: (extensionStorage: ExtensionStorageType | undefined/*Extension has no storage*/) => NodeExtensionAttributes<any/*not known*/>;

  /**
   * the {@link NodeSpec} of the Node added by this Extension, without the Attrs object,
   * since, the parse functions must have access to the Storage of the Extension
   */
  partialNodeSpec: Exclude<NodeSpec, 'attrs' | 'parseDOM' | 'toDOM'>;

  /** define how the Node should be parsed and rendered from the DOM */
  defineDOMBehavior: (extensionStorage: ExtensionStorageType | undefined/*Extension has no storage*/) => ({
    parseDOM?: ParseRule[];
    toDOM?: ((node: ProseMirrorNode) => DOMOutputSpec);
  });
}

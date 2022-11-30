import { Mark, Node as ProseMirrorNode, NodeSpec, NodeType } from 'prosemirror-model';

import { AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: This values must have matching types the ones defined in the Extension.
const ListItemAttributeSpec = {/*currently no attrs*/};
export type ListItemAttributes = AttributesTypeFromNodeSpecAttributes<typeof ListItemAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const ListItemNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeGroup.BLOCK}{1}`/*only one block per ListItem*/,

  /**
   * NOTE: since Lists are the Nodes with the 'defining' property in their spec,
   *       they will be the ones that ensure their content gets pasted correctly
   *       and hence ListItems themselves can be dropped. This is why defining must
   *       be set to false
   */
  defining: false/*(SEE: NOTE above)*/,
  draggable: false/*do not allow dragging*/,

  /**
   * NOTE: explicitly not a Block since ListItems should not be able to contain
   *       other ListItems
   */
  group: `${NodeGroup.LIST}`,

  // .. Attribute .................................................................
  attrs: ListItemAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const ListItemNodeRendererSpec: NodeRendererSpec<ListItemAttributes> = {
  tag: 'li',

  // NOTE: these attributes are used by the Marker of the li inside the ListItem
  //       to know how to display it. It only affects ListItems inside an
  //       OrderedList. (SEE: index.css)
  attributes: {/*use the default renderer on all attributes*/},
};

// == Type ========================================================================
// -- Node Type -------------------------------------------------------------------
// NOTE: this is the only way since PM does not provide a way to specify the type
//       of the attributes
export type ListItemNodeType = ProseMirrorNode & { attrs: ListItemAttributes; };
export const isListItemNodeType = (type: NodeType) => type.name === NodeName.LIST_ITEM;
export const isListItemNode = (node: ProseMirrorNode): node is ListItemNodeType => node.type.name === NodeName.LIST_ITEM;

export const getListItemNodeType = (schema: NotebookSchemaType) => schema.nodes[NodeName.LIST_ITEM];
export const createListItemNode = (schema: NotebookSchemaType, attributes?: Partial<ListItemAttributes>, content?: ProseMirrorNodeContent, marks?: Mark[]) =>
  getListItemNodeType(schema).create(attributes, content, marks);

// -- JSON Node Type --------------------------------------------------------------
export type ListItemJSONNodeType = JSONNode<ListItemAttributes> & { type: NodeName.LIST_ITEM; };
export const isListItemJSONNode = (node: JSONNode): node is ListItemJSONNodeType => node.type === NodeName.LIST_ITEM;

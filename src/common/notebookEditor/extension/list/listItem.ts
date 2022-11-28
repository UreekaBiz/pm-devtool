import { Mark, Node as ProseMirrorNode, NodeSpec, NodeType } from 'prosemirror-model';

import { noNodeOrMarkSpecAttributeDefaultValue, AttributeType, AttributesTypeFromNodeSpecAttributes } from '../../attribute';
import { createNodeDataAttribute, NodeRendererSpec } from '../../htmlRenderer/type';
import { JSONNode, NodeGroup, NodeName, ProseMirrorNodeContent } from '../../node';
import { NotebookSchemaType } from '../../schema';

// ********************************************************************************
// == Attribute ===================================================================
// NOTE: This values must have matching types the ones defined in the Extension.
const ListItemAttributeSpec = {
  // NOTE: these attributes only have influence on ListItems inside OrderedLists
  [AttributeType.ListStyleType]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
  [AttributeType.Separator]: noNodeOrMarkSpecAttributeDefaultValue<string>(),
};
export type ListItemAttributes = AttributesTypeFromNodeSpecAttributes<typeof ListItemAttributeSpec>

// == Spec ========================================================================
// -- Node Spec -------------------------------------------------------------------
export const ListItemNodeSpec: Readonly<NodeSpec> = {
  // .. Definition ................................................................
  content: `${NodeGroup.BLOCK}*`,
  /**
   * NOTE: since Lists are the Nodes with the 'defining' property in their spec,
   *       they will be the ones that ensure their content gets pasted correctly
   *       and hence ListItems themselves can be dropped. This is why defining must
   *       be set to false
   */
  defining: false/*(SEE: NOTE above)*/,
  draggable: false/*do not allow dragging*/,
  group: `${NodeGroup.BLOCK} ${NodeGroup.LIST}`,

  // .. Attribute .................................................................
  attrs: ListItemAttributeSpec,
};

// -- Render Spec -----------------------------------------------------------------
export const ListItemNodeRendererSpec: NodeRendererSpec<ListItemAttributes> = {
  tag: 'li',

  // NOTE: these attributes are used by the Marker of the li inside the ListItem
  //       to know how to display it. It only affects ListItems inside an
  //       OrderedList. (SEE: index.css)
  attributes: {
    [AttributeType.Separator]: (attributes) => ({
      [DATA_LIST_ITEM_SEPARATOR]: `${attributes[AttributeType.Separator]}`,
    }),

    [AttributeType.ListStyleType]: (attributes) => ({
      [DATA_LIST_ITEM_LIST_STYLE]: attributes[AttributeType.ListStyleType],

      // NOTE: must be a variable so that it becomes valid inside the CSS
      //       counter variable (SEE: index.css)
      style: `--${AttributeType.ListStyleType}: ${attributes[AttributeType.ListStyleType] ?? ListStyle.DECIMAL/*default*/};`,
    }),
  },
};

// == Type ========================================================================
export enum ListStyle {
  DECIMAL = 'decimal',
  LOWER_ALPHA = 'lower-alpha',
  LOWER_ROMAN = 'lower-roman'
}
export const isListStyle = (style: any): style is ListStyle => Object.values(ListStyle).includes(style);

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

// == Constant ====================================================================
export const LIST_ITEM_DEFAULT_SEPARATOR = '.'/*default*/;

// NOTE: these are used by the parser for ListItems to ensure correct
//       copy-paste behavior (SEE: ListItem.ts)
export const DATA_LIST_ITEM_LIST_STYLE = createNodeDataAttribute(AttributeType.ListStyleType);
export const DATA_LIST_ITEM_SEPARATOR = createNodeDataAttribute(AttributeType.Separator);

import { Schema } from 'prosemirror-model';

import { AttributeType } from '../../attribute';
import { ORDERED_LIST_DEFAULT_START } from '../../../notebookEditor/extension/list/orderedList';
import { ListStyle, LIST_ITEM_DEFAULT_SEPARATOR } from '../../..//notebookEditor/extension/list/listItem';
import { NodeSpecs, SchemaV1 } from '../../../notebookEditor/schema';
import { NodeName } from '../../node/type';
import { getNotebookSchemaNodeBuilders  } from './testUtil';

// == Constant ====================================================================
// ensure that List Nodes have defined attributes and content expressions
// without being in web so that tests match the real scenario
// (SEE: getNotebookSchemaWithBuildersObj)
const modifiedSchemaNodeSpec = {
  ...NodeSpecs,
  [NodeName.BULLET_LIST]: {
    ...SchemaV1.nodes[NodeName.BULLET_LIST].spec,
    attrs: { [AttributeType.MarginLeft]: { default: '1.5em'/*NOTE: must match theme*/ } },
  },
  [NodeName.ORDERED_LIST]: {
    ...SchemaV1.nodes[NodeName.ORDERED_LIST].spec,
    attrs: {
      [AttributeType.StartValue]: { default: ORDERED_LIST_DEFAULT_START },
      [AttributeType.MarginLeft]: { default: '1.5em'/*NOTE: must match theme*/ },
    },
  },
  [NodeName.LIST_ITEM]: {
    ...SchemaV1.nodes[NodeName.LIST_ITEM].spec,
    attrs: {
      [AttributeType.ListStyleType]: { default: ListStyle.DECIMAL },
      [AttributeType.Separator]: { default: LIST_ITEM_DEFAULT_SEPARATOR },
    },
  },
};
const schemaWithListAttrs = new Schema({
  topNode: SchemaV1.topNodeType.name,
  marks: SchemaV1.spec.marks,
  nodes: modifiedSchemaNodeSpec,
});

export const {
  // NOTE: contentMatch objects used by PM make comparison
  //       by object type instead of by properties (e.g. names of Nodes/Marks)
  //       hence, these doc and paragraph builders
  //       must be used when testing Table Commands
  [NodeName.BLOCKQUOTE]: listBlockquoteBuilder,
  [NodeName.BULLET_LIST]: defaultBulletListBuilder,
  [NodeName.DOC]: listDocBuilder,
  [NodeName.LIST_ITEM]: defaultListItemBuilder,
  [NodeName.ORDERED_LIST]: defaultOrderedListBuilder,
  [NodeName.PARAGRAPH]: listParagraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.DOC, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH], schemaWithListAttrs);
import { Extension } from '@tiptap/core';

import { getNodesRemovedByTransaction, AttributeType, NodeName } from 'common';

import { ExtensionName, ExtensionPriority, NoOptions, NoStorage } from 'notebookEditor/model/type';

// ********************************************************************************
// the set of Node 'types' whose nodeViews are to be checked for and removed
// when they no longer exist (the inclusion set). Like other extensions, the names
// of nodes that require this functionality must be added here
const nodesWithNodeView = new Set<NodeName>([/*currently nothing*/]);

// == Extension ===================================================================
export const NodeViewRemoval = Extension.create<NoOptions, NoStorage>({
  name: ExtensionName.NODEVIEW_REMOVAL/*Expected and guaranteed to be unique*/,
  priority: ExtensionPriority.NODEVIEW_REMOVAL,

  // -- Transaction ---------------------------------------------------------------
  onTransaction({ transaction }) {
    const removedNodePositions = getNodesRemovedByTransaction(transaction, nodesWithNodeView);
    removedNodePositions.forEach(removedObj => this.editor.storage[removedObj.node.type.name].removeNodeView(removedObj.node.attrs[AttributeType.Id]));
  },
});

import { Node as ProsemirrorNode, NodeSpec } from 'prosemirror-model';

import { AttributeType, NodeName } from 'common';

import { isNodeViewStorage } from 'notebookEditor/model';
import { Editor } from 'notebookEditor/editor/Editor';

import { Extension } from '../Extension/Extension';
import { NodeExtension } from './NodeExtension';

// == NodeExtension ===============================================================
// -- Schema ----------------------------------------------------------------------
/**
 * returns the name of the {@link NodeSpec} that contains the 'topNode'
 * property, which indicates that it is the root of the Document
 */
 export const getTopNode = (extensions: Extension[]) => {
  const topNodeName = extensions.find(extension => isNodeExtension(extension) && extension.nodeSpec.topNode)?.name;
  if(!topNodeName) throw new Error('Cannot create a Document without a topNode');

  return topNodeName;
};

/** check whether the given {@link Extension} is a {@link NodeExtension} */
export const isNodeExtension = (extension: Extension): extension is NodeExtension => 'nodeSpec' in extension;

// -- Spec ------------------------------------------------------------------------
/**
 * return an array containing only {@link NodeExtension}s given an array of
 * {@link Extension}s
 */
 export const getNodeSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: NodeSpec; }>((nodeExtensions, currentExtension) => {
  if(isNodeExtension(currentExtension)) {
    nodeExtensions[currentExtension.name] = currentExtension.nodeSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

// -- View ------------------------------------------------------------------------
// REF: https://stackoverflow.com/questions/41017287/cannot-use-new-with-expression-typescript
// allow type of controllers that extend AbstractNodeController to be used
interface ConstructableController<ControllerType> {
  new(...args: any/*do not restrict Controller requirements*/) : ControllerType;
}
export const defineNodeViewBehavior = <Controller>(editor: Editor, receivedNode: ProsemirrorNode, desiredNodeName: NodeName, getPos: () => number, nodeValidationFunction: (node: ProsemirrorNode) => boolean, NodeController: ConstructableController<Controller>) => {
  if(!nodeValidationFunction(receivedNode)) throw new Error(`Unexpected Node: (${receivedNode.type.name}) while adding ${desiredNodeName} NodeView.`);

  const id = receivedNode.attrs[AttributeType.Id];
  if(!id) throw new Error(`${desiredNodeName} does not have an Id when it should by contract.`);

  const storage = editor.storage.get(desiredNodeName);
  if(!storage || !(isNodeViewStorage(storage))) throw new Error(`${desiredNodeName} does not have a valid storage when it should by contract.`);

  // use existing NodeView, update it and return it
  const controller = storage.getNodeView(id);
  if(controller) {
    controller.updateProps(getPos);
    return controller;
  } /* else -- controller don't exists */

  // create a new Controller and NodeView
  return new NodeController(editor, receivedNode, storage, getPos);
};

import { NodeSpec } from 'prosemirror-model';

import { Extension } from '../Extension';
import { NodeExtension } from './NodeExtension';

// == NodeExtension ===============================================================
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

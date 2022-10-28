import { MarkSpec, NodeSpec } from 'prosemirror-model';
import { Extension } from './Extension';
import { MarkExtension } from './MarkExtension';
import { NodeExtension } from './NodeExtension';

// ********************************************************************************
// == NodeExtension ===============================================================
/**
 * return an array containing only {@link NodeExtensions} given an array of
 * {@link Extension}s
 */
 export const getNodeSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: NodeSpec; }>((nodeExtensions, currentExtension) => {
  if(isNodeExtension(currentExtension)) {
    nodeExtensions[currentExtension.props.name] = currentExtension.props.nodeSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

/**
 * returns the name of the {@link NodeSpec} that contains the 'topNode'
 * property, which indicates that it is the root of the Document
 */
export const getTopNode = (nodeSpecs: { [name: string]: NodeSpec; }) => {
  const topNodeSpec = Object.values(nodeSpecs).find(nodeSpec => nodeSpec.topNode);
  if(!topNodeSpec) throw new Error('Cannot create a Document without a topNode');

  return topNodeSpec.name;
};

/** check whether the given {@link Extension} is a {@link NodeExtension} */
export const isNodeExtension = (extension: Extension): extension is NodeExtension => 'nodeSpec' in extension.props;

// == MarkExtension ===============================================================
/**
 * return an array containing only {@link NodeExtensions} given an array of
 * {@link Extension}s
 */
 export const getMarkSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: MarkSpec; }>((nodeExtensions, currentExtension) => {
  if(isMarkExtension(currentExtension)) {
    nodeExtensions[currentExtension.props.name] = currentExtension.props.markSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

/** check whether the given {@link Extension} is a {@link MarkExtension} */
export const isMarkExtension = (extension: Extension): extension is MarkExtension => 'markSpec' in extension.props;

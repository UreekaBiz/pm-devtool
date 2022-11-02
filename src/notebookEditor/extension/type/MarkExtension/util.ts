import { MarkSpec } from 'prosemirror-model';

import { Extension } from '../Extension';
import { MarkExtension } from './MarkExtension';

// == MarkExtension ===============================================================
/**
 * return an array containing only {@link MarkExtension}s given an array of
 * {@link Extension}s
 */
 export const getMarkSpecs = (extensions: Extension[]) => extensions.reduce<{ [name: string]: MarkSpec; }>((nodeExtensions, currentExtension) => {
  if(isMarkExtension(currentExtension)) {
    nodeExtensions[currentExtension.name] = currentExtension.markSpec;
  } /* else -- ignore */
  return nodeExtensions;
}, {/*default empty*/});

/** check whether the given {@link Extension} is a {@link MarkExtension} */
export const isMarkExtension = (extension: Extension): extension is MarkExtension => 'markSpec' in extension;


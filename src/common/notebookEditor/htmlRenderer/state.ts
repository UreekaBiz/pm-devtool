import { JSONNode } from '../node/type';

// ********************************************************************************
// == Renderer ====================================================================
// FIXME: Find a better approach to shared this with the notebookEditor itself.
export type RendererState = {/*currently noting*/}

// == Util ========================================================================
// performs a depth-first search of all nodes in order to compute the visual state
// for all the Nodes present in the document.
export const computeState = (doc: JSONNode): RendererState => { return {/*currently nothing*/}; };

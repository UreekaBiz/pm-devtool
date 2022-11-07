import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Command, EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { eq } from 'prosemirror-test-builder';
import ist from "ist";

// ********************************************************************************
// == Constant ====================================================================
// NOTE: These should be used as constants whenever writing tests for sanity, since
//       all commands assume them to exist when writing tests

// strings used to indicate the test tags (to set relevant positions) that are used
// when writing documents for tests.
export const TEST_POSITION_A = '<tpA>';
export const TEST_POSITION_B = '<tpB>';

// == Command =====================================================================
export const applyCommand = (doc: ProseMirrorNodeWithTag, testedCommand: Command, result: ProseMirrorNodeWithTag | null) => {
  // create a state
  let state = createState(doc);

  // apply the tested Command to the state
  testedCommand(state, (tr) => state = state.apply(tr));

  // apply the 'eq' operation comparing the original document to the document
  // of the resulting state, asserting that they are equal
  ist(state.doc, result || doc/*default to comparing with the given Node*/, eq);

  // assert that the selection is the same
  if(result && getNodeTag(result)[TEST_POSITION_A] !== null) {
    ist(state.selection,  selectionFor(result), eq);
  } /* else -- result is invalid, or the result's  */
};

// == Selection ===================================================================
/**
 * return a {@link Selection} for a given {@link ProseMirrorNodeWithTag} based on
 * whether the resolved position of the Node's {@link TEST_POSITION_A} tag parent
 * has inline content or not. If it does not, a {@link NodeSelection}
 * using the resolved testPosA will be returned
 */
const selectionFor = (doc: ProseMirrorNodeWithTag) => {
  const testPosA = getNodeTag(doc)[TEST_POSITION_A];

  if(testPosA !== null) {
    const $resolvedTestPosA = doc.resolve(testPosA);
    if($resolvedTestPosA.parent.inlineContent) {
      const testPosB = getNodeTag(doc)[TEST_POSITION_B];
      return new TextSelection($resolvedTestPosA, testPosB !== null ? doc.resolve(testPosB) : undefined/*pos was not set*/);
    } else {
      return new NodeSelection($resolvedTestPosA);
    }
  } /* else -- Node does not have a testPosA set */

  return Selection.atStart(doc)/*default to returning a Selection at the start of the Document*/;
};

// == Node ========================================================================
// -- State -----------------------------------------------------------------------
/**
 * create a {@link EditorState} using the
 * given {@link ProseMirrorNodeWithTag} as the document
 */
export const createState = (doc: ProseMirrorNodeWithTag) => EditorState.create({ doc, selection: selectionFor(doc) });

// -- Tag -------------------------------------------------------------------------
// REF: https://github.com/prosemirror/prosemirror-test-builder
/**
 * type of a {@link ProseMirrorNode} that also has an object called 'tag', that
 * contains (at least) two keys: {@link TEST_POSITION_A} and
 * {@link TEST_POSITION_B}, which are used to mark positions when writing tests
 */
export type ProseMirrorNodeWithTag = ProseMirrorNode & {
  tag: {
    [TEST_POSITION_A]: number | null/*a tag with this name is not set*/;
    [TEST_POSITION_B]: number | null/*a tag with this name is not set*/;
  };
};

export const validateNodeWithTag = (node: ProseMirrorNode): node is ProseMirrorNodeWithTag => 'tag' in node;

/**
 * returns the Tag object in a {@link ProseMirrorNodeWithTag},
 * used for testing purposes
 */
const getNodeTag = (node: ProseMirrorNodeWithTag): {[name: string]: number | null/*a tag with this name is not set*/; } => {
  return node.tag;
};

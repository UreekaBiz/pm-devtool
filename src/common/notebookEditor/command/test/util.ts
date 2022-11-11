import ist from 'ist';
import { Attrs, Node, Schema } from 'prosemirror-model';
import { Command, EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { eq, builders } from 'prosemirror-test-builder';

import { MarkName } from '../../mark';
import { NodeName } from '../../node';
import { SchemaV1 } from '../../schema';

// ********************************************************************************
// Command-testing utilities used by test files

// == Type ========================================================================
// NOTE: types taken from prosemirror-test-builder since they are not exported
type Tags = { [tag: string]: number; };
type ChildSpec = string | Node | { flat: readonly Node[]; tag: Tags; };
type NodeBuilder = (attrsOrFirstChild?: Attrs | ChildSpec, ...children: ChildSpec[]) => Node;
type MarkBuilder = (attrsOrFirstChild?: Attrs | ChildSpec, ...children: ChildSpec[]) => ChildSpec;

type NotebookSchemaWithBuildersObjType = {
  schema: Schema;
  [nodeOrMarkName: string]: Schema | (NodeBuilder | MarkBuilder);
}

// == Builder =====================================================================
/** the Node and Mark Builders used in a Notebook */
export const getNotebookSchemaWithBuildersObj = (): NotebookSchemaWithBuildersObjType  => {
  const obj = builders(SchemaV1);
  if(!hasBuilders(obj)) throw new Error('Notebook Schema does not have Builders');
  return obj;
};
const hasBuilders = (obj: { schema: Schema; [nodeOrMarkName: string]: any/*cannot specify at this level*/; }): obj is NotebookSchemaWithBuildersObjType => {
  const { schema } = obj;
  const { nodes, marks } = schema;
  return Object.keys(nodes).every(nodeName => typeof obj[nodeName] === 'function') && Object.keys(marks).every(markName => typeof obj[markName] === 'function');
};

/** get specific NodeBuilders */
export const getNotebookSchemaNodeBuilders = (nodeNames: NodeName[]) =>
  Object.entries(getNotebookSchemaWithBuildersObj()).reduce<{ [nodeName: string]: NodeBuilder; }>((acc, [nodeName, builder]) => {
    if(nodeNames.includes(nodeName as NodeName)) {
      acc[nodeName] = builder as NodeBuilder/*by definition*/;
    } /* else -- nodeName was not requested, do not include */
    return acc;
  }, {/*default empty*/});

/** get specific MarkBuilders */
export const getNotebookSchemaMarkBuilders = (markNames: MarkName[]) =>
  Object.entries(getNotebookSchemaWithBuildersObj()).reduce<{ [markName: string]: MarkBuilder; }>((acc, [markName, builder]) => {
    if(markNames.includes(markName as MarkName)) {
      acc[markName] = builder as MarkBuilder/*by definition*/;
    } /* else -- markName was not requested, do not include */
    return acc;
  }, {/*default empty*/});

// == Constant ====================================================================
// NOTE: These should be used as constants whenever writing tests for sanity, since
//       utilities assume them to be used when writing tests

// strings used to indicate the test tags (to set relevant positions) that are used
// when writing documents for tests
export const A = 'A';
export const B = 'B';

// == Command =====================================================================
/**
 * apply the given {@link Command} to the given {@link ProseMirrorNodeWithTag}
 * to test its effects, expecting the given {@link ProseMirrorNodeWithTag} to be
 * the result of the Command
 */
export const applyTestCommand = (doc: ProseMirrorNodeWithTag, testedCommand: Command, result: ProseMirrorNodeWithTag | null) => {
  // create a state
  let state = createState(doc);

  // apply the tested Command to the state
  testedCommand(state, (tr) => state = state.apply(tr));

  // apply the 'eq' operation comparing the original document to the document
  // of the resulting state, asserting that they are equal
  ist(state.doc, result || doc/*default to comparing with the given Node*/, eq);

  // assert that the selection is the same
  if(result && (getNodeTag(result)[A] !== null && getNodeTag(result)[A] !== undefined)) {
    ist(state.selection,  selectionFor(result), eq);
  } /* else -- result is invalid, or the result's  */
};

// == Selection ===================================================================
/**
 * return a {@link Selection} for a given {@link ProseMirrorNodeWithTag} based on
 * whether the resolved position of the Node's {@link A} tag parent
 * has inline content or not. If it does not, a {@link NodeSelection}
 * using the resolved testPosA will be returned
 */
const selectionFor = (doc: ProseMirrorNodeWithTag) => {
  const testPosA = getNodeTag(doc)[A];

  if(testPosA !== null && testPosA !== undefined) {
    const $resolvedTestPosA = doc.resolve(testPosA);
    if($resolvedTestPosA.parent.inlineContent) {
      const testPosB = getNodeTag(doc)[B];
      return new TextSelection($resolvedTestPosA, (testPosB !== null && testPosB !== undefined) ? doc.resolve(testPosB) : undefined/*pos was not set*/);
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
 * type of a {@link Node} that also has an object called 'tag', that
 * contains (at least) two keys: {@link A} and
 * {@link B}, which are used to mark positions when writing tests
 */
export type ProseMirrorNodeWithTag = Node & {
  tag: {
    'A': number | null/*a tag with this name is not set*/;
    'B': number | null/*a tag with this name is not set*/;
  };
};

/**
 * check that the given {@link Node} is either a
 * {@link ProseMirrorNodeWithTag} or specifically null
 */
export const validateNodeWithTag = (node: Node | null): node is ProseMirrorNodeWithTag => node === null || 'tag' in node;

/**
 * returns the Tag object in a {@link ProseMirrorNodeWithTag},
 * used for testing purposes
 */
const getNodeTag = (node: ProseMirrorNodeWithTag): {[name: string]: number | null/*a tag with this name is not set*/; } => {
  return node.tag;
};

// == Test ========================================================================
/**
 * Wrap a test so that the given {@link ProseMirrorNodeWithTag}sa
 * are guaranteed to have the Tag property
 */
export const wrapTest = (startState: Node | null, command: Command, expectedEndState: Node | null) => {
  if(!validateNodeWithTag(startState)) throw new Error('startState is not a ProseMirrorNodeWithTag');
  if(!validateNodeWithTag(expectedEndState)) throw new Error('expectedState is not a ProseMirrorNodeWithTag');

  applyTestCommand(startState, command, expectedEndState);
};


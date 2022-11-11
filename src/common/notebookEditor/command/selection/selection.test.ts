import { getNotebookSchemaNodeBuilders, wrapTest, A, B } from '../testUtil';
import { NodeName } from '../../node/type';
import { deleteSelectionCommand, selectNodeBackwardCommand, selectNodeForwardCommand, selectTextBlockStartOrEndCommand } from './selection';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.DOC, NodeName.HORIZONTAL_RULE, NodeName.PARAGRAPH]);

// == Node ========================================================================
describe('selectNodeBackwardCommand', () => {
  it('does not select the Node before the cut'/*since no Blocks are meant to be selectable in a Notebook*/, () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('a')), blockquoteBuilder(paragraphBuilder(`<${A}>b`)));
    const expectedEndState = startState/*same state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });

  it('does nothing when not at the start of the textblock', () => {
    const startState = docBuilder(paragraphBuilder(`a<${A}>b`));
    const expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });
});

describe('selectNodeForwardCommand', () => {
  // TODO: redefine and handle test once Lists are added
  // it('selects the next Node', () => {
  //   const startState = docBuilder(paragraphBuilder(`foo<${A}>`), unorderedListBuilder(listItemBuilder(paragraphBuilder('bar'), unorderedListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
  //   const expectedEndState = docBuilder(paragraphBuilder(`foo<${A}>`), `<${A}>`, unorderedListBuilder(listItemBuilder(paragraphBuilder('bar'), unorderedListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
  //   wrapTest(startState, selectNodeForwardCommand, expectedEndState);
  // });

  it('does nothing at the end of the document', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`));
    const expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeForwardCommand, expectedEndState);
  });
});

describe('selectTextBlockStartOrEndCommand', () => {
  it('can move the cursor when the Selection is empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`));
    let expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the Selection is not empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`));
    let expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the selection crosses multiple text blocks', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`));
    let expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`), paragraphBuilder('three four'));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`));
    expectedEndState = docBuilder(paragraphBuilder('one two'), paragraphBuilder(`three four<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });
});

// == Delete ======================================================================
describe('deleteSelectionCommand', () => {
  it('deletes part of a Text Node', () => {
    const startState = docBuilder(paragraphBuilder(`f<${A}>o<${B}>o`));
    const expectedEndState = docBuilder(paragraphBuilder('fo'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('can delete across blocks', () => {
    const startState = docBuilder(paragraphBuilder(`f<${A}>oo`), paragraphBuilder(`ba<${B}>r`));
    const expectedEndState = docBuilder(paragraphBuilder('fr'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('deletes Node Selections', () => {
    const startState = docBuilder(paragraphBuilder('foo'), `<${A}>`, horizontalRuleBuilder());
    const expectedEndState = docBuilder(paragraphBuilder('foo'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('moves selection after deleted node', () => {
    const startState = docBuilder(paragraphBuilder('a'), `<${A}>`, paragraphBuilder('b'), blockquoteBuilder(paragraphBuilder('c')));
    const expectedEndState = docBuilder(paragraphBuilder('a'), blockquoteBuilder(paragraphBuilder(`<${A}>c`)));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('moves selection before deleted node at end', () => {
    const startState = docBuilder(paragraphBuilder('a'), `<${A}>`, paragraphBuilder('b'));
    const expectedEndState = docBuilder(paragraphBuilder(`a<${A}>`));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });
});

import { getNotebookSchemaNodeBuilders, wrapTest, A, B } from '../test/testUtil';
import { NodeName } from '../../node/type';
import { deleteSelectionCommand, selectNodeBackwardCommand, selectNodeForwardCommand, selectTextBlockStartOrEndCommand } from './selection';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BULLET_LIST]: bulletListBuilder,
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.LIST_ITEM]: listItemBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.DOC, NodeName.HORIZONTAL_RULE, NodeName.LIST_ITEM, NodeName.PARAGRAPH]);

// == Node ========================================================================
describe('selectNodeBackwardCommand', () => {
  it('does not select the Node before the cut'/*since no Blocks are meant to be selectable in a Notebook*/, () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('a')), blockquoteBuilder(paragraphBuilder(`<${A}>b`))),
          expectedEndState = startState/*same state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });

  it('does nothing when not at the start of the textblock', () => {
    const startState = docBuilder(paragraphBuilder(`a<${A}>b`)),
          expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });
});

describe('selectNodeForwardCommand', () => {
  it('selects the next Node', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`), bulletListBuilder(listItemBuilder(paragraphBuilder('bar'), bulletListBuilder(listItemBuilder(paragraphBuilder('baz')))))),
          expectedEndState = docBuilder(paragraphBuilder(`foo<${A}>`), `<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('bar'), bulletListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
    wrapTest(startState, selectNodeForwardCommand, expectedEndState);
  });

  it('does nothing at the end of the document', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`)),
          expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeForwardCommand, expectedEndState);
  });
});

describe('selectTextBlockStartOrEndCommand', () => {
  it('can move the cursor when the Selection is empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the Selection is not empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the selection crosses multiple text blocks', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`), paragraphBuilder('three four'));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`));
    expectedEndState = docBuilder(paragraphBuilder('one two'), paragraphBuilder(`three four<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });
});

// == Delete ======================================================================
describe('deleteSelectionCommand', () => {
  it('deletes part of a Text Node', () => {
    const startState = docBuilder(paragraphBuilder(`f<${A}>o<${B}>o`)),
          expectedEndState = docBuilder(paragraphBuilder('fo'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('can delete across blocks', () => {
    const startState = docBuilder(paragraphBuilder(`f<${A}>oo`), paragraphBuilder(`ba<${B}>r`)),
          expectedEndState = docBuilder(paragraphBuilder('fr'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('deletes Node Selections', () => {
    const startState = docBuilder(paragraphBuilder('foo'), `<${A}>`, horizontalRuleBuilder()),
          expectedEndState = docBuilder(paragraphBuilder('foo'));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('moves selection after deleted node', () => {
    const startState = docBuilder(paragraphBuilder('a'), `<${A}>`, paragraphBuilder('b'), blockquoteBuilder(paragraphBuilder('c'))),
          expectedEndState = docBuilder(paragraphBuilder('a'), blockquoteBuilder(paragraphBuilder(`<${A}>c`)));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });

  it('moves selection before deleted node at end', () => {
    const startState = docBuilder(paragraphBuilder('a'), `<${A}>`, paragraphBuilder('b')),
          expectedEndState = docBuilder(paragraphBuilder(`a<${A}>`));
    wrapTest(startState, deleteSelectionCommand, expectedEndState);
  });
});

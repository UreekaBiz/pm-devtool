import { getNotebookSchemaNodeBuilders, wrapTest, A, B } from '../testUtil';
import { NodeName } from '../../node/type';
import { deleteSelectionCommand } from './selection';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.DOC, NodeName.HORIZONTAL_RULE, NodeName.PARAGRAPH]);

// == Delete ======================================================================
describe('deleteSelection', () => {
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

import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A } from 'common';
import { joinListItemForwardCommand } from './joinListItemForward';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: doc,
  [NodeName.LIST_ITEM]: li,
  [NodeName.PARAGRAPH]: p,
  [NodeName.UNORDERED_LIST]: ul,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.LIST_ITEM, NodeName.PARAGRAPH, NodeName.UNORDERED_LIST]);

// == Test ====================================================================
// -- Split -------------------------------------------------------------------
describe('joinListItemForwardsCommand', () => {
  it('joins upwards', () => {
    const startState =
      doc(p(`foo<${A}>`),
         (ul(li(p('bar'))))),

    expectedEndState =
      doc(p('foobar'));

    wrapTest(startState, joinListItemForwardCommand, expectedEndState);
  });

  it('pulls a List that is below upwards', () => {
    const startState =
      doc(p(`<${A}>`),
        (ul(li(p('foo'))))),

    expectedEndState =
      doc(ul(li(p('foo'))));

    wrapTest(startState, joinListItemForwardCommand, expectedEndState);
  });
});

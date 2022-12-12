import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A } from 'common';

import { joinListItemBackwardCommand } from './joinListItemBackward';

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
describe('joinListItemBackwardsCommand', () => {
  it('joins to the nearest listItem above', () => {
    const startState =
    doc(ul(li(p(`foo`)),
        p(`<${A}>bar`))),

    expectedEndState =
      doc(ul(li(p('foobar'))));

    wrapTest(startState, joinListItemBackwardCommand, expectedEndState);
  });
});

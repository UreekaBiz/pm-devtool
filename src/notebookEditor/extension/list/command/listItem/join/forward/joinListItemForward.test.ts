import { getNotebookSchemaNodeBuilders, wrapTest, NodeName } from 'common';
import { joinListItemForwardsCommand } from './joinListItemForward';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: doc,
  // [NodeName.LIST_ITEM]: li,
  // [NodeName.PARAGRAPH]: p,
  // [NodeName.UNORDERED_LIST]: ul,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.LIST_ITEM, NodeName.PARAGRAPH, NodeName.UNORDERED_LIST]);

// == Test ====================================================================
// -- Split -------------------------------------------------------------------
describe('joinListItemForwardsCommand', () => {
  it('joins to the nearest listItem above', () => {
    const startState = doc(),

    expectedEndState = doc();

    wrapTest(startState, joinListItemForwardsCommand, expectedEndState);
  });
});

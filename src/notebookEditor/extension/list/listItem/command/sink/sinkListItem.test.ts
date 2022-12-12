import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A } from 'common';

import { sinkListItemCommand } from './sinkListItem';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: doc,
  [NodeName.LIST_ITEM]: li,
  [NodeName.PARAGRAPH]: p,
  [NodeName.UNORDERED_LIST]: ul,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.LIST_ITEM, NodeName.PARAGRAPH, NodeName.UNORDERED_LIST]);

// == Test ====================================================================
// -- Sink ------------------------------------------------------------------------
describe('sinkListItem', () => {
  it('can wrap a simple item in a List', () => {
    const startState =
      doc(ul(li(p('one')),
             li(p(`<${A}>two`)),
             li(p('three')))),

    expectedEndState =
      doc(ul(li(p('one')),
          ul(li(p('two'))),
             li(p('three'))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);
  });

  it('will wrap the first ListItem in a sub-List', () => {
    const startState =
      doc(ul(li(p(`<${A}>one`)),
             li(p('two')),
             li(p('three')))),

    expectedEndState =
      doc(
        ul(ul(li(p(`<${A}>one`))),
              li(p('two')),
              li(p('three'))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);
  });

  it('correctly wraps nested ListItems', () => {
    const startState =
      doc(ul(li(p('one')),
             li(p('...'),
          ul(li(p('two')))),
             li(p(`<${A}>three`)))),

    expectedEndState =
      doc(ul(li(p('one')),
             li(p('...'),
          ul(li(p('two')))),
          ul(li(p('three')))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);
  });
});


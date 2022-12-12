import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A, B } from 'common';

import { splitListItemKeepMarksCommand } from './splitListItem';

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
describe('splitListItemKeepMarksCommand', () => {
  it('has no effect outside of a List', () => {
    const startState = doc(p(`foo<${A}>bar`)),
          expectedEndState = null/*same state*/;

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('has no effect on the top level', () => {
    const startState = doc(`<${A}>`, p('foobar')),
          expectedEndState = null/*same state*/;

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('can split a ListItem', () => {
    const startState =
      doc(ul(li(p(`foo<${A}>bar`)))),

    expectedEndState =
      doc(ul(li(p('foo')),
             li(p('bar'))));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('can split a ListItem at the end', () => {
    const startState =
      doc(ul(li(p(`foobar<${A}>`)))),

    expectedEndState =
      doc(ul(li(p('foobar')),
             li(p())));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('deletes selected content', () => {
    const startState =
      doc(ul(li(p(`foo<${A}>ba<${B}>r`)))),

    expectedEndState =
      doc(ul(li(p('foo')),
             li(p('r'))));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });
});

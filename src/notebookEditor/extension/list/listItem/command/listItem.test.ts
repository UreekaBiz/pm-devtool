import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A, B } from 'common';

import { liftListItemCommand, LiftListOperation } from './liftListItem';
import { sinkListItemCommand } from './sinkListItem';
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

// -- Lift ------------------------------------------------------------------------
describe('liftListItemCommand', () => {
  it('can lift from a nested List', () => {
    const startState =
    doc(ul(li(p('one')),
        ul(li(p(`t<${A}>wo`))),
           li(p('three')))),

    expectedEndState =
      doc(ul(li(p('one')),
             li(p('two')),
             li(p('three'))));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift two items from a nested List', () => {
    const startState =
      doc(ul(li(p('hello')),
          ul(li(p(`o<${A}>ne`)),
             li(p(`two<${B}>`))))),

    expectedEndState =
      doc(ul(li(p('hello')),
             li(p('one')),
             li(p('two'))));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift two items from a nested three-item List', () => {
    const startState =
    doc(ul(li(p('hello')),
        ul(li(p(`o<${A}>ne`)),
           li(p(`two<${B}>`)),
           li(p('three'))))),

    expectedEndState =
      doc(ul(li(p('hello')),
             li(p('one')),
             li(p('two')),
          ul(li(p('three')))));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift an item out of a list', () => {
    const startState =
      doc(p('a'),
          ul(li(p(`b<${A}>`))),
          p('c')),

    expectedEndState =
      doc(p('a'),
          p('b'),
          p('c'));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift two items out of a list', () => {
    const startState =
      doc(p('a'),
          ul(li(p(`b<${A}>`)),
             li(p(`c<${B}>`))),
          p('d')),

    expectedEndState =
      doc(p('a'),
          p('b'),
          p('c'),
          p('d'));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift three items from the middle of a List', () => {
    const startState =
      doc(ul(li(p('a')),
             li(p(`b<${A}>`)),
             li(p('c')),
             li(p(`d<${B}>`)),
             li(p('e')))),

    expectedEndState =
      doc(ul(li(p('a'))),
          p('b'),
          p('c'),
          p('d'),
          ul(li(p('e'))));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });

  it('can lift the first item from a list', () => {
    const startState =
      doc(ul(li(p(`a<${A}>`)),
             li(p('b')),
             li(p('c')))),

    expectedEndState =
      doc(p('a'),
          ul(li(p('b')),
             li(p('c'))));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });


  it('can lift the last item from a List', () => {
    const startState =
      doc(ul(li(p('a')),
             li(p('b')),
             li(p(`c<${A}>`)))),

    expectedEndState =
      doc(ul(li(p('a')),
             li(p('b'))),
          p('c'));

    wrapTest(startState, liftListItemCommand(LiftListOperation.Dedent), expectedEndState);
  });
});

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


import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A, B } from 'common';

import { liftListItemCommand, LiftListOperation } from './liftListItem';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: doc,
  [NodeName.LIST_ITEM]: li,
  [NodeName.PARAGRAPH]: p,
  [NodeName.UNORDERED_LIST]: ul,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.LIST_ITEM, NodeName.PARAGRAPH, NodeName.UNORDERED_LIST]);

// == Test ====================================================================
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

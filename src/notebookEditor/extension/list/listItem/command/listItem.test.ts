import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A, B } from 'common';

import { liftListItemCommand } from './liftListItem';
import { sinkListItemCommand } from './sinkListItem';
import { splitListItemKeepMarksCommand } from './splitListItem';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.BULLET_LIST]: bulletListBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.LIST_ITEM]: listItemBuilder,
  [NodeName.ORDERED_LIST]: orderedListBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.DOC, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH]);

// == Test ====================================================================
// -- Split -------------------------------------------------------------------
describe('splitListItemKeepMarksCommand', () => {
  it('has no effect outside of a List', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>bar`)),
          expectedEndState = null/*same state*/;
    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('has no effect on the top level', () => {
    const startState = docBuilder(`<${A}>`, paragraphBuilder('foobar')),
          expectedEndState = null/*same state*/;
    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('can split a ListItem', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder(`foo<${A}>bar`)))),

    expectedEndState =
      docBuilder(
          bulletListBuilder(listItemBuilder(paragraphBuilder('foo')),
                            listItemBuilder(paragraphBuilder('bar'))));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('can split a ListItem at the end', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder(`foobar<${A}>`)))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('foobar')),
                          listItemBuilder(paragraphBuilder())));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });

  it('deletes selected content', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder(`foo<${A}>ba<${B}>r`)))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('foo')),
                          listItemBuilder(paragraphBuilder('r'))));

    wrapTest(startState, splitListItemKeepMarksCommand, expectedEndState);
  });
});

// -- Lift ------------------------------------------------------------------------
describe('liftListItemCommand', () => {
  it('can lift from a nested List', () => {
    const startState =
    docBuilder(
      bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                        bulletListBuilder(listItemBuilder(paragraphBuilder(`t<${A}>wo`))),
                        listItemBuilder(paragraphBuilder('three')))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                          listItemBuilder(paragraphBuilder('two')),
                          listItemBuilder(paragraphBuilder('three'))));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift two items from a nested List', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('hello')),
                          bulletListBuilder(listItemBuilder(paragraphBuilder(`o<${A}>ne`)),
                                            listItemBuilder(paragraphBuilder(`two<${B}>`))))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('hello')),
                          listItemBuilder(paragraphBuilder('one')),
                          listItemBuilder(paragraphBuilder('two'))));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift two items from a nested three-item List', () => {
    const startState =
    docBuilder(
      bulletListBuilder(listItemBuilder(paragraphBuilder('hello')),
                        bulletListBuilder(listItemBuilder(paragraphBuilder(`o<${A}>ne`)),
                                          listItemBuilder(paragraphBuilder(`two<${B}>`)),
                                          listItemBuilder(paragraphBuilder('three'))))),
    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('hello')),
                          listItemBuilder(paragraphBuilder('one')),
                          listItemBuilder(paragraphBuilder('two')),
                          bulletListBuilder(listItemBuilder(paragraphBuilder('three')))));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift an item out of a list', () => {
    const startState =
      docBuilder(
        paragraphBuilder('a'),
        bulletListBuilder(listItemBuilder(paragraphBuilder(`b<${A}>`))),
        paragraphBuilder('c')),

    expectedEndState =
      docBuilder(
        paragraphBuilder('a'),
        paragraphBuilder('b'),
        paragraphBuilder('c'));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift two items out of a list', () => {
    const startState =
      docBuilder(
        paragraphBuilder('a'),
        bulletListBuilder(listItemBuilder(paragraphBuilder(`b<${A}>`)),
                          listItemBuilder(paragraphBuilder(`c<${B}>`))),
        paragraphBuilder('d')),

    expectedEndState =
      docBuilder(
          paragraphBuilder('a'),
          paragraphBuilder('b'),
          paragraphBuilder('c'),
          paragraphBuilder('d'));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift three items from the middle of a List', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('a')),
                          listItemBuilder(paragraphBuilder(`b<${A}>`)),
                          listItemBuilder(paragraphBuilder('c')),
                          listItemBuilder(paragraphBuilder(`d<${B}>`)),
                          listItemBuilder(paragraphBuilder('e')))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('a'))),
        paragraphBuilder('b'),
        paragraphBuilder('c'),
        paragraphBuilder('d'),
        bulletListBuilder(listItemBuilder(paragraphBuilder('e'))));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('can lift the first item from a list', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder(`a<${A}>`)),
                          listItemBuilder(paragraphBuilder('b')),
                          listItemBuilder(paragraphBuilder('c')))),

    expectedEndState =
      docBuilder(paragraphBuilder('a'),
                 bulletListBuilder(listItemBuilder(paragraphBuilder('b')),
                                   listItemBuilder(paragraphBuilder('c'))));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });


  it('can lift the last item from a List', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('a')),
                          listItemBuilder(paragraphBuilder('b')),
                          listItemBuilder(paragraphBuilder(`c<${A}>`)))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('a')),
                          listItemBuilder(paragraphBuilder('b'))),
        paragraphBuilder('c'));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });

  it('handles lifting correctly inside Blocks that are not TextBlocks', () => {
    const startState =
      docBuilder(
        blockquoteBuilder(
          orderedListBuilder(listItemBuilder(paragraphBuilder(`hello<${A}>`))),
                             listItemBuilder(paragraphBuilder(`world<${B}>`)))),

    expectedEndState =
      docBuilder(
        blockquoteBuilder(
          paragraphBuilder('hello')),
          paragraphBuilder('world'));

    wrapTest(startState, liftListItemCommand('Shift-Tab'), expectedEndState);
  });
});

// -- Sink ------------------------------------------------------------------------
describe('sinkListItem', () => {
  it('can wrap a simple item in a List', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                          listItemBuilder(paragraphBuilder(`<${A}>two`)),
                          listItemBuilder(paragraphBuilder('three')))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                          bulletListBuilder(listItemBuilder(paragraphBuilder('two'))),
                          listItemBuilder(paragraphBuilder('three'))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);
  });

  it('will wrap the first ListItem in a sub-List', () => {
    const startState =
      docBuilder(
        bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>one`)),
                          listItemBuilder(paragraphBuilder('two')),
                          listItemBuilder(paragraphBuilder('three')))),

    expectedEndState =
      docBuilder(
        bulletListBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>one`))),
                          listItemBuilder(paragraphBuilder('two')),
                          listItemBuilder(paragraphBuilder('three'))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);
  });

  it('correctly wraps nested ListItems', () => {
    const startState =
      docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                                   listItemBuilder(paragraphBuilder('...'),
                                   bulletListBuilder(listItemBuilder(paragraphBuilder('two')))),
                                                     listItemBuilder(paragraphBuilder(`<${A}>three`)))),

    expectedEndState =
      docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one')),
                                   listItemBuilder(paragraphBuilder('...'),
                                   bulletListBuilder(listItemBuilder(paragraphBuilder('two')))),
                                                     bulletListBuilder(listItemBuilder(paragraphBuilder('three')))));

    wrapTest(startState, sinkListItemCommand, expectedEndState);

  });
});


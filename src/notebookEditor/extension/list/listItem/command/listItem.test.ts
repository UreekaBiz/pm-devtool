import { getNotebookSchemaNodeBuilders, wrapTest, NodeName, A, B } from 'common';

import { sinkListItemCommand } from './sinkListItem';
import { splitListItemKeepMarksCommand } from './splitListItem';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BULLET_LIST]: bulletListBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.LIST_ITEM]: listItemBuilder,
  // [NodeName.ORDERED_LIST]: orderedListBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BULLET_LIST, NodeName.DOC, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH]);

// == Test ====================================================================
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

// describe('liftListItem', () => {
//   let lift = liftListItem(schema.nodes.list_item)

//   it('can lift from a nested list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello'), bulletListBuilder(listItemBuilder(paragraphBuilder(`o<${A}><${B}>ne`)), listItemBuilder(paragraphBuilder('two')))))), lift,
//            docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello')), listItemBuilder(paragraphBuilder('one'), bulletListBuilder(listItemBuilder(paragraphBuilder('two'))))))))

//   it('can lift two items from a nested list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello'), bulletListBuilder(listItemBuilder(paragraphBuilder(`o<${A}>ne`)), listItemBuilder(paragraphBuilder('two<${B}>')))))), lift,
//            docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello')), listItemBuilder(paragraphBuilder('one')), listItemBuilder(paragraphBuilder('two'))))))

//   it('can lift two items from a nested three-item list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello'), bulletListBuilder(listItemBuilder(paragraphBuilder(`o<${A}>ne`)), listItemBuilder(paragraphBuilder('two<${B}>')), listItemBuilder(paragraphBuilder('three')))))), lift,
//            docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hello')), listItemBuilder(paragraphBuilder('one')), listItemBuilder(paragraphBuilder('two'), bulletListBuilder(listItemBuilder(paragraphBuilder('three'))))))))

//   it('can lift an item out of a list', () =>
//      apply(docBuilder(paragraphBuilder('a'), bulletListBuilder(listItemBuilder(paragraphBuilder(`b<${A}>`))), paragraphBuilder('c')), lift,
//            docBuilder(paragraphBuilder('a'), paragraphBuilder('b'), paragraphBuilder('c'))))

//   it('can lift two items out of a list', () =>
//      apply(docBuilder(paragraphBuilder('a'), bulletListBuilder(listItemBuilder(paragraphBuilder(`b<${A}>`)), listItemBuilder(paragraphBuilder('c<${B}>'))), paragraphBuilder('d')), lift,
//            docBuilder(paragraphBuilder('a'), paragraphBuilder('b'), paragraphBuilder('c'), paragraphBuilder('d'))))

//   it('can lift three items from the middle of a list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder(`b<${A}>`)), listItemBuilder(paragraphBuilder('c')), listItemBuilder(paragraphBuilder('d<${B}>')), listItemBuilder(paragraphBuilder('e')))), lift,
//            docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('a'))), paragraphBuilder('b'), paragraphBuilder('c'), paragraphBuilder('d'), bulletListBuilder(listItemBuilder(paragraphBuilder('e'))))))

//   it('can lift the first item from a list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`a<${A}>`)), listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c')))), lift,
//            docBuilder(paragraphBuilder('a'), bulletListBuilder(listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c'))))))

//   it('can lift the last item from a list', () =>
//      apply(docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder(`c<${A}>`)))), lift,
//            docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder('b'))), paragraphBuilder('c'))))

//   it('joins adjacent lists when lifting an item with subitems', () =>
//      apply(docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a'), orderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>b<${B}>`), orderedListBuilder(listItemBuilder(paragraphBuilder('c')))), listItemBuilder(paragraphBuilder('d')))), listItemBuilder(paragraphBuilder('e')))), lift,
//            docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder('b'), orderedListBuilder(listItemBuilder(paragraphBuilder('c')), listItemBuilder(paragraphBuilder('d')))), listItemBuilder(paragraphBuilder('e'))))))
});

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


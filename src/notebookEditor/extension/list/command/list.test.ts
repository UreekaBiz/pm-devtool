import { getNotebookSchemaNodeBuilders, wrapTest, A, B, NodeName } from 'common';

import { toggleListCommand } from './toggleListCommand';

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
describe('toggleListCommand', () => {
  it('can wrap a Paragraph', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>foo`)),
          expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('foo'))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap a nested Paragraph', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`<${A}>foo`))),
          expectedEndState = docBuilder(blockquoteBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('foo')))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap multiple Paragraphs', () => {
    const startState = docBuilder(paragraphBuilder('foo'), paragraphBuilder(`ba<${A}>r`), paragraphBuilder(`ba<${B}>z`)),
          expectedEndState = docBuilder(paragraphBuilder('foo'), bulletListBuilder(listItemBuilder(paragraphBuilder('bar')), listItemBuilder(paragraphBuilder('baz'))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('unwraps the first Paragraph in a ListItem if already active', () => {
    const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`)))),
          expectedEndState = docBuilder(paragraphBuilder(`<${A}>foo`));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('toggles the type of a List successfully', () => {
    const startState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`)))),
          expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('lifts the whole contents of the ListItem whenever there are loose blocks in a single ListItem', () => {
    const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>bar`)))),
          expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>bar`));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('changes the type of the List when the cursor is inside it', () => {
    const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('foo')), listItemBuilder(paragraphBuilder(`<${A}>bar`)), listItemBuilder(paragraphBuilder('baz')))),
          expectedEndState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('foo')), listItemBuilder(paragraphBuilder(`<${A}>bar`)), listItemBuilder(paragraphBuilder('baz'))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('only splits items where valid', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>one`), orderedListBuilder(listItemBuilder('two')), paragraphBuilder(`three<${B}>`)),
          expectedEndState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('one'), orderedListBuilder(listItemBuilder('two'))), listItemBuilder(paragraphBuilder('three'))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });
});

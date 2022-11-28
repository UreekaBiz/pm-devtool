import { listBlockquoteBuilder, listDocBuilder, defaultBulletListBuilder, defaultListItemBuilder, defaultOrderedListBuilder, listParagraphBuilder, wrapTest, A, B, NodeName } from 'common';

import { toggleListCommand } from './toggleListCommand';

// ********************************************************************************
// == Test ====================================================================
describe('toggleListCommand', () => {
  it('can wrap a Paragraph', () => {
    const startState = listDocBuilder(listParagraphBuilder(`<${A}>foo`)),
          expectedEndState = listDocBuilder(defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder('foo'))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap a nested Paragraph', () => {
    const startState = listDocBuilder(listBlockquoteBuilder(listParagraphBuilder(`<${A}>foo`))),
          expectedEndState = listDocBuilder(listBlockquoteBuilder(defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder('foo')))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap multiple Paragraphs', () => {
    const startState = listDocBuilder(listParagraphBuilder('foo'), listParagraphBuilder(`ba<${A}>r`), listParagraphBuilder(`ba<${B}>z`)),
          expectedEndState = listDocBuilder(listParagraphBuilder('foo'), defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder('bar'))), defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder('baz'))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('unwraps the first Paragraph in a ListItem if already active', () => {
    const startState = listDocBuilder(defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder(`<${A}>foo`)))),
          expectedEndState = listDocBuilder(listParagraphBuilder(`<${A}>foo`));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('toggles the type of a List successfully', () => {
    const startState = listDocBuilder(defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder(`<${A}>foo`)))),
          expectedEndState = listDocBuilder(defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder(`<${A}>foo`))));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('sets up a state that will be addressed by an appendedTransaction when leaving loose ListItems in a List', () => {
    const startState = listDocBuilder(defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder('foo'), listParagraphBuilder(`<${A}>bar`)))),
          expectedEndState = listDocBuilder(listParagraphBuilder('foo'), defaultListItemBuilder(listParagraphBuilder(`<${A}>bar`)));
    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('changes the type of the List when the cursor is inside it', () => {
    const startState = listDocBuilder(defaultBulletListBuilder(defaultListItemBuilder(listParagraphBuilder('foo')), defaultListItemBuilder(listParagraphBuilder(`<${A}>bar`)), defaultListItemBuilder(listParagraphBuilder('baz')))),
          expectedEndState = listDocBuilder(defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder('foo')), defaultListItemBuilder(listParagraphBuilder(`<${A}>bar`)), defaultListItemBuilder(listParagraphBuilder('baz'))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('only wraps Blocks that are not ListItems already', () => {
    const startState = listDocBuilder(listParagraphBuilder(`<${A}>one`), defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder('two'))), listParagraphBuilder(`three<${B}>`)),
          expectedEndState = listDocBuilder(defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder("one"))), defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder("two"))), defaultOrderedListBuilder(defaultListItemBuilder(listParagraphBuilder("three"))));
    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });
});

import { getNotebookSchemaNodeBuilders, wrapTest, A, B, NodeName } from 'common';

import { toggleListCommand } from './toggleListCommand';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BLOCKQUOTE]: blockquote,
  [NodeName.BULLET_LIST]: bl,
  [NodeName.DOC]: doc,
  [NodeName.LIST_ITEM]: li,
  [NodeName.ORDERED_LIST]: ol,
  [NodeName.PARAGRAPH]: p,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.DOC, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH]);

// == Test ====================================================================
describe('toggleListCommand', () => {
  it('can wrap a Paragraph', () => {
    const startState = doc(p(`<${A}>foo`)),
          expectedEndState = doc(bl(li(p('foo'))));

    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap a nested Paragraph', () => {
    const startState = doc(blockquote(p(`<${A}>foo`))),
          expectedEndState = doc(blockquote(ol(li(p('foo')))));

    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('can wrap multiple Paragraphs', () => {
    const startState = doc(p('foo'), p(`ba<${A}>r`), p(`ba<${B}>z`)),
          expectedEndState = doc(p('foo'), bl(li(p('bar'))), bl(li(p('baz'))));

    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('unwraps the first Paragraph in a ListItem if already active', () => {
    const startState = doc(bl(li(p(`<${A}>foo`)))),
          expectedEndState = doc(p(`<${A}>foo`));

    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('toggles the type of a List successfully', () => {
    const startState = doc(ol(li(p(`<${A}>foo`)))),
          expectedEndState = doc(bl(li(p(`<${A}>foo`))));

    wrapTest(startState, toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('changes the type of the List when the cursor is inside it', () => {
    const startState = doc(bl(li(p('foo')), li(p(`<${A}>bar`)), li(p('baz')))),
          expectedEndState = doc(ol(li(p('foo')), li(p(`<${A}>bar`)), li(p('baz'))));

    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });

  it('only wraps Blocks that are not ListItems already', () => {
    const startState = doc(p(`<${A}>one`), ol(li(p('two'))), p(`three<${B}>`)),
          expectedEndState = doc(ol(li(p("one"))), ol(li(p("two"))), ol(li(p("three"))));

    wrapTest(startState, toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}), expectedEndState);
  });
});

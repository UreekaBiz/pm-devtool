import ist from 'ist';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { getNotebookSchemaNodeBuilders, joinBackwardCommand, wrapTest, A } from '../command';
import { NodeName } from './type';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.BLOCKQUOTE]: blockquouteBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,

} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.DOC, NodeName.HORIZONTAL_RULE, NodeName.PARAGRAPH]);

// == Node ========================================================================
// -- Join  Backward --------------------------------------------------------------
describe('joinBackward', () => {
  it('can join paragraphs', () => {
    const startState = docBuilder(paragraphBuilder('hi'), paragraphBuilder(`<${A}>there`));
    const expectedEndState = docBuilder(paragraphBuilder('hithere'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('can join out of a nested node', () => {
    const startState = docBuilder(paragraphBuilder('hi'), blockquouteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(paragraphBuilder('hi'), paragraphBuilder('there'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('moves a block into an adjacent wrapper', () => {
    const startState = docBuilder(blockquouteBuilder(paragraphBuilder('hi')), paragraphBuilder(`<${A}>there`));
    const expectedEndState = docBuilder(blockquouteBuilder(paragraphBuilder('hi'), paragraphBuilder('there')));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('moves a block into an adjacent wrapper from another wrapper', () => {
    const startState = docBuilder(blockquouteBuilder(paragraphBuilder('hi')), blockquouteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(blockquouteBuilder(paragraphBuilder('hi'), paragraphBuilder('there')));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('joins the wrapper to a subsequent one if applicable', () => {
    const startState = docBuilder(blockquouteBuilder(paragraphBuilder('hi')), paragraphBuilder(`<${A}>there`), blockquouteBuilder(paragraphBuilder('x')));
    const expectedEndState = docBuilder(blockquouteBuilder(paragraphBuilder('hi'), paragraphBuilder('there'), paragraphBuilder('x')));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  // --------------------------------------------------------------------------------
  // TODO: redefine and handle these tests once Lists are added
  // it('moves a block into a list item', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder(`<${A}>there`));
  //   const expectedEndState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins lists', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi'))), unorderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins list items', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi'), paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('lifts out of a list at the start', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(paragraphBuilder(`<${A}>there`));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins lists before and after', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder(`<${A}>there`), unorderedListBuilder(listItemBuilder(paragraphBuilder('x'))));
  //   const expectedEndState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there')), listItemBuilder(paragraphBuilder('x'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('does not return true on empty blocks that cannot be deleted', () => {
  //   const startState = docBuilder(paragraphBuilder('a'), unorderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>`), unorderedListBuilder(listItemBuilder('b')))));
  //   const expectedEndState = null;
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // --------------------------------------------------------------------------------
  it('deletes leaf nodes before', () => {
    const startState = docBuilder(horizontalRuleBuilder, paragraphBuilder(`<${A}>there`));
    const expectedEndState = docBuilder(paragraphBuilder('there'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('lifts before it deletes', () => {
    const startState = docBuilder(horizontalRuleBuilder, blockquouteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(horizontalRuleBuilder, paragraphBuilder('there'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('does nothing at start of doc', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>foo`));
    const expectedEndState = null;
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('can join single-textblock-child nodes', () => {
    const schema = new Schema({
      nodes: {
        text: { inline: true },
        doc: { content: 'block+' },
        block: { content: 'paragraph' },
        paragraph: { content: 'text*' },
      },
    });

    const doc = schema.node('doc', null/*no attrs*/, [
      schema.node('block', null/*no attrs*/, [schema.node('paragraph', null/*no attrs*/, [schema.text('a')])]),
      schema.node('block', null/*no attrs*/, [schema.node('paragraph', null/*no attrs*/, [schema.text('b')])]),
    ]);

    let state = EditorState.create({ doc, selection: TextSelection.near(doc.resolve(7/*expected pos*/)) });
    ist(joinBackwardCommand(state, tr => state = state.apply(tr)));
    ist(state.doc.toString(), 'doc(block(paragraph(\"ab\")))');
  });

  // it('', () => {
  //   const startState = null;
  //   const expectedEndState = null;
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });
});

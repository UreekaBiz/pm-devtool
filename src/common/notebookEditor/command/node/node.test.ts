import ist from 'ist';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { NodeName } from '../../node/type';
import { selectNodeBackwardCommand } from '../selection';
import { getNotebookSchemaNodeBuilders, getNotebookSchemaWithBuildersObj, wrapTest, A, B } from '../testUtil';
import { joinBackwardCommand, liftEmptyBlockNodeCommand, wrapInCommand } from './node';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj();
const { blockquote: blockquouteType } = notebookSchemaWithBuildersObj.schema.nodes;

const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.DOC, NodeName.HORIZONTAL_RULE, NodeName.PARAGRAPH]);

// == Node ========================================================================
// -- Select ----------------------------------------------------------------------
describe('selectNodeBackwardCommand', () => {
  it('does not select the Node before the cut'/*since no Blocks are meant to be selectable in a Notebook*/, () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('a')), blockquoteBuilder(paragraphBuilder(`<${A}>b`)));
    const expectedEndState = startState/*same state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });

  it('does nothing when not at the start of the textblock', () => {
    const startState = docBuilder(paragraphBuilder(`a<${A}>b`));
    const expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });
});

describe('selectNodeForwardCommand', () => {
  // TODO: redefine and handle test once Lists are added
  // it('selects the next Node', () => {
  //   const startState = docBuilder(paragraphBuilder(`foo<${A}>`), unorderedListBuilder(listItemBuilder(paragraphBuilder('bar'), unorderedListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
  //   const expectedEndState = docBuilder(paragraphBuilder(`foo<${A}>`), `<${A}>`, unorderedListBuilder(listItemBuilder(paragraphBuilder('bar'), unorderedListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
  //   wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  // });

  it('does nothing at the end of the document', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`));
    const expectedEndState = null/*same as starting state*/;
    wrapTest(startState, selectNodeBackwardCommand, expectedEndState);
  });
});

// -- Wrap ------------------------------------------------------------------------
describe('wrapInCommand', () => {
  const wrapInBlockquote = wrapInCommand(blockquouteType, {/*no attrs*/});

  it('can wrap a Paragraph', () => {
    const startState = docBuilder(paragraphBuilder(`fo<${A}>o`));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  it('wraps multiple Paragraphs', () => {
    const startState = docBuilder(paragraphBuilder(`fo<${A}>o`), paragraphBuilder('bar'), paragraphBuilder(`ba<${B}>z`), paragraphBuilder('quux'));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'), paragraphBuilder('baz')), paragraphBuilder('quux'));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  it('wraps an already wrapped node', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`fo<${A}>o`)));
    const expectedEndState = docBuilder(blockquoteBuilder(blockquoteBuilder(paragraphBuilder('foo'))));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  // TODO: redefine and handle test once Lists are added
  // it('can wrap a Node Selection', () => {
  //   const startState = docBuilder(`<${A}>`, unorderedListBuilder(listItemBuilder(paragraphBuilder('foo'))));
  //   const expectedEndState = docBuilder(blockquoteBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('foo')))));
  //   wrapTest(startState, wrapInBlockquote, expectedEndState);
  // });
});

// -- Lift ------------------------------------------------------------------------
describe('liftEmptyBlockNodeCommand', () => {
  it('splits the parent block when there are sibling before', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>`), paragraphBuilder('bar')));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), blockquoteBuilder(paragraphBuilder(), paragraphBuilder('bar')));
    wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  });

  it('lifts the last child out of its parent', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>`)));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), paragraphBuilder());
    wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  });

  it('lifts an only child', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), blockquoteBuilder(paragraphBuilder(`<${A}>`)));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), paragraphBuilder(`<${A}>`));
    wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  });

  // TODO: redefine and handle test once Lists are added
  // it('does not violate schema constraints', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`))));
  //   const expectedEndState = null/*same state*/;
  //   wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  // });

  // it('lifts out of a list', () => {
  //   const startState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder(`<${A}>`))));
  //   const expectedEndState = docBuilder(unorderedListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder());
  //   wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  // });
});

// -- Join ------------------------------------------------------------------------
describe('joinBackwardCommand', () => {
  it('can join paragraphs', () => {
    const startState = docBuilder(paragraphBuilder('hi'), paragraphBuilder(`<${A}>there`));
    const expectedEndState = docBuilder(paragraphBuilder('hithere'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('can join out of a nested node', () => {
    const startState = docBuilder(paragraphBuilder('hi'), blockquoteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(paragraphBuilder('hi'), paragraphBuilder('there'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('moves a block into an adjacent wrapper', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('hi')), paragraphBuilder(`<${A}>there`));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('hi'), paragraphBuilder('there')));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('moves a block into an adjacent wrapper from another wrapper', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('hi')), blockquoteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('hi'), paragraphBuilder('there')));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('joins the wrapper to a subsequent one if applicable', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('hi')), paragraphBuilder(`<${A}>there`), blockquoteBuilder(paragraphBuilder('x')));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('hi'), paragraphBuilder('there'), paragraphBuilder('x')));
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
    const startState = docBuilder(horizontalRuleBuilder, blockquoteBuilder(paragraphBuilder(`<${A}>there`)));
    const expectedEndState = docBuilder(horizontalRuleBuilder, paragraphBuilder('there'));
    wrapTest(startState, joinBackwardCommand, expectedEndState);
  });

  it('does nothing at start of doc', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>foo`));
    const expectedEndState = null/*same as starting state*/;
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
});

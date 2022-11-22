import { MarkName } from 'common/notebookEditor/mark';
import ist from 'ist';
import { Schema } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';

import { AttributeType } from '../../attribute';
import { NodeGroup, NodeName } from '../../node/type';
import { toggleMarkCommand } from '../mark';
import { createState, getNotebookSchemaMarkBuilders, getNotebookSchemaNodeBuilders, getNotebookSchemaWithBuildersObj, wrapTest, A, B, ProseMirrorNodeWithTag } from '../test/testUtil';
import { joinBackwardCommand, joinForwardCommand, liftCommand, liftEmptyBlockNodeCommand, splitBlockCommand, splitBlockKeepMarksCommand, wrapInCommand } from './node';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj();
const { schema: notebookSchema } = notebookSchemaWithBuildersObj;

const { blockquote: blockquouteType } = notebookSchema.nodes;
const { bold: boldType } = notebookSchema.marks;

const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.BLOCKQUOTE]: bulletListBuilder,
  [NodeName.CODEBLOCK]: codeBlockBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HEADING]: headingBuilder,
  [NodeName.IMAGE]: imageBuilder,
  [NodeName.LIST_ITEM]: listItemBuilder,
  [NodeName.HORIZONTAL_RULE]: horizontalRuleBuilder,
  [NodeName.ORDERED_LIST]: orderedListBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.CODEBLOCK, NodeName.DOC, NodeName.HEADING, NodeName.HORIZONTAL_RULE, NodeName.IMAGE, NodeName.PARAGRAPH]);

const { [MarkName.BOLD]: boldBuilder, [MarkName.ITALIC]: italicBuilder } = getNotebookSchemaMarkBuilders([MarkName.BOLD, MarkName.ITALIC]);

// == Test ========================================================================
// -- Split -----------------------------------------------------------------------
describe('splitBlockCommand', () => {
  it('splits a Paragraph at the end', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`));
    const expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder());
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('split a Paragraph in the middle', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>bar`));
    const expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Paragraph from a Heading', () => {
    const startState = docBuilder(headingBuilder(`foo<${A}>`));
    const expectedEndState = docBuilder(headingBuilder('foo'), paragraphBuilder());
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Heading in two when in the middle', () => {
    const startState = docBuilder(headingBuilder(`foo<${A}>bar`));
    const expectedEndState = docBuilder(headingBuilder('foo'), headingBuilder('bar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('deletes selected content', () => {
    const startState = docBuilder(paragraphBuilder(`fo<${A}>ob<${B}>ar`));
    const expectedEndState = docBuilder(paragraphBuilder('fo'), paragraphBuilder('ar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a parent Block when a Node is selected', () => {
    const startState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a')), `<${A}>`, listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c'))));
    const expectedEndState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a'))), orderedListBuilder(listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c'))));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('does not split the parent Block when at the start', () => {
    const startState = docBuilder(orderedListBuilder(`<${A}>`, listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c'))));
    const expectedEndState = null/*same state*/;
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits off a normal Paragraph when splitting at the start of a Text Block', () => {
    const startState = docBuilder(headingBuilder(`<${A}>foo`));
    const expectedEndState = docBuilder(paragraphBuilder(), headingBuilder('foo'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  const headingSchema = new Schema({ nodes: notebookSchema.spec.nodes.update(NodeName.HEADING, { content: 'inline*', marks: ''/*no marks*/ }).update('doc', { content: `${NodeName.HEADING} ${NodeGroup.BLOCK}*` }),  marks: notebookSchema.spec.marks });
  const hDocBuilder = (A: number) => {
    const hDoc = headingSchema.node('doc', null/*no attrs*/, [ headingSchema.node(NodeName.HEADING, { [AttributeType.Level]: 1 }, headingSchema.text('foobar'))]);
    (hDoc as ProseMirrorNodeWithTag).tag = { A, B: null/*none*/ };
    return hDoc;
  };
  it('splits a Paragraph from a Heading when a double Heading is not allowed', () => {
    const startState = hDocBuilder(4/*pos*/);
    const expectedEndState = headingSchema.node('doc', null/*no attrs*/, [headingSchema.node('heading', { [AttributeType.Level]: 1 }, headingSchema.text('foo')), headingSchema.node('paragraph', null/*no attrs*/, headingSchema.text('bar'))]);
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('will not try to reset the type of an empty leftover when the schema forbids it', () => {
    const startState = hDocBuilder(1/*pos*/);
    const expectedEndState = headingSchema.node('doc', null/*no attrs*/, [headingSchema.node('heading', { [AttributeType.Level]: 1 }), headingSchema.node('paragraph', null/*no attrs*/, headingSchema.text('foobar'))]);
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('prefers Text Blocks', () => {
    const schema = new Schema({
      nodes: {
        doc: { content: 'paragraph* section*' },
        paragraph: { content: 'text*', toDOM() { return ['p', 0/*content*/]; } },
        section: { content: 'paragraph+', toDOM() { return ['section', 0/*content*/]; } },
        text: {/*no spec*/},
      },
    });
    const doc = schema.node('doc', null/*no attrs*/, [schema.node('paragraph', null/*no attrs*/, [schema.text('hello')])]);
    (doc as ProseMirrorNodeWithTag).tag = { A: 3, B: null/*none*/ };

    const startState = doc;
    const expectedEndState = schema.node('doc', null/*no attrs*/, [schema.node('paragraph', null/*no attrs*/, [schema.text('he')]), schema.node('paragraph', null/*no attrs*/, [schema.text('llo')])]);
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });
});

describe('splitBlockKeepMarksCommand', () => {
  it('keeps marks when used after marked text', () => {
    const startStateDoc = docBuilder(paragraphBuilder(boldBuilder(`foo<${A}>`), 'bar'));
    let state = createState(startStateDoc as ProseMirrorNodeWithTag);

    splitBlockKeepMarksCommand(state, tr => state = state.apply(tr));
    ist(state.storedMarks!.length, 1/*stored Bold*/);
  });

  it('preserves the stored marks', () => {
    const startStateDoc = docBuilder(paragraphBuilder(italicBuilder(`foo<${A}>`)));
    let state = createState(startStateDoc as ProseMirrorNodeWithTag);
    toggleMarkCommand(boldType, {/*no attrs*/})(state, tr => state = state.apply(tr));
    splitBlockKeepMarksCommand(state, tr => state = state.apply(tr));
    ist(state.storedMarks!.length, 2/*stored Bold and Italic*/);
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

  it('can wrap a Node Selection', () => {
    const startState = docBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo'))));
    const expectedEndState = docBuilder(blockquoteBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('foo')))));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });
});

// -- Lift ------------------------------------------------------------------------
describe('liftCommand', () => {

  it('lifts out of a parent block', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`<${A}>foo`)));
    const expectedEndState = docBuilder(paragraphBuilder(`<${A}>foo`));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('splits the parent block when necessary', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>bar`), paragraphBuilder('baz')));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), paragraphBuilder('bar'), blockquoteBuilder(paragraphBuilder('baz')));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('does nothing for a top-level block', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>foo`));
    const expectedEndState = null/*same state*/;
    wrapTest(startState, liftCommand, expectedEndState);
  });

  // TODO: redefine and handle once Lists are added
  // it('can lift out of a list', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`))));
  //   const expectedEndState = docBuilder(paragraphBuilder('foo'));
  //   wrapTest(startState, liftCommand, expectedEndState);
  // });

  // it('lifts out of the innermost parent', () => {
  //   const startState = docBuilder(blockquoteBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`foo<${A}>`)))));
  //   const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder(`foo<${A}>`)));
  //   wrapTest(startState, liftCommand, expectedEndState);
  // });

  // it('can lift a node selection', () => {
  //   const startState = docBuilder(blockquoteBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo')))));
  //   const expectedEndState = docBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo'))));
  //   wrapTest(startState, liftCommand, expectedEndState);
  // });

  // it('lifts out of a nested list', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one'), bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>sub1`)), listItemBuilder(paragraphBuilder('sub2')))), listItemBuilder(paragraphBuilder('two'))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one'), paragraphBuilder(`<${A}>sub1`), bulletListBuilder(listItemBuilder(paragraphBuilder('sub2')))), listItemBuilder(paragraphBuilder('two'))));
  //   wrapTest(startState, liftCommand, expectedEndState);
  // });
});

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

  // TODO: redefine and handle once Lists are added
  // it('does not violate schema constraints', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`))));
  //   const expectedEndState = null/*same state*/;
  //   wrapTest(startState, liftEmptyBlockNodeCommand, expectedEndState);
  // });

  // it('lifts out of a list', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder(`<${A}>`))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder());
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

  // TODO: redefine and handle once Lists are added
  // it('moves a block into a list item', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder(`<${A}>there`));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins lists', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi'))), bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins list items', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi'), paragraphBuilder('there'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('lifts out of a list at the start', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>there`))));
  //   const expectedEndState = docBuilder(paragraphBuilder(`<${A}>there`));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('joins lists before and after', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi'))), paragraphBuilder(`<${A}>there`), bulletListBuilder(listItemBuilder(paragraphBuilder('x'))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there')), listItemBuilder(paragraphBuilder('x'))));
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

  // it('does not return true on empty blocks that cannot be deleted', () => {
  //   const startState = docBuilder(paragraphBuilder('a'), bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>`), bulletListBuilder(listItemBuilder('b')))));
  //   const expectedEndState = null;
  //   wrapTest(startState, joinBackwardCommand, expectedEndState);
  // });

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

describe('joinForwardCommand', () => {
  it('joins two Text Blocks', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`), paragraphBuilder('bar'));
    const expectedEndState = docBuilder(paragraphBuilder('foobar'));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('keeps type of second Node when first is empty', () => {
    const startState = docBuilder(paragraphBuilder('x'), paragraphBuilder(`<${A}>`), headingBuilder('hi'));
    const expectedEndState = docBuilder(paragraphBuilder('x'), headingBuilder(`<${A}>hi`));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('clears nodes from joined Node that would not be allowed in target Node', () => {
    const startState = docBuilder(codeBlockBuilder(`foo<${A}>`), paragraphBuilder('bar', imageBuilder()));
    const expectedEndState = docBuilder(codeBlockBuilder(`foo<${A}>bar`));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('does nothing at the end of the Document', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`));
    const expectedEndState = null/*same state*/;
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('deletes a leaf Node after the current Block', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`), horizontalRuleBuilder(), paragraphBuilder('bar'));
    const expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  // TODO: redefine and handle once Lists are added
  // it('pulls the next Block into the current ListItem', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`a<${A}>`)), listItemBuilder(paragraphBuilder('b'))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('a'), paragraphBuilder('b'))));
  //   wrapTest(startState, joinForwardCommand, expectedEndState);
  // });

  // it('joins two Blocks inside of a ListItem', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`a<${A}>`), paragraphBuilder('b'))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('ab'))));
  //   wrapTest(startState, joinForwardCommand, expectedEndState);
  // });

  // it('joins two lists', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`hi<${A}>`))), bulletListBuilder(listItemBuilder(paragraphBuilder('there'))));
  //   const expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('hi')), listItemBuilder(paragraphBuilder('there'))));
  //   wrapTest(startState, joinForwardCommand, expectedEndState);
  // });

  // it('does nothing in a nested node at the end of the document', () => {
  //   const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`there<${A}>`))));
  //   const expectedEndState = null/*same state*/;
  //   wrapTest(startState, joinForwardCommand, expectedEndState);
  // });

  // it('does nothing when it cannot join', () => {
  //   const startState = docBuilder(paragraphBuilder(`foo<${A}>`), bulletListBuilder(listItemBuilder(paragraphBuilder('bar'), bulletListBuilder(listItemBuilder(paragraphBuilder('baz'))))));
  //   const expectedEndState = null/*same state*/;
  //   wrapTest(startState, joinForwardCommand, expectedEndState);
  // });

  it('pulls the next block into a Blockquote', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`foo<${A}>`)), paragraphBuilder('bar'));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder(`foo<${A}>`), paragraphBuilder('bar')));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('joins two Blockquotes', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`hi<${A}>`)), blockquoteBuilder(paragraphBuilder('there')));
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('hi'), paragraphBuilder('there')));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('pulls the next block outside of a wrapping Blockquote', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`), blockquoteBuilder(paragraphBuilder('bar')));
    const expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('deletes a leaf Node at the end of the Document', () => {
    const startState = docBuilder(paragraphBuilder(`there<${A}>`), horizontalRuleBuilder());
    const expectedEndState = docBuilder(paragraphBuilder('there'));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });

  it('moves before it deletes a leaf Node', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`there<${A}>`)), horizontalRuleBuilder());
    const expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('there'), horizontalRuleBuilder()));
    wrapTest(startState, joinForwardCommand, expectedEndState);
  });
});

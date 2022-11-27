import { MarkName } from 'common/notebookEditor/mark';
import ist from 'ist';
import { Schema } from 'prosemirror-model';

import { AttributeType } from '../../attribute';
import { NodeGroup, NodeName } from '../../node/type';
import { toggleMarkCommand } from '../mark';
import { createState, getNotebookSchemaMarkBuilders, getNotebookSchemaNodeBuilders, getNotebookSchemaWithBuildersObj, wrapTest, A, B, ProseMirrorNodeWithTag } from '../test/testUtil';
import { liftCommand, splitBlockCommand, splitBlockKeepMarksCommand, wrapInCommand } from './node';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj();
const { schema: notebookSchema } = notebookSchemaWithBuildersObj;

const { blockquote: blockquouteType } = notebookSchema.nodes;
const { bold: boldType } = notebookSchema.marks;

const {
  [NodeName.BLOCKQUOTE]: blockquoteBuilder,
  [NodeName.BULLET_LIST]: bulletListBuilder,
  [NodeName.DOC]: docBuilder,
  [NodeName.HEADING]: headingBuilder,
  [NodeName.LIST_ITEM]: listItemBuilder,
  [NodeName.ORDERED_LIST]: orderedListBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.BLOCKQUOTE, NodeName.BULLET_LIST, NodeName.DOC, NodeName.HEADING, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH]);

const { [MarkName.BOLD]: boldBuilder, [MarkName.ITALIC]: italicBuilder } = getNotebookSchemaMarkBuilders([MarkName.BOLD, MarkName.ITALIC]);

// == Test ========================================================================
// -- Split -----------------------------------------------------------------------
describe('splitBlockCommand', () => {
  it('splits a Paragraph at the end', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>`)),
          expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder());
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('split a Paragraph in the middle', () => {
    const startState = docBuilder(paragraphBuilder(`foo<${A}>bar`)),
          expectedEndState = docBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Paragraph from a Heading', () => {
    const startState = docBuilder(headingBuilder(`foo<${A}>`)),
          expectedEndState = docBuilder(headingBuilder('foo'), paragraphBuilder());
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Heading in two when in the middle', () => {
    const startState = docBuilder(headingBuilder(`foo<${A}>bar`)),
          expectedEndState = docBuilder(headingBuilder('foo'), headingBuilder('bar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('deletes selected content', () => {
    const startState = docBuilder(paragraphBuilder(`fo<${A}>ob<${B}>ar`)),
          expectedEndState = docBuilder(paragraphBuilder('fo'), paragraphBuilder('ar'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a parent Block when a Node is selected', () => {
    const startState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a')), `<${A}>`, listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c')))),
          expectedEndState = docBuilder(orderedListBuilder(listItemBuilder(paragraphBuilder('a'))), orderedListBuilder(listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c'))));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('does not split the parent Block when at the start', () => {
    const startState = docBuilder(orderedListBuilder(`<${A}>`, listItemBuilder(paragraphBuilder('a')), listItemBuilder(paragraphBuilder('b')), listItemBuilder(paragraphBuilder('c')))),
          expectedEndState = null/*same state*/;
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits off a normal Paragraph when splitting at the start of a Text Block', () => {
    const startState = docBuilder(headingBuilder(`<${A}>foo`)),
          expectedEndState = docBuilder(paragraphBuilder(), headingBuilder('foo'));
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  const headingSchema = new Schema({ nodes: notebookSchema.spec.nodes.update(NodeName.HEADING, { content: 'inline*', marks: ''/*no marks*/ }).update('doc', { content: `${NodeName.HEADING} ${NodeGroup.BLOCK}*` }),  marks: notebookSchema.spec.marks });
  const hDocBuilder = (A: number) => {
    const hDoc = headingSchema.node('doc', null/*no attrs*/, [ headingSchema.node(NodeName.HEADING, { [AttributeType.Level]: 1 }, headingSchema.text('foobar'))]);
    (hDoc as ProseMirrorNodeWithTag).tag = { A, B: null/*none*/ };
    return hDoc;
  };
  it('splits a Paragraph from a Heading when a double Heading is not allowed', () => {
    const startState = hDocBuilder(4/*pos*/),
          expectedEndState = headingSchema.node('doc', null/*no attrs*/, [headingSchema.node('heading', { [AttributeType.Level]: 1 }, headingSchema.text('foo')), headingSchema.node('paragraph', null/*no attrs*/, headingSchema.text('bar'))]);
    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('will not try to reset the type of an empty leftover when the schema forbids it', () => {
    const startState = hDocBuilder(1/*pos*/),
          expectedEndState = headingSchema.node('doc', null/*no attrs*/, [headingSchema.node('heading', { [AttributeType.Level]: 1 }), headingSchema.node('paragraph', null/*no attrs*/, headingSchema.text('foobar'))]);
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

    const startState = doc,
          expectedEndState = schema.node('doc', null/*no attrs*/, [schema.node('paragraph', null/*no attrs*/, [schema.text('he')]), schema.node('paragraph', null/*no attrs*/, [schema.text('llo')])]);
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
    const startState = docBuilder(paragraphBuilder(`fo<${A}>o`)),
          expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  it('wraps multiple Paragraphs', () => {
    const startState = docBuilder(paragraphBuilder(`fo<${A}>o`), paragraphBuilder('bar'), paragraphBuilder(`ba<${B}>z`), paragraphBuilder('quux')),
          expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder('bar'), paragraphBuilder('baz')), paragraphBuilder('quux'));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  it('wraps an already wrapped node', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`fo<${A}>o`))),
          expectedEndState = docBuilder(blockquoteBuilder(blockquoteBuilder(paragraphBuilder('foo'))));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });

  it('can wrap a Node Selection', () => {
    const startState = docBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo')))),
          expectedEndState = docBuilder(blockquoteBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('foo')))));
    wrapTest(startState, wrapInBlockquote, expectedEndState);
  });
});

// -- Lift ------------------------------------------------------------------------
describe('liftCommand', () => {

  it('lifts out of a parent block', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder(`<${A}>foo`))),
          expectedEndState = docBuilder(paragraphBuilder(`<${A}>foo`));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('splits the parent block when necessary', () => {
    const startState = docBuilder(blockquoteBuilder(paragraphBuilder('foo'), paragraphBuilder(`<${A}>bar`), paragraphBuilder('baz'))),
          expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder('foo')), paragraphBuilder('bar'), blockquoteBuilder(paragraphBuilder('baz')));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('does nothing for a top-level block', () => {
    const startState = docBuilder(paragraphBuilder(`<${A}>foo`)),
          expectedEndState = null/*same state*/;
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('can lift out of a List', () => {
    const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>foo`)))),
          expectedEndState = docBuilder(paragraphBuilder('foo'));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('lifts out of the innermost parent', () => {
    const startState = docBuilder(blockquoteBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder(`foo<${A}>`))))),
          expectedEndState = docBuilder(blockquoteBuilder(paragraphBuilder(`foo<${A}>`)));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('can lift a NodeSelection', () => {
    const startState = docBuilder(blockquoteBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo'))))),
          expectedEndState = docBuilder(`<${A}>`, bulletListBuilder(listItemBuilder(paragraphBuilder('foo'))));
    wrapTest(startState, liftCommand, expectedEndState);
  });

  it('lifts out of a Nested List', () => {
    const startState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one'), bulletListBuilder(listItemBuilder(paragraphBuilder(`<${A}>sub1`)), listItemBuilder(paragraphBuilder('sub2')))), listItemBuilder(paragraphBuilder('two')))),
          expectedEndState = docBuilder(bulletListBuilder(listItemBuilder(paragraphBuilder('one'), paragraphBuilder(`<${A}>sub1`), bulletListBuilder(listItemBuilder(paragraphBuilder('sub2')))), listItemBuilder(paragraphBuilder('two'))));
    wrapTest(startState, liftCommand, expectedEndState);
  });
});


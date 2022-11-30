import { MarkName } from 'common/notebookEditor/mark';
import ist from 'ist';
import { Schema } from 'prosemirror-model';

import { AttributeType } from '../../attribute';
import { NodeGroup, NodeName } from '../../node/type';
import { toggleMarkCommand } from '../mark';
import { createTestState, getNotebookSchemaMarkBuilders, getNotebookSchemaNodeBuilders, getNotebookSchemaWithBuildersObj, wrapTest, A, B, ProseMirrorNodeWithTag } from '../test/testUtil';
import { splitBlockCommand, splitBlockKeepMarksCommand } from './node';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj(),
      { schema: notebookSchema } = notebookSchemaWithBuildersObj;

const { bold: boldType } = notebookSchema.marks;

const {
  [NodeName.DOC]: doc,
  [NodeName.HEADING]: h1,
  [NodeName.LIST_ITEM]: li,
  [NodeName.ORDERED_LIST]: ol,
  [NodeName.PARAGRAPH]: p,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.HEADING, NodeName.LIST_ITEM, NodeName.ORDERED_LIST, NodeName.PARAGRAPH]);

const { [MarkName.BOLD]: b, [MarkName.ITALIC]: i } = getNotebookSchemaMarkBuilders([MarkName.BOLD, MarkName.ITALIC]);

// == Test ========================================================================
// -- Split -----------------------------------------------------------------------
describe('splitBlockCommand', () => {
  it('splits a Paragraph at the end', () => {
    const startState = doc(p(`foo<${A}>`)),
          expectedEndState = doc(p('foo'), p());

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('split a Paragraph in the middle', () => {
    const startState = doc(p(`foo<${A}>bar`)),
          expectedEndState = doc(p('foo'), p('bar'));

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Paragraph from a Heading', () => {
    const startState = doc(h1(`foo<${A}>`)),
          expectedEndState = doc(h1('foo'), p());

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a Heading in two when in the middle', () => {
    const startState = doc(h1(`foo<${A}>bar`)),
          expectedEndState = doc(h1('foo'), h1('bar'));

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('deletes selected content', () => {
    const startState = doc(p(`fo<${A}>ob<${B}>ar`)),
          expectedEndState = doc(p('fo'), p('ar'));

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits a parent Block when a Node is selected', () => {
    const startState = doc(ol(li(p('a')), `<${A}>`, li(p('b')), li(p('c')))),
          expectedEndState = doc(ol(li(p('a'))), ol(li(p('b')), li(p('c'))));

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('does not split the parent Block when at the start', () => {
    const startState = doc(ol(`<${A}>`, li(p('a')), li(p('b')), li(p('c')))),
          expectedEndState = null/*same state*/;

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('splits off a normal Paragraph when splitting at the start of a Text Block', () => {
    const startState = doc(h1(`<${A}>foo`)),
          expectedEndState = doc(p(), h1('foo'));

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  const headingSchema = new Schema({ nodes: notebookSchema.spec.nodes.update(NodeName.HEADING, { content: 'inline*', marks: ''/*no marks*/ }).update('doc', { content: `${NodeName.HEADING} ${NodeGroup.BLOCK}*` }),  marks: notebookSchema.spec.marks });
  const hDoc = (A: number) => {
    const hDoc = headingSchema.node('doc', null/*no attrs*/, [ headingSchema.node(NodeName.HEADING, { [AttributeType.Level]: 1 }, headingSchema.text('foobar'))]);
    (hDoc as ProseMirrorNodeWithTag).tag = { A, B: null/*none*/ };
    return hDoc;
  };
  it('splits a Paragraph from a Heading when a double Heading is not allowed', () => {
    const startState = hDoc(4/*pos*/),
          expectedEndState = headingSchema.node('doc', null/*no attrs*/, [headingSchema.node('heading', { [AttributeType.Level]: 1 }, headingSchema.text('foo')), headingSchema.node('paragraph', null/*no attrs*/, headingSchema.text('bar'))]);

    wrapTest(startState, splitBlockCommand, expectedEndState);
  });

  it('will not try to reset the type of an empty leftover when the schema forbids it', () => {
    const startState = hDoc(1/*pos*/),
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
    const startStateDoc = doc(p(b(`foo<${A}>`), 'bar'));
    let state = createTestState(startStateDoc as ProseMirrorNodeWithTag);

    splitBlockKeepMarksCommand(state, tr => state = state.apply(tr));
    ist(state.storedMarks!.length, 1/*stored Bold*/);
  });

  it('preserves the stored marks', () => {
    const startStateDoc = doc(p(i(`foo<${A}>`)));
    let state = createTestState(startStateDoc as ProseMirrorNodeWithTag);
    toggleMarkCommand(boldType, {/*no attrs*/})(state, tr => state = state.apply(tr));
    splitBlockKeepMarksCommand(state, tr => state = state.apply(tr));
    ist(state.storedMarks!.length, 2/*stored Bold and Italic*/);
  });
});


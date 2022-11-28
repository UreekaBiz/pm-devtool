import ist from 'ist';

import { MarkName } from '../../../notebookEditor/mark';
import { NodeName } from '../../../notebookEditor/node';
import { createTestState, getNotebookSchemaWithBuildersObj, getNotebookSchemaNodeBuilders, getNotebookSchemaMarkBuilders, validateNodeWithTag, wrapTest, A, B } from '../test/testUtil';
import { toggleMarkCommand } from './mark';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj();
const { bold: boldType, italic: italicType } = notebookSchemaWithBuildersObj.schema.marks;

const { [NodeName.DOC]: doc, [NodeName.PARAGRAPH]: p } = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.PARAGRAPH]);
const { [MarkName.BOLD]: b, [MarkName.ITALIC]: i } = getNotebookSchemaMarkBuilders([MarkName.BOLD, MarkName.ITALIC]);

// == Mark ========================================================================
describe('toggleMarkCommand', () => {
  const toggleItalic = toggleMarkCommand(italicType, {/*no attrs*/});
  const toggleBold = toggleMarkCommand(boldType, {/*no attrs*/});

  it('can add a Mark', () => {
    const startState = doc(p(`one <${A}>two<${B}>`)),
          expectedEndState = doc(p('one ', i('two')));

    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can stack Marks', () => {
    const startState = doc(p(`one <${A}>tw`, b(`o<${B}>`))),
          expectedEndState = doc(p('one ', i('tw', b('o'))));

    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can remove Marks', () => {
    const startState = doc(p(i(`one <${A}>two<${B}>`))),
          expectedEndState = doc(p(i('one '), 'two'));

    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can toggle pending Marks', () => {
    const startState = doc(p(`hell<${A}>o`));
    if(!validateNodeWithTag(startState)) throw new Error('startState is not a ProseMirrorNodeWithTag');

    let state = createTestState(startState);
    toggleItalic(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
    toggleBold(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 2);
    toggleItalic(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
  });

  it('skips whitespace at selection ends when adding Marks', () => {
    const startState = doc(p(`one<${A}> two  <${B}>three`)),
          expectedEndState = doc(p('one ', i('two'), '  three'));

    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('does not skip whitespace-only selections', () => {
    const startState = doc(p(`one<${A}> <${B}>two`)),
          expectedEndState = doc(p('one', i(' '), 'two'));
          
    wrapTest(startState, toggleItalic, expectedEndState);
  });
});

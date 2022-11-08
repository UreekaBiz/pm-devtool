import ist from 'ist';

import { MarkName } from '../../../notebookEditor/mark';
import { NodeName } from '../../../notebookEditor/node';
import { createState, validateNodeWithTag, wrapTest, A, B, getNotebookSchemaWithBuildersObj, getNotebookSchemaNodeBuilders, getNotebookSchemaMarkBuilders } from '../testUtil';
import { toggleMarkCommand } from './mark';

// ********************************************************************************
// == Constant ====================================================================
const notebookSchemaWithBuildersObj = getNotebookSchemaWithBuildersObj();
const { bold: boldType, italic: italicType } = notebookSchemaWithBuildersObj.schema.marks;

const { [NodeName.DOC]: docBuilder, [NodeName.PARAGRAPH]: paragraphBuilder } = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.PARAGRAPH]);
const { [MarkName.BOLD]: boldBuilder, [MarkName.ITALIC]: italicBuilder } = getNotebookSchemaMarkBuilders([MarkName.BOLD, MarkName.ITALIC]);

// == Mark ========================================================================
describe('toggleMarkCommand', () => {
  const toggleItalic = toggleMarkCommand(italicType, {/*no attrs*/});
  const toggleBold = toggleMarkCommand(boldType, {/*no attrs*/});

  it('can add a mark', () => {
    const startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`));
    const expectedEndState = docBuilder(paragraphBuilder('one ', italicBuilder('two')));
    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can stack marks', () => {
    const startState = docBuilder(paragraphBuilder(`one <${A}>tw`, boldBuilder(`o<${B}>`)));
    const expectedEndState = docBuilder(paragraphBuilder('one ', italicBuilder('tw', boldBuilder('o'))));
    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can remove marks', () => {
    const startState = docBuilder(paragraphBuilder(italicBuilder(`one <${A}>two<${B}>`)));
    const expectedEndState = docBuilder(paragraphBuilder(italicBuilder('one '), 'two'));
    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('can toggle pending marks', () => {
    const startState = docBuilder(paragraphBuilder(`hell<${A}>o`));
    if(!validateNodeWithTag(startState)) throw new Error('startState is not a ProseMirrorNodeWithTag');

    let state = createState(startState);
    toggleItalic(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
    toggleBold(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 2);
    toggleItalic(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
  });

  it('skips whitespace at selection ends when adding marks', () => {
    const startState = docBuilder(paragraphBuilder(`one<${A}> two  <${B}>three`));
    const expectedEndState = docBuilder(paragraphBuilder('one ', italicBuilder('two'), '  three'));
    wrapTest(startState, toggleItalic, expectedEndState);
  });

  it('does not skip whitespace-only selections', () => {
    const startState = docBuilder(paragraphBuilder(`one<${A}> <${B}>two`));
    const expectedEndState = docBuilder(paragraphBuilder('one', italicBuilder(' '), 'two'));
    wrapTest(startState, toggleItalic, expectedEndState);
  });
});

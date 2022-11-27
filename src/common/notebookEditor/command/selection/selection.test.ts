import { getNotebookSchemaNodeBuilders, wrapTest, A, B } from '../test/testUtil';
import { NodeName } from '../../node/type';
import {  selectTextBlockStartOrEndCommand } from './selection';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: docBuilder,
  [NodeName.PARAGRAPH]: paragraphBuilder,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.PARAGRAPH]);

// == Node ========================================================================
describe('selectTextBlockStartOrEndCommand', () => {
  it('can move the cursor when the Selection is empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the Selection is not empty', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two<${B}>`));
    expectedEndState = docBuilder(paragraphBuilder(`one two<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the selection crosses multiple text blocks', () => {
    let startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`)),
        expectedEndState = docBuilder(paragraphBuilder(`<${A}>one two`), paragraphBuilder('three four'));
    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = docBuilder(paragraphBuilder(`one <${A}>two`), paragraphBuilder(`three<${B}> four`));
    expectedEndState = docBuilder(paragraphBuilder('one two'), paragraphBuilder(`three four<${A}>`));
    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });
});

import { getNotebookSchemaNodeBuilders, wrapTest, A, B } from '../test/testUtil';
import { NodeName } from '../../node/type';
import {  selectTextBlockStartOrEndCommand } from './selection';

// ********************************************************************************
// == Constant ====================================================================
const {
  [NodeName.DOC]: doc,
  [NodeName.PARAGRAPH]: p,
} = getNotebookSchemaNodeBuilders([NodeName.DOC, NodeName.PARAGRAPH]);

// == Node ========================================================================
describe('selectTextBlockStartOrEndCommand', () => {
  it('can move the cursor when the Selection is empty', () => {
    let startState = doc(p(`one <${A}>two`)),
        expectedEndState = doc(p(`<${A}>one two`));

    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = doc(p(`one <${A}>two`));
    expectedEndState = doc(p(`one two<${A}>`));

    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the Selection is not empty', () => {
    let startState = doc(p(`one <${A}>two<${B}>`)),
        expectedEndState = doc(p(`<${A}>one two`));

    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = doc(p(`one <${A}>two<${B}>`));
    expectedEndState = doc(p(`one two<${A}>`));

    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });

  it('can move the cursor when the selection crosses multiple text blocks', () => {
    let startState = doc(p(`one <${A}>two`), p(`three<${B}> four`)),
        expectedEndState = doc(p(`<${A}>one two`), p('three four'));

    wrapTest(startState, selectTextBlockStartOrEndCommand('start', NodeName.PARAGRAPH), expectedEndState);

    startState = doc(p(`one <${A}>two`), p(`three<${B}> four`));
    expectedEndState = doc(p('one two'), p(`three four<${A}>`));

    wrapTest(startState, selectTextBlockStartOrEndCommand('end', NodeName.PARAGRAPH), expectedEndState);
  });
});

import { schema, doc, p, em } from 'prosemirror-test-builder';

import { toggleMarkCommand } from 'common';
import { applyCommand, validateNodeWithTag, TEST_POSITION_A } from 'notebookEditor/test/util';

// ********************************************************************************
// == Mark ========================================================================
describe('toggleMarkCommand', () => {
  const toggleEm = toggleMarkCommand(schema.marks.em, {/*no attrs*/}), toggleStrong = toggleMarkCommand(schema.marks.strong, {/*no attrs*/});

  it('can add a mark', () => {
    const startState = doc(p(`one ${TEST_POSITION_A}two<b>`));
    if(!validateNodeWithTag(startState)) throw new Error('startState is not a ProseMirrorNodeWithTag');

    const expectedState = doc(p('one ', em('two')));
    if(!validateNodeWithTag(expectedState)) throw new Error('expectedState is not a ProseMirrorNodeWithTag');

    applyCommand(startState, toggleEm, expectedState);
  });

  // it('can stack marks', () => {
  //   applyCommand(doc(p(`one ${TEST_POSITION_A}tw`, strong('o<b>'))), toggleEm,
  //     doc(p('one ', em('tw', strong('o')))));
  // });

  // it('can remove marks', () => {
  //   applyCommand(doc(p(em(`one ${TEST_POSITION_A}two<b>`))), toggleEm,
  //     doc(p(em('one '), 'two')));
  // });

  // it('can toggle pending marks', () => {
  //   let state = createState(doc(p(`hell${TEST_POSITION_A}o`)));
  //   toggleEm(state, tr => state = state.applyCommand(tr));
  //   ist(state.storedMarks!.length, 1);
  //   toggleStrong(state, tr => state = state.applyCommand(tr));
  //   ist(state.storedMarks!.length, 2);
  //   toggleEm(state, tr => state = state.applyCommand(tr));
  //   ist(state.storedMarks!.length, 1);
  // });

  // it('skips whitespace at selection ends when adding marks', () => {
  //   applyCommand(doc(p(`one${TEST_POSITION_A} two  <b>three`)), toggleEm,
  //     doc(p('one ', em('two'), '  three')));
  // });

  // it('does not skip whitespace-only selections', () => {
  //   applyCommand(doc(p(`one${TEST_POSITION_A} <b>two`)), toggleEm,
  //     doc(p('one', em(' '), 'two')));
  // });
});

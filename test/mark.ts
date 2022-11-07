import { schema, doc, p, em, strong } from 'prosemirror-test-builder';
import ist from 'ist';

import { toggleMarkCommand } from '../src/common';

import { A, B, wrapTest, validateNodeWithTag, createState } from './util';

// ********************************************************************************
// == Mark ========================================================================
describe('toggleMarkCommand', () => {
  const toggleEm = toggleMarkCommand(schema.marks.em, {/*no attrs*/});
  const toggleStrong = toggleMarkCommand(schema.marks.strong, {/*no attrs*/});

  it('can add a mark', () => {
    const startState = doc(p(`one ${A}two${B}`));
    const expectedEndState = doc(p('one ', em('two')));
    wrapTest(startState, toggleEm, expectedEndState);
  });

  it('can stack marks', () => {
    const startState = doc(p(`one ${A}tw`, strong(`o${B}`)));
    const expectedEndState = doc(p('one ', em('tw', strong('o'))));
    wrapTest(startState, toggleEm, expectedEndState);
  });

  it('can remove marks', () => {
    const startState = doc(p(em(`one ${A}two${B}`)));
    const expectedEndState = doc(p(em('one '), 'two'));
    wrapTest(startState, toggleEm, expectedEndState);
  });

  it('can toggle pending marks', () => {
    const startState = doc(p(`hell${A}o`));
    if(!validateNodeWithTag(startState)) throw new Error('startState is not a ProseMirrorNodeWithTag');

    let state = createState(startState);
    toggleEm(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
    toggleStrong(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 2);
    toggleEm(state, tr => state = state.apply(tr));
    ist(state.storedMarks?.length, 1);
  });

  it('skips whitespace at selection ends when adding marks', () => {
    const startState = doc(p(`one${A} two  ${B}three`));
    const expectedEndState = doc(p('one ', em('two'), '  three'));

    wrapTest(startState, toggleEm, expectedEndState);
  });

  it('does not skip whitespace-only selections', () => {
    const startState = doc(p(`one${A} ${B}two`));
    const expectedEndState = doc(p('one', em(' '), 'two'));

    wrapTest(startState, toggleEm, expectedEndState);
  });
});

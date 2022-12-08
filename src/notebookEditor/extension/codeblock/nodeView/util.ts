import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { highlightSelectionMatches, selectNextOccurrence } from '@codemirror/search';
import { Compartment, EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { drawSelection, highlightActiveLineGutter, highlightActiveLine, keymap, lineNumbers, rectangularSelection, EditorView as CodeMirrorEditorView } from '@codemirror/view';
import { setBlockType } from 'prosemirror-commands';
import { GapCursor } from 'prosemirror-gapcursor';
import { redo, undo } from 'prosemirror-history';
import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import { TextSelection, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { getPosType, isCodeBlockNode, CodeBlockLanguage } from 'common';

import { highlightCodeBlockSelection } from './mark';

// ********************************************************************************
// == State =======================================================================
export const createCodeMirrorViewState = (outerView: EditorView, getPos: getPosType, initialTextContent: string, languageCompartment: Compartment) => CodeMirrorEditorState.create({
  extensions: [
    // enable autocompletion per Language
    autocompletion(),

    // whenever the cursor is next to a Bracket, highlight it
    // and the one that matches it
    bracketMatching(),

    // when a closeable bracket is inserted,its closing one
    // is immediately inserted after it
    closeBrackets(),

    // reset Selection on CodeMirrorView blur
    CodeMirrorEditorView.domEventHandlers({ blur(event, codeMirrorView) { codeMirrorView.dispatch({ selection: { anchor: 0/*start of CodeMirrorView*/ } }); } }),

    // allow multiple Selections
    CodeMirrorEditorState.allowMultipleSelections.of(true),

    // draw the cursor as a vertical line
    drawSelection({ cursorBlinkRate: 1000/*ms*/ }),

    // allow the gutter to be folded (collapsed) per lines
    foldGutter(),

    // highlight the current line
    highlightActiveLineGutter(),

    // highlight Text that matches the Selection
    highlightSelectionMatches(),

    // mark Lines that have a cursor in them
    highlightActiveLine(),

    // enable re-indentation on input, which may be triggered per language
    indentOnInput(),

    // Keymap of expected behavior
    keymap.of([
      { key: 'Mod-d', run: selectNextOccurrence, preventDefault: true/*prevent default for mod-D*/ },
      { key: 'ArrowUp', run: (codeMirrorView) => maybeEscapeFromCodeBlock('line', -1/*up*/, outerView, getPos, codeMirrorView) },
      { key: 'ArrowLeft', run: (codeMirrorView) => maybeEscapeFromCodeBlock('char', -1/*left*/, outerView, getPos, codeMirrorView) },
      { key: 'ArrowDown', run: (codeMirrorView) => maybeEscapeFromCodeBlock('line', 1/*down*/, outerView, getPos, codeMirrorView) },
      { key: 'ArrowRight', run: (codeMirrorView) => maybeEscapeFromCodeBlock('char', 1/*right*/, outerView, getPos, codeMirrorView) },
      { key: 'Mod-z', run: () => undo(outerView.state, outerView.dispatch) },
      { key: 'Mod-Shift-z', run: () => redo(outerView.state, outerView.dispatch) },
      { key: 'Backspace', run: (codeMirrorView) => maybeDeleteCodeBlock(outerView, codeMirrorView) },
      { key: 'Mod-Backspace', run: (codeMirrorView) => maybeDeleteCodeBlock(outerView, codeMirrorView) },
      { key: "Mod-h", preventDefault: true/*prevent default for mod-H*/, run: highlightCodeBlockSelection },
      ...defaultKeymap,
      ...foldKeymap,
      ...closeBracketsKeymap,
      ...completionKeymap,
      indentWithTab,
    ]),

    // show Line Numbers
    lineNumbers(),

    // allow rectangular Selections
    rectangularSelection(),

    // allow syntax highlighting in the CodeMirror Editor
    syntaxHighlighting(defaultHighlightStyle),

    // -- Attribute -----------------------------------------------------------
    languageCompartment.of([/*default empty*/]),
  ],

  doc: initialTextContent,
});


// == Change ======================================================================
// NOTE: this is inspired by https://prosemirror.net/examples/codemirror/ #update
export const computeChangedTextRange = (currentCodeBlockText: string, newCodeBlockText: string) => {
  if(currentCodeBlockText === newCodeBlockText) return false/*CodeBlock Text did not change*/;
  let codeBlockTextStart = 0/*by definition*/,
      oldCodeBlockTextEnd = currentCodeBlockText.length,
      newCodeBlockTextEnd = newCodeBlockText.length;

  while(codeBlockTextStart < oldCodeBlockTextEnd
    && currentCodeBlockText.charCodeAt(codeBlockTextStart) === newCodeBlockText.charCodeAt(codeBlockTextStart)) {
    codeBlockTextStart += 1/*increase to account for the characters that did not change in the CodeBlock*/;
  }

  while(oldCodeBlockTextEnd > codeBlockTextStart
    && newCodeBlockTextEnd > codeBlockTextStart
    && currentCodeBlockText.charCodeAt(oldCodeBlockTextEnd - 1/*account for indexing*/) === newCodeBlockText.charCodeAt(newCodeBlockTextEnd - 1/*account for indexing*/)) {
    oldCodeBlockTextEnd -= 1/*decrease to account for the characters that did not change  in the CodeBlock*/;
    newCodeBlockTextEnd -= 1/*decrease to account for the characters that did not change  in the CodeBlock*/;
  }

  return { from: codeBlockTextStart, to: oldCodeBlockTextEnd, text: newCodeBlockText.slice(codeBlockTextStart, newCodeBlockTextEnd) };
};

// == Selection ===================================================================
/** sync the CodeMirrorView Selection with the ProseMirrorView one */
export const syncSelections = (codeMirrorView: CodeMirrorEditorView, outerView: EditorView, getPos: getPosType) => {
  const offsetIntoCodeBlock = (typeof getPos === 'function' ? getPos() : 0/*start of CodeBlock*/) + 1/*inside the Codeblock*/,
        codeMirrorViewAnchor = codeMirrorView.state.selection.main.from + offsetIntoCodeBlock,
        codeMirrorViewHead = codeMirrorView.state.selection.main.to + offsetIntoCodeBlock;

  // prevent toggle CodeBlock into undo error case,
  // since codeMirrorView has no isDestroyed() method
  if(isNaN(codeMirrorViewAnchor) || isNaN(codeMirrorViewHead)) {
    outerView.focus();
    return/*do nothing*/;
  } /* else -- CodeMirrorView still exists */

  const outerViewSelection = TextSelection.create(outerView.state.doc, codeMirrorViewAnchor, codeMirrorViewHead);
  if(outerViewSelection.eq(outerView.state.selection)) return/*no need to sync*/;
  outerView.dispatch(outerView.state.tr.setSelection(outerViewSelection));
};

/** ensure the outerView contents match the codeMirrorView contents */
export const accountForCodeBlockValueChange = (outerView: EditorView, codeBlockNode: ProseMirrorNode, getPos: getPosType, textUpdate: string) => {
  const changedTextRange = computeChangedTextRange(codeBlockNode.textContent, textUpdate);
  if(!changedTextRange || !(typeof getPos === 'function')) return/*do nothing*/;

  const startOfCodeBlock = getPos() + 1/*inside the CodeBlock*/;

  const { tr: outerViewTr } = outerView.state;
  outerViewTr.replaceWith(startOfCodeBlock + changedTextRange.from, startOfCodeBlock + changedTextRange.to, changedTextRange.text ? outerView.state.schema.text(changedTextRange.text) : Fragment.empty);
  outerView.dispatch(outerViewTr);
};

// == Key Handling ================================================================
// NOTE: this is inspired by https://prosemirror.net/examples/codemirror/ #maybeEscape
export const maybeEscapeFromCodeBlock = (unit: 'char' | 'line', direction: -1/*left/upwards*/ | 1/*right/downwards*/, outerEditorView: EditorView, getPos: getPosType, codeMirrorView: CodeMirrorEditorView) => {
  const { main: mainCodeMirrorSelectionRange } = codeMirrorView.state.selection,
        lineAtFrom = codeMirrorView.state.doc.lineAt(mainCodeMirrorSelectionRange.from),
        lineAmount = codeMirrorView.state.doc.lines;

  if(mainCodeMirrorSelectionRange.to !== mainCodeMirrorSelectionRange.from /*Selection not empty*/
    || lineAtFrom.number !== (direction < 0/*left/upwards*/ ? 1/*first Line*/ : lineAmount/*lastLine*/)
    || (unit === 'char' && mainCodeMirrorSelectionRange.from !== (direction < 0/*left/upwards*/ ? 0/*first position inside CodeBlock*/ : lineAtFrom.to))
    || typeof getPos !== 'function') return false/*no need to leave CodeBlock, do not handle*/;

  outerEditorView.focus();
  const codeBlockNode = outerEditorView.state.doc.nodeAt(getPos());
  if(!codeBlockNode || !isCodeBlockNode(codeBlockNode)) return false/*not a CodeBlock, do not handle*/;

  const resultingPosition = getPos() + (direction < 0/*left/upwards*/ ? 0/*start of CodeBlock*/ : codeBlockNode.nodeSize);
  let newOuterViewSelection = Selection.near(outerEditorView.state.doc.resolve(resultingPosition), direction);

  const { tr } = outerEditorView.state;
  if(newOuterViewSelection.eq(outerEditorView.state.selection)) {
    newOuterViewSelection = new GapCursor(tr.doc.resolve(resultingPosition));
  } /* else -- Selection is different, no need to set GapCursor */

  tr.setSelection(newOuterViewSelection).scrollIntoView();
  outerEditorView.dispatch(tr);
  outerEditorView.focus();
  return true/*handled*/;
};

/** check if the CodeBlock is in conditions to be deleted by a Backspace */
export const maybeDeleteCodeBlock = (outerView: EditorView, codeMirrorView: CodeMirrorEditorView) => {
  const { main: mainCodeMirrorSelectionRange  } = codeMirrorView.state.selection;
  if(!(mainCodeMirrorSelectionRange.empty && mainCodeMirrorSelectionRange.from === 0)) return false/*do not handle Backspace*/;

  setBlockType(outerView.state.schema.nodes.paragraph)(outerView.state, outerView.dispatch);

  // focus the outerView after DOM changes
  setTimeout(() => outerView.focus(), 0/*T&E*/);
  return true/*handled*/;
};

// == Attribute ===================================================================
const CodeBlockLanguages = {
  [CodeBlockLanguage.CSS]: css,
  [CodeBlockLanguage.HTML]: html,
  [CodeBlockLanguage.JavaScript]: javascript,
};
export const setCodeBlockLanguage = (codeMirrorView: CodeMirrorEditorView, languageCompartment: Compartment, language: CodeBlockLanguage) => {
  codeMirrorView.dispatch({ effects: languageCompartment.reconfigure(CodeBlockLanguages[language]()) });
};

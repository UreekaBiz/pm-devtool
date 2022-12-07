import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView as CodeMirrorEditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import { TextSelection, Selection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import { setBlockType } from 'prosemirror-commands';

import { getPosType, isCodeBlockNode, CodeBlockLanguage } from 'common';

// ********************************************************************************
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
export const maybeEscapeFromCodeBlock = (unit: 'char' | 'line', direction: -1/*left/upwards*/ | 1/*right/downwards*/, outerEditorView: EditorView, getPos: getPosType, codeMirrorEditorView: CodeMirrorEditorView) => {
  const { main: mainCodeMirrorSelectionRange } = codeMirrorEditorView.state.selection,
        lineAtFrom = codeMirrorEditorView.state.doc.lineAt(mainCodeMirrorSelectionRange.from),
        lineAmount = codeMirrorEditorView.state.doc.lines;

  if(mainCodeMirrorSelectionRange.to !== mainCodeMirrorSelectionRange.from /*Selection not empty*/
    || lineAtFrom.number !== (direction < 0/*left/upwards*/ ? 1/*first Line*/ : lineAmount/*lastLine*/)
    || (unit === 'char' && mainCodeMirrorSelectionRange.from !== (direction < 0/*left/upwards*/ ? 0/*first position inside CodeBlock*/ : lineAtFrom.to))
    || typeof getPos !== 'function') return false/*no need to leave CodeBlock, do not handle*/;

  outerEditorView.focus();
  const codeBlockNode = outerEditorView.state.doc.nodeAt(getPos());
  if(!codeBlockNode || !isCodeBlockNode(codeBlockNode)) return false/*not a CodeBlock, do not handle*/;

  const resultingPosition = getPos() + (direction < 0/*left/upwards*/ ? 0/*start of CodeBlock*/ : codeBlockNode.nodeSize),
        newOuterViewSelection = Selection.near(outerEditorView.state.doc.resolve(resultingPosition), direction);

  const { tr } = outerEditorView.state;
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
  setTimeout(() => outerView.focus(), 20/*T&E*/);
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

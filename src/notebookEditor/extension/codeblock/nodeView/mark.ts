import { Extension as CodeMirrorExtension, StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView as CodeMirrorEditorView } from '@codemirror/view';

// ********************************************************************************
// == Type ========================================================================
type CodeBlockHighlightEffectType = { from: number; to: number; };

// == Constant ====================================================================
const CODEBLOCK_MARK_HIGHLIGHT_CLASS = 'codeBlockMark-highlight';

// == Decoration Definition =======================================================
const codeBlockMarkHighlight = Decoration.mark({ class: CODEBLOCK_MARK_HIGHLIGHT_CLASS });

// == StateField ==================================================================
const codeBlockHighlightStateField = StateField.define<DecorationSet>({
  create: () => Decoration.none/*default no decorations*/,

  update: (decorationSet, tr) => {
    // map the decorationSet
    decorationSet = decorationSet.map(tr.changes);

    // update the decorationSet and return it
    for(const effect of tr.effects) {
      if(!effect.is(addCodeBlockHighlight)) continue/*ignore effect*/;

      // extend the decorationSet with the new ranges
      decorationSet = decorationSet.update({ add: [codeBlockMarkHighlight.range(effect.value.from, effect.value.to)] });
    }
    return decorationSet;
  },

  provide: (stateField) => CodeMirrorEditorView.decorations.from(stateField),
});

// == Add =========================================================================
const addCodeBlockHighlight = StateEffect.define<CodeBlockHighlightEffectType>({
  map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
});

// == Selection ===================================================================
export const highlightCodeBlockSelection = (codeMirrorView: CodeMirrorEditorView) => {
  const effects: StateEffect<CodeBlockHighlightEffectType | CodeMirrorExtension | DecorationSet>[] = codeMirrorView.state.selection.ranges
    .filter(selectionRange => !selectionRange.empty).map(({ from, to }) => addCodeBlockHighlight.of({ from, to }));
  if(!effects.length) return false/*no CodeBlockHighlight effects to add*/;

  // if the field is not defined yet, add it
  if(!codeMirrorView.state.field(codeBlockHighlightStateField, false/*do not expect the field to exist previously*/)) {
    effects.push(StateEffect.appendConfig.of([codeBlockHighlightStateField]));
  } /* else -- the field is already defined */

  codeMirrorView.dispatch({ effects });
  return true/*effects added*/;
};

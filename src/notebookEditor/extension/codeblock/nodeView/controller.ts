import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { drawSelection, highlightActiveLineGutter, highlightActiveLine, keymap, lineNumbers, rectangularSelection, EditorView as CodeMirrorEditorView } from '@codemirror/view';
import { highlightSelectionMatches, selectNextOccurrence } from '@codemirror/search';
import { EditorState as CodeMirrorEditorState } from '@codemirror/state';
import { redo, undo } from 'prosemirror-history';
import { Node as ProseMirrorNode } from 'prosemirror-model';

import { getPosType, CodeBlockNodeType, AttributeType, CodeBlockLanguage } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';
import { AbstractNodeController } from 'notebookEditor/model/AbstractNodeController';

import { CodeBlockModel } from './model';
import { CodeBlockStorage } from './storage';
import { maybeDeleteCodeBlock, computeChangedTextRange, syncSelections, maybeEscapeFromCodeBlock, setCodeBlockLanguage, accountForCodeBlockValueChange } from './util';
import { CodeBlockView } from './view';

// ********************************************************************************
export class CodeBlockController extends AbstractNodeController<CodeBlockNodeType, CodeBlockStorage, CodeBlockModel, CodeBlockView> {
  // == Lifecycle =================================================================
  public constructor(editor: Editor, node: CodeBlockNodeType, codeBlockStorage: CodeBlockStorage, getPos: getPosType) {
    const model = new CodeBlockModel(editor, node, codeBlockStorage, getPos),
          view = new CodeBlockView(model, editor, node, codeBlockStorage, getPos);

    super(model, view, editor, node, codeBlockStorage, getPos);
    this.setupCodeMirrorView();
  }

  private setupCodeMirrorView() {
    const state = CodeMirrorEditorState.create({
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
          { key: 'ArrowUp', run: (codeMirrorView) => maybeEscapeFromCodeBlock('line', -1, this.nodeView.outerView, this.getPos, codeMirrorView) },
          { key: 'ArrowLeft', run: (codeMirrorView) => maybeEscapeFromCodeBlock('char', -1, this.nodeView.outerView, this.getPos, codeMirrorView) },
          { key: 'ArrowDown', run: (codeMirrorView) => maybeEscapeFromCodeBlock('line', 1, this.nodeView.outerView, this.getPos, codeMirrorView) },
          { key: 'ArrowRight', run: (codeMirrorView) => maybeEscapeFromCodeBlock('char', 1, this.nodeView.outerView, this.getPos, codeMirrorView) },
          { key: 'Mod-z', run: () => undo(this.nodeView.outerView.state, this.nodeView.outerView.dispatch) },
          { key: 'Mod-Shift-z', run: () => redo(this.nodeView.outerView.state, this.nodeView.outerView.dispatch) },
          { key: 'Backspace', run: (codeMirrorView) => maybeDeleteCodeBlock(this.nodeView.outerView, codeMirrorView) },
          { key: 'Mod-Backspace', run: (codeMirrorView) => maybeDeleteCodeBlock(this.nodeView.outerView, codeMirrorView) },
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
      ],

      doc: this.node.textContent,
    });

    const codeMirrorView = new CodeMirrorEditorView({
      state,
      dispatch: (tr) => {
        codeMirrorView.update([tr]);

        if(!this.nodeModel.isUpdating) {
          const textUpdate = tr.state.toJSON().doc;
          accountForCodeBlockValueChange(this.nodeView.outerView, this.node, this.getPos, textUpdate);
          syncSelections(codeMirrorView, this.nodeView.outerView, this.getPos);
        } /* else -- updating */

      },
    });

    this.nodeView.codeMirrorViewContainer.append(codeMirrorView.dom);
    setCodeBlockLanguage(codeMirrorView, this.nodeModel.languageCompartment, this.node.attrs[AttributeType.Language] ?? CodeBlockLanguage.JavaScript/*default*/);
    this.nodeView.codeMirrorView = codeMirrorView;
  }

  // == ProseMirror ===============================================================
  public update(node: ProseMirrorNode) {
    const superUpdate = super.update(node);
    if(!superUpdate) return false/*did not receive the right type of Node*/;
    if(!this.nodeView.codeMirrorView) return false/*not set yet*/;

    if(node.attrs[AttributeType.Language] !== this.node.attrs[AttributeType.Language]) {
      setCodeBlockLanguage(this.nodeView.codeMirrorView, this.nodeModel.languageCompartment, node.attrs[AttributeType.Language]);
    }

    const currentCodeBlockText = this.nodeView.codeMirrorView.state.doc.toString(),
          newCodeBlockText = node.textContent;
    const changedTextRange = computeChangedTextRange(currentCodeBlockText, newCodeBlockText);
    if(changedTextRange) {
      try {
        this.nodeModel.isUpdating = true/*start update*/;
        this.nodeView.codeMirrorView.dispatch({
          changes: { from: changedTextRange.from, to: changedTextRange.to, insert: changedTextRange.text },
          selection: { anchor: changedTextRange.from + changedTextRange.text.length },
        });

      } finally {
        this.nodeModel.isUpdating = false/*end update*/;
      }
    } /* else -- no changes to account for */

    return true/*updated*/;
  }

  // .. Selection .................................................................
  // REF: https://prosemirror.net/examples/codemirror/ #selectNode
  /** focus the CodeMirrorView when the CodeBlock is selected */
  public selectNode() {
    if(!this.nodeView.codeMirrorView) return/*not set yet, nothing to do*/;
    this.nodeView.codeMirrorView?.focus();
  }

  // REF: https://prosemirror.net/examples/codemirror/ #setSelection
  /** set the selection inside the CodeMirrorView */
  public setSelection(anchor: number, head: number)  {
    if(!this.nodeView.codeMirrorView) return/*not set yet, nothing to do*/;
    if(!this.nodeView.codeMirrorView.hasFocus) return/*the codeMirrorView is not currently focused*/;

    try {
      this.nodeModel.isUpdating = true/*update started*/;
      this.nodeView.codeMirrorView.dispatch({ selection: { anchor, head } });
      this.nodeView.codeMirrorView.focus();
      syncSelections(this.nodeView.codeMirrorView, this.nodeView.outerView, this.getPos);
    } finally {
      this.nodeModel.isUpdating = false/*update finished*/;
    }
  }

  // .. Event .....................................................................
  // REF: https://prosemirror.net/examples/codemirror/ #stopEvent
  /**
   * prevent the outer EditorView from trying to handle DOM events
   * that bubble up from the CodeMirrorView
   */
  public stopEvent(event: Event) {
    return true/*outer EditorView will not handle the event*/;
  }

  // .. Mutation ..................................................................
  /** ignore all Mutations, since they should be handled by CodeMirror */
  public ignoreMutation(mutation: MutationRecord | { type: 'selection'; target: Element; }) {
    return true/*ignore all mutations*/;
  }
}

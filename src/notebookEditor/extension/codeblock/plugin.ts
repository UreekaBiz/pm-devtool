import Prism from 'prismjs';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, AttributeType } from 'common';

import { Editor } from 'notebookEditor/editor/Editor';

import { getCodeBlockViewStorage, CodeBlockController } from './nodeView';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
export const codeBlockPluginKey = new PluginKey<CodeBlockPluginState>('codeBlockPluginKey');

// == Class =======================================================================
export class CodeBlockPluginState {
  constructor() {/*nothing additional*/}

  // produce a new Plugin state
  public apply = (tr: Transaction, thisPluginState: CodeBlockPluginState, oldEditorState: EditorState, newEditorState: EditorState) => {
    return this/*state updated*/;
  };
}

// == Plugin ======================================================================
export const codeBlockPlugin = (editor: Editor) => new Plugin<CodeBlockPluginState>({
    // -- Setup -------------------------------------------------------------------
    key: codeBlockPluginKey,

    // -- State -------------------------------------------------------------------
    state: {
      // initialize the plugin state
      init: (_, state) => new CodeBlockPluginState(),

      // apply changes to the plugin state from a view transaction
      apply: (transaction, thisPluginState, oldState, newState) => thisPluginState.apply(transaction, thisPluginState, oldState, newState),
    },

    // -- Props -------------------------------------------------------------------
    // TODO: redefine as a Transaction Listener instead of a View Plugin, so that
    //       the state is always the latest
    props: {
      decorations: (state) => {
        const codeBlockControllers: CodeBlockController[] = [/*default empty*/];
        const storage = getCodeBlockViewStorage(editor);
              storage.forEachNodeView(controller => codeBlockControllers.push(controller));

        const decorations: Decoration[] = [/*default empty*/];
        for(let i=0; i<codeBlockControllers.length; i++) {
          const codeBlock = state.doc.nodeAt(codeBlockControllers[i].getPos());
          if(!codeBlock || !isCodeBlockNode(codeBlock)) continue/*does not exist anymore*/;

          const codeBlockDecorations = getDecorations(codeBlockControllers[i]);
          if(!codeBlockDecorations?.length) continue/*no decorations added*/;

          decorations.push(...codeBlockDecorations);
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });

// == Util ========================================================================
const getDecorations = (codeBlockController: CodeBlockController) => {
  const decorations: Decoration[] = [/*default empty*/];
  const { node } = codeBlockController,
        { [AttributeType.Language]: language } = node.attrs;
  if(!language) return/*no language set in the CodeBlock*/;

  const prismGrammar = Prism.languages[language];
  if(!prismGrammar) return/*no prismGrammar exists for given language*/;

  const tokenOrStrings = Prism.tokenize(node.textContent, prismGrammar);

  let absolutePos = codeBlockController.getPos() + 1/*skip the CodeBlock node itself*/;
  for(let i=0; i<tokenOrStrings.length; i++) {
    const tokenOrString = tokenOrStrings[i];
    if(isPrismToken(tokenOrString)) {
      const from = absolutePos,
            to = absolutePos + tokenOrString.content.length;
      decorations.push(Decoration.inline(from, to, { class: `token` }));
      absolutePos += tokenOrString.content.length;
    } else /*found a non-Token string*/ {
      absolutePos += tokenOrString.length;
    }
  }

  return decorations;
};

const isPrismToken = (tokenOrString: any): tokenOrString is Prism.Token => typeof tokenOrString !== 'string';

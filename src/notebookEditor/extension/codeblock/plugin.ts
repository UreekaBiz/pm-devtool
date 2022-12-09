import Prism from 'prismjs';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, AttributeType, CodeBlockNodeType, NodePosition, SelectionRange, CODEBLOCK_TOKEN_CLASS } from 'common';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
const codeBlockPluginKey = new PluginKey<CodeBlockPluginState>('codeBlockPluginKey');

// == Class =======================================================================
export class CodeBlockPluginState {
  constructor(public decorationSet: DecorationSet) {/*nothing additional*/}

  // produce a new Plugin state
  public apply = (tr: Transaction, thisPluginState: CodeBlockPluginState, oldEditorState: EditorState, newEditorState: EditorState) => {
    // map current DecorationSet (will delete removed Decorations automatically)
    this.decorationSet = this.decorationSet.map(tr.mapping, tr.doc);

    // get the updated Ranges
    const newStateRanges: SelectionRange[] = [/*default empty*/];
    tr.mapping.maps.forEach((stepMap, stepMapIndex) => {
      stepMap.forEach((from, to) => {
        const newStart = tr.mapping.slice(stepMapIndex).map(from, -1/*associate to the left*/),
              newEnd = tr.mapping.slice(stepMapIndex).map(to);
        newStateRanges.push({ from: newStart, to: newEnd });
      });
    });

    // compute the new syntax Decorations
    for(let i=0; i < newStateRanges.length; i++) {
      const codeBlockNodePositions: NodePosition[] = [];
      newEditorState.doc.nodesBetween(newStateRanges[i].from, newStateRanges[i].to, (node, position) => {
        if(!isCodeBlockNode(node)) return/*ignore Node*/;
        codeBlockNodePositions.push({ node, position });
      });

      for(let i = 0; i < codeBlockNodePositions.length; i++) {
        const { position, node } = codeBlockNodePositions[i];
        if(!isCodeBlockNode(node)) continue/*does not exist anymore*/;

        const syntaxDecorations = getSyntaxDecorations(position, node);
        if(!syntaxDecorations?.length) continue/*no decorations to add*/;
        this.decorationSet = this.decorationSet.add(newEditorState.doc, [...syntaxDecorations]);
      }
    }

    return this/*state updated*/;
  };
}


// == Plugin ======================================================================
export const codeBlockPlugin = () => new Plugin<CodeBlockPluginState>({
  // -- Setup -------------------------------------------------------------------
  key: codeBlockPluginKey,

  // -- State -------------------------------------------------------------------
  state: {
    // initialize the plugin state
    init: (_, state) => new CodeBlockPluginState(DecorationSet.empty/*default*/),

    // apply changes to the plugin state from a View Transaction
    apply: (transaction, thisPluginState, oldState, newState) => thisPluginState.apply(transaction, thisPluginState, oldState, newState),
  },

  // -- Props -------------------------------------------------------------------
  props: {
    decorations: (state) => {
      const thisPluginState = codeBlockPluginKey.getState(state);
      if(!thisPluginState) return/*no state*/;

      return thisPluginState.decorationSet;
    },
  },
});

// == Util ========================================================================
const getSyntaxDecorations = (codeBlockPos: number, codeBlock: CodeBlockNodeType) => {
  const decorations: Decoration[] = [/*default empty*/];
  const { [AttributeType.Language]: language } = codeBlock.attrs;
  if(!language) return/*no language set in the CodeBlock*/;

  const prismGrammar = Prism.languages[language];
  if(!prismGrammar) return/*no prismGrammar exists for given language*/;

  const tokenOrStrings = Prism.tokenize(codeBlock.textContent, prismGrammar);

  let absolutePos = codeBlockPos + 1/*skip the CodeBlock node itself*/;
  for(let i = 0; i < tokenOrStrings.length; i++) {
    const tokenOrString = tokenOrStrings[i];
    if(isPrismToken(tokenOrString)) {
      const from = absolutePos,
        to = absolutePos + tokenOrString.content.length;
      decorations.push(Decoration.inline(from, to, { class: `${CODEBLOCK_TOKEN_CLASS}-${tokenOrString.type}` }));
      absolutePos += tokenOrString.content.length;
    } else /*found a non-Token string*/ {
      absolutePos += tokenOrString.length;
    }
  }

  return decorations;
};

// == Type Guard ==================================================================
const isPrismToken = (tokenOrString: any): tokenOrString is Prism.Token => typeof tokenOrString !== 'string';

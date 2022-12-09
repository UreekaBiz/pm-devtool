import Prism from 'prismjs';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, AttributeType, CodeBlockNodeType, NodePosition, SelectionRange, CODEBLOCK_TOKEN_CLASS } from 'common';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
const REGULAR_STRING = 'regular string';
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

        this.decorationSet = this.decorationSet.remove(this.decorationSet.find(position, position + node.nodeSize));
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
    // decorate the Syntax inside a CodeBlock
    decorations: (state) => {
      const thisPluginState = codeBlockPluginKey.getState(state);
      if(!thisPluginState) return/*no state*/;

      return thisPluginState.decorationSet;
    },

    // ensure paste into a CodeBlock is always just text
    handlePaste: (view, event, slice) => {
      const { selection } = view.state;
      if(!selection.empty) return false/*let PM handle the event*/;

      const { $from } = selection;
      if(!isCodeBlockNode($from.parent)) return false/*let PM handle the event*/;

      const text = slice.content.textBetween(0, slice.content.size, '\n');

      view.dispatch(view.state.tr.insertText(text));
      return true/*handled*/;
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

  const parsedTokens = parseTokens(Prism.tokenize(codeBlock.textContent, prismGrammar));
  let absolutePos = codeBlockPos + 1/*skip the CodeBlock node itself*/;
  for(let i = 0; i < parsedTokens.length; i++) {
    const parsedToken = parsedTokens[i];
    const { text, type } = parsedToken;

    if(type !== REGULAR_STRING) {
      const from = absolutePos,
            to = absolutePos + text.length;
      decorations.push(Decoration.inline(from, to, { class: `${CODEBLOCK_TOKEN_CLASS}-${type}` }));
      absolutePos += text.length;
    } else /*found a non-Token string*/ {
      absolutePos += text.length;
    }
  }

  return decorations;
};

const parseTokens = (tokens:  (string | Prism.Token)[]) => {
  const parsed: { text: string; type: string; }[] = [/*default empty*/];
  for(let i=0; i<tokens.length; i++) {
    const tokenOrString = tokens[i];
    if(typeof tokenOrString === 'string') {
      parsed.push({ text: tokenOrString, type: REGULAR_STRING });
    } else /*a Token*/ {
      const { content } = tokenOrString;
      if(typeof content === 'string') {
        parsed.push({ text: content, type: tokenOrString.type });
      } else {
        const parsedContent = Array.isArray(content)
          ? parseTokens(content)
          : parseTokens([content]/*is a Token*/);

        parsed.push(...parsedContent);
      }
    }
  }
  return parsed;
};

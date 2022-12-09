import Prism from 'prismjs';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, combineTransactionSteps, getTransformChangedRanges, AttributeType, CodeBlockNodeType, NodePosition } from 'common';

import { NoPluginState } from 'notebookEditor/model';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Plugin ======================================================================
export const codeBlockPlugin = () => {
  let latestDecoratedRange = { from: 0, to: 0 }/*default*/;

  const plugin = new Plugin<NoPluginState>({
    // -- Setup -------------------------------------------------------------------
    key: new PluginKey<NoPluginState>('codeBlockPluginKey'),

    // -- Transaction -------------------------------------------------------------
    appendTransaction: (transactions, oldState, newState) => {
      if(oldState.doc === newState.doc) return null/*no Transaction to dispatch*/;

      const transform = combineTransactionSteps(oldState.doc, [...transactions]),
            changes = getTransformChangedRanges(transform);

      latestDecoratedRange = changes.reduce((latestRange, change) => {
        const { newRange } = change;
        const from = Math.max(latestRange.from, newRange.from),
              to = Math.min(latestRange.to, newRange.to);
        return { from, to };
      }, { from: 0/*start of doc*/, to: newState.doc.nodeSize });

      return null/*no Transaction to dispatch*/;
    },

    // -- Props -------------------------------------------------------------------
    // TODO: save state and map decorations
    props: {
      decorations: (state) => {
        const codeBlockNodePositions: NodePosition[] = [];
        state.doc.nodesBetween(latestDecoratedRange.from, latestDecoratedRange.to, (node, position) => {
          if(!isCodeBlockNode(node)) return/*ignore Node*/;
          codeBlockNodePositions.push({ node, position });
        });

        const decorations: Decoration[] = [/*default empty*/];
        for(let i = 0; i < codeBlockNodePositions.length; i++) {
          const { position, node } = codeBlockNodePositions[i];
          if(!isCodeBlockNode(node)) continue/*does not exist anymore*/;

          const codeBlockDecorations = getDecorations(position, node);
          if(!codeBlockDecorations?.length) continue/*no decorations added*/;

          decorations.push(...codeBlockDecorations);
        }

        return DecorationSet.create(state.doc, decorations);
      },
    },
  });

  return plugin;
};

// == Util ========================================================================
const getDecorations = (codeBlockPos: number, codeBlock: CodeBlockNodeType) => {
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
      decorations.push(Decoration.inline(from, to, { class: `token` }));
      absolutePos += tokenOrString.content.length;
    } else /*found a non-Token string*/ {
      absolutePos += tokenOrString.length;
    }
  }

  return decorations;
};

const isPrismToken = (tokenOrString: any): tokenOrString is Prism.Token => typeof tokenOrString !== 'string';

import { classHighlighter, highlightTree } from '@lezer/highlight';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, NodePosition, SelectionRange, CodeBlockLanguage, AttributeType } from 'common';

import { getCodeBlockChildHighlightTree } from './language';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
const codeBlockPluginKey = new PluginKey<CodeBlockPluginState>('codeBlockPluginKey');

// == Class =======================================================================
export class CodeBlockPluginState {
  constructor(public decorationSet: DecorationSet) {/*nothing additional*/ }

  // produce a new Plugin state
  public apply = (tr: Transaction, thisPluginState: CodeBlockPluginState, oldEditorState: EditorState, newEditorState: EditorState) => {
    // map current DecorationSet (will delete removed Decorations automatically)
    const { newDecorationSet: mappedDecorationSet, newStateRanges } = mapDecorations(this.decorationSet, tr);
    this.decorationSet = mappedDecorationSet;

    // get the affected CodeBlocks and TextBlocks in the affected Range
    const { affectedTextBlocksInRange, affectedCodeBlockNodePositions } = getAffectedNodesInRange(getTotalRange(tr, newStateRanges), newEditorState);

    // for each CodeBlock, update the syntax found in the child
    const newSyntaxDecorationSet = updateCodeBlockSyntaxDecorations(newEditorState, affectedTextBlocksInRange, affectedCodeBlockNodePositions, this.decorationSet);
    this.decorationSet = newSyntaxDecorationSet;
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
  },
});

// == Util ========================================================================
/** map a set of Decorations through a Transaction */
const mapDecorations = (decorationSet: DecorationSet, tr: Transaction) => {
  const newDecorationSet = decorationSet.map(tr.mapping, tr.doc);
  const newStateRanges: SelectionRange[] = [/*default empty*/];
  tr.mapping.maps.forEach((stepMap, stepMapIndex) => {
    stepMap.forEach((from, to) => {
      const newStart = tr.mapping.slice(stepMapIndex).map(from, -1/*associate to the left*/),
            newEnd = tr.mapping.slice(stepMapIndex).map(to);
      newStateRanges.push({ from: newStart, to: newEnd });
    });
  });

  return { newDecorationSet, newStateRanges };
};

/** return a single range encompassing all the given ranges */
const getTotalRange = (tr: Transaction, ranges: SelectionRange[]) =>
  ranges.reduce<{ from: number; to: number; }>((acc, curr) => {
    acc.from = Math.min(acc.from, curr.from);
    acc.to = Math.max(acc.to, curr.to);
    return acc;
  }, { from: tr.doc.nodeSize, to: 0 });

/**
 * return the TextBlocks present in a {@link SelectionRange},
 * given an {@link EditorState}
 */
const getAffectedNodesInRange = (range: SelectionRange, state: EditorState) => {
  const affectedTextBlocksInRange: ProseMirrorNode[] = [/*default empty*/],
        affectedCodeBlockNodePositions: NodePosition[] = [/*default empty*/];

  state.doc.nodesBetween(range.from, range.to, (node, position) => {
    if(node.isTextblock) {
      affectedTextBlocksInRange.push(node);
    } /* else -- not a textBlock */

    if(!isCodeBlockNode(node)) return/*ignore Node*/;
    affectedCodeBlockNodePositions.push({ node, position });
  });

  return { affectedTextBlocksInRange, affectedCodeBlockNodePositions  };
};

/** update the syntax Decorations for the given CodeBlocks */
const updateCodeBlockSyntaxDecorations = (editorState: EditorState, affectedTextBlocksInRange: ProseMirrorNode[], codeBlockNodePositions: NodePosition[], decorationSet: DecorationSet) => {
  let newDecorationSet = decorationSet;

  for(let i=0; i<codeBlockNodePositions.length; i++) {
    const codeBlock = codeBlockNodePositions[i].node;
    const { [AttributeType.Language]: language } = codeBlock.attrs;
    if(!language) continue/*CodeBlock has no valid language set*/;

    codeBlock.content.forEach((child, offsetIntoParent) => {
      // if the child is not in the affected Range,
      // no need to update its Decorations
      if(!affectedTextBlocksInRange.includes(child)) return/*ignore Node*/;

      const childPos = codeBlockNodePositions[i].position + offsetIntoParent;
      newDecorationSet = newDecorationSet.remove(newDecorationSet.find(childPos, childPos + child.nodeSize));

      const syntaxDecorations = getSyntaxDecorations(language as CodeBlockLanguage/*by contract*/, childPos, child);
      newDecorationSet = newDecorationSet.add(editorState.doc, [...syntaxDecorations]);
    });
  }

  return newDecorationSet;
};

/** compute the Decorations for the syntax inside a CodeBlock child */
const getSyntaxDecorations = (codeBlockLanguage: CodeBlockLanguage, codeBlockChildPos: number, codeBlockChild: ProseMirrorNode) => {
  const decorations: Decoration[] = [/*default empty*/];

  const tree = getCodeBlockChildHighlightTree(codeBlockLanguage, codeBlockChild.textContent);
  const insideChildPos = codeBlockChildPos + 2/*account for start of parent CodeBlock and start of parent TextBlock*/;
  highlightTree(tree, classHighlighter, (from, to, classes) => {
    decorations.push(Decoration.inline(insideChildPos + from, insideChildPos + to, { class: classes  }));
  });

  return decorations;
};


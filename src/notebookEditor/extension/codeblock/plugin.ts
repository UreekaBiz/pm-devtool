import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import { lowlight } from 'lowlight';
import { Span, Text } from 'lowlight/lib/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, NodePosition, SelectionRange, CodeBlockLanguage, AttributeType } from 'common';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
export const languageLowlight = lowlight;
             languageLowlight.registerLanguage('html', html);
             languageLowlight.registerLanguage('css', css);
             languageLowlight.registerLanguage('javascript', javascript);
             languageLowlight.registerLanguage('typescript', typescript);
const codeBlockPluginKey = new PluginKey<CodeBlockPluginState>('codeBlockPluginKey');

// == Class =======================================================================
export class CodeBlockPluginState {
  constructor(public decorationSet: DecorationSet) {/*nothing additional*/ }

  // produce a new Plugin state
  public apply = (tr: Transaction, thisPluginState: CodeBlockPluginState, oldEditorState: EditorState, newEditorState: EditorState) => {
    // map current DecorationSet (will delete removed Decorations automatically)
    this.decorationSet = this.decorationSet.map(tr.mapping, tr.doc);
    const newStateRanges: SelectionRange[] = [/*default empty*/];
    tr.mapping.maps.forEach((stepMap, stepMapIndex) => {
      stepMap.forEach((from, to) => {
        const newStart = tr.mapping.slice(stepMapIndex).map(from, -1/*associate to the left*/),
          newEnd = tr.mapping.slice(stepMapIndex).map(to);
        newStateRanges.push({ from: newStart, to: newEnd });
      });
    });

    // get a single Range spanning all the Ranges
    const totalRange = newStateRanges.reduce<{ from: number; to: number; }>((acc, curr) => {
      acc.from = Math.min(acc.from, curr.from);
      acc.to = Math.max(acc.to, curr.to);
      return acc;
    }, { from: tr.doc.nodeSize, to: 0 });

    // get the affected CodeBlocks and TextBlocks in the Range
    const affectedTextBlocksInRange: ProseMirrorNode[] = [];
    const codeBlockNodePositionsInRange: NodePosition[] = [];
    newEditorState.doc.nodesBetween(totalRange.from, totalRange.to, (node, position) => {
      if(node.isTextblock) {
        affectedTextBlocksInRange.push(node);
      } /* else -- not a textBlock */

      if(!isCodeBlockNode(node)) return/*ignore Node*/;
      codeBlockNodePositionsInRange.push({ node, position });
    });

    // for each CodeBlock, update the syntax found in the child
    for(let i=0; i<codeBlockNodePositionsInRange.length; i++) {
      const codeBlock = codeBlockNodePositionsInRange[i].node;
      const { [AttributeType.Language]: language } = codeBlock.attrs;
      if(!language) continue/*CodeBlock has no valid language set*/;

      codeBlock.content.forEach((child, offsetIntoParent) => {
        // if the child is not in the affected Range,
        // no need to update its Decorations
        if(!affectedTextBlocksInRange.includes(child)) return/*ignore Node*/;

        const childPos = codeBlockNodePositionsInRange[i].position + offsetIntoParent;
        this.decorationSet = this.decorationSet.remove(this.decorationSet.find(childPos, childPos + child.nodeSize));

        const syntaxDecorations = getSyntaxDecorations(language as CodeBlockLanguage/*by contract*/, childPos, child);
        this.decorationSet = this.decorationSet.add(newEditorState.doc, [...syntaxDecorations]);
      });
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
const getSyntaxDecorations = (codeBlockLanguage: CodeBlockLanguage, codeBlockChildPos: number, codeBlockChild: ProseMirrorNode) => {
  const decorations: Decoration[] = [/*default empty*/];
  const treeRoot = languageLowlight.highlight(codeBlockLanguage, codeBlockChild.textContent),
        flattenedChildren = flattenTreeChildren(treeRoot.children);

  let absolutePos = codeBlockChildPos + 2/*account for start of parent CodeBlock and start of parent TextBlock*/;
  for(let i = 0; i < flattenedChildren.length; i++) {
    const child = flattenedChildren[i],
          { childValue, childClasses } = child;
    if(!childClasses.length) {
      absolutePos += childValue.length;
      continue/*no Decorations to add*/;
    } else {
      const decorationStart = absolutePos,
            decorationEnd = absolutePos + childValue.length;
      decorations.push(Decoration.inline(decorationStart, decorationEnd, { class: childClasses.join(' ') }));
      absolutePos += childValue.length;
    }
  }

  return decorations;
};

const flattenTreeChildren = (children: (Span | Text)[], currentClasses: string[] = []): { childValue: string; childClasses: string[]; }[] => children.map((child) => {
  const classes = [...currentClasses, ...isLowLightSpan(child) ? child.properties.className : [/*no classes*/]];
  if(isLowLightSpan(child)) {
    return flattenTreeChildren(child.children, classes);
  } /* else -- a regular Text Node */

  return { childValue: child.value, childClasses: classes };
}).flat();

// == Type Guard ==================================================================
const isLowLightSpan = (node: Span | Text): node is Span => 'properties' in node;

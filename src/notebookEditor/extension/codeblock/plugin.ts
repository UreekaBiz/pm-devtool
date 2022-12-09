import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript'
import html from 'highlight.js/lib/languages/xml';
import { lowlight } from 'lowlight';
import { Span, Text } from 'lowlight/lib/core';
import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { isCodeBlockNode, AttributeType, CodeBlockNodeType, NodePosition, SelectionRange } from 'common';

// ********************************************************************************
/** highlight the content of a CodeBlock given its language */

// == Constant ====================================================================
export const languageLowlight = lowlight;
             languageLowlight.registerLanguage('html', html);
             languageLowlight.registerLanguage('css', css);
             languageLowlight.registerLanguage('javascript', javascript);
             languageLowlight.registerLanguage('ts', ts);
const codeBlockPluginKey = new PluginKey<CodeBlockPluginState>('codeBlockPluginKey');

// == Class =======================================================================
export class CodeBlockPluginState {
  constructor(public decorationSet: DecorationSet) {/*nothing additional*/ }

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
    for(let i = 0; i < newStateRanges.length; i++) {
      const codeBlockNodePositions: NodePosition[] = [];
      newEditorState.doc.nodesBetween(newStateRanges[i].from, newStateRanges[i].to, (node, position) => {
        if(!isCodeBlockNode(node)) return/*ignore Node*/;
        codeBlockNodePositions.push({ node, position });
      });

      for(let j = 0; j < codeBlockNodePositions.length; j++) {
        const { position, node } = codeBlockNodePositions[j];
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

  const treeRoot = languageLowlight.highlight(language, codeBlock.textContent),
        flattenedChildren = flattenTreeChildren(treeRoot.children);

  let absolutePos = codeBlockPos + 1/*skip the CodeBlock node itself*/;
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

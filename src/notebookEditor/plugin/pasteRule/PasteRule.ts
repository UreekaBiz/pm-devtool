import { EditorState, Plugin, PluginKey, Transaction } from 'prosemirror-state';

import { PM_CLASS } from 'common';

import { isValidHTMLElement, isValidRegExp } from 'notebookEditor/extension/util';
import { NoPluginState } from 'notebookEditor/model';

// ********************************************************************************
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/2b69f344c713befecd4ec606df5e9ba680aa2ce8/packages/core/src/PasteRule.ts

// == Constant ====================================================================
// gets added to a Transaction whenever it comes from a paste
const UI_EVENT_META = 'uiEvent';

// present in HTML when it is cut or pasted as a ProseMirror Slice
const DATA_PM_SLICE = 'data-pm-slice';

// == Type ========================================================================
type PasteRuleMatch = { index: number; text: string; replaceWith?: string; match?: RegExpMatchArray; data?: Record<string, any>; }
export type PasteRuleMatcher = RegExp | ((text: string) => PasteRuleMatch[] | null | undefined);
type PasteRuleHandlerType = (state: EditorState, match: RegExpMatchArray, start: number, end: number) => Transaction | null;

// == Class =======================================================================
export class PasteRule {
  /** the {@link RegExp} or function that checks the pasted Text */
  matcher: PasteRuleMatcher;

  /**
   * the function that gets called when pasted Text gets matched by the
   * {@link ParseRuleMatcher}
   */
  handler: PasteRuleHandlerType;

  constructor(matcher: PasteRuleMatcher, handler: PasteRuleHandlerType) {
    this.matcher = matcher;
    this.handler = handler;
  }
}

// == Plugin ======================================================================
/**
 * return a {@link PasteRule} Plugin for each PasteRule that gets passed into the
 * function. Each Plugin will cause its corresponding {@link PasteRule}'s action
 * to be triggered whenever Text that matches its matcher
 * gets pasted into the Editor
 */
export const createPasteRulePlugins = ({ rules }: {rules: PasteRule[]; }): Plugin[] => {
  // -- State -----------------------------------------------------------
  let dragSourceElement: Element | null = null/*default*/,
      draggedElement: any/*cannot know what will be dragged into the Editor*/,
      draggedText: Selection | null = null/*default*/;

  let caretOffset: number | undefined = undefined/*default*/;
  let isPastedFromProseMirror = false/*default*/,
      isDroppedFromProseMirror = false/*default*/;

  const plugins = rules.map((rule, index) => {
    return new Plugin({
      // -- Definition ------------------------------------------------------------
      key: new PluginKey<NoPluginState>(`pasteRule-${index}-Key`),

      // -- Transaction -----------------------------------------------------------
      // apply the effects of the PasteRule's handler if Text that got
      // matched got pasted recently into the Editor
      appendTransaction: (transactions, oldState, state) => {
        const transaction = transactions[0/*first one*/];

        const isPaste = transaction.getMeta(UI_EVENT_META) === 'paste' && !isPastedFromProseMirror,
              isDrop = transaction.getMeta(UI_EVENT_META) === 'drop' && !isDroppedFromProseMirror;
        if(!isPaste && !isDrop) return/*not pasting or dropping anything*/;

        const from = oldState.doc.content.findDiffStart(state.doc.content),
              to = oldState.doc.content.findDiffEnd(state.doc.content);
        if(!from || typeof from !== 'number' || !to || from === to.b) return/*there is no changed range*/;

        // build a chainable state
        // so we can use a single transaction for all paste rules
        const updatedTrAfterHandler = executePasteRuleHandler(state, Math.max(from - 1/*1 before diffStart*/, 0/*do not go behind the doc*/), to.b - 1/*1 before diffEnd*/, rule);
        if(!updatedTrAfterHandler.docChanged || !(updatedTrAfterHandler.steps.length > 0)) return/*handler could not be applied*/;

        return updatedTrAfterHandler/*modified*/;
      },

      // register a global drag handler into the View
      // to track the current drag source element
      view(view) {
        const handleDragstart = (event: DragEvent) => {
          if(!isValidHTMLElement(event.target)) return/*invalid drag*/;

          draggedElement = event.target;
          draggedText = window.getSelection();
          event.dataTransfer?.setData('text/plain', draggedText?.toString() ?? ''/*default*/);

          if(view.dom.parentElement?.contains(event.target)) { dragSourceElement = view.dom.parentElement; }
          else { dragSourceElement = null/*default*/; }
        };

        const handleDragEnter = (event: DragEvent) => {
          event.preventDefault();
        };

        const handleDragOver = (event: DragEvent) => {
          event.preventDefault();
          let caretData: Range | undefined/*non existent*/ | null/*non existent*/ = undefined/*default*/;

          if(document.caretRangeFromPoint) {
            caretData = document.caretRangeFromPoint(event.clientX, event.clientY);
          } /* else -- no caretRangeFromPoint */

          caretOffset = caretData?.startOffset;
        };

        window.addEventListener('dragstart', handleDragstart);
        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragover', handleDragOver);

        // remove listeners when the View is destroyed
        return {
          destroy() {
            window.removeEventListener('dragstart', handleDragstart);
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragover', handleDragOver);
          },
        };
      },

      props: {
        handleDOMEvents: {
          // change local state based on drop events
          drop: (view, event) => {
            const { target } = event;
            if(!target) return false/*not handled*/;
            if(!isValidHTMLElement(target)) return false/*not handled*/;

            event.preventDefault();
            isDroppedFromProseMirror = dragSourceElement === view.dom.parentElement;

            const data = event.dataTransfer?.getData('text/plain');
            if(target.parentElement?.className === PM_CLASS) {
              draggedElement.textContent = draggedElement.textContent.replace(data, '');
              let textContent = target.textContent ?? ''/*default*/;

              if(textContent) {
                textContent = textContent.slice(0, caretOffset) + data + textContent.slice(caretOffset);
              } /* else -- do not change  default */

              view.dispatch(view.state.tr.insertText(textContent));
              return true/*handled*/;
            } /* else -- drop target is not the Editor */

            return false/*not handled*/;
          },

          // change local state accordingly based on paste events
          paste: (view, event) => {
            const html = event.clipboardData?.getData('text/html');
            isPastedFromProseMirror = !!html?.includes(DATA_PM_SLICE);

            return false/*not handled*/;
          },
        },
      },
    });
  });

  return plugins;
};

// == Util ========================================================================
const executePasteRuleHandler = (currentState: EditorState, from: number, to: number, rule: PasteRule): Transaction => {
  let referenceTransaction = currentState.tr/*default*/;

  // ensure handlers can be applied to the Nodes in the Range
  currentState.doc.nodesBetween(from, to, (node, pos) => {
    if(!node.isTextblock) return/*do not check if not a TextBlock*/;

    const maxFrom = Math.max(from, pos),
          minTo = Math.min(to, pos + node.content.size),
          textToMatch = node.textBetween(maxFrom - pos, minTo - pos, undefined/*no block separator*/, '\ufffc'/*leaf separator*/);

    const matches = applyPasteRuleMatcher(textToMatch, rule.matcher);
    matches.forEach(match => {
      if(match.index === undefined) return/*not a valid match*/;

      const start = maxFrom + match.index + 1,
            end = start + match[0].length,
            range = { from: currentState.tr.mapping.map(start), to: currentState.tr.mapping.map(end) };

      const handlerStart = range.from,
            handlerEnd = range.to;

      const handlerUpdatedTr = rule.handler(currentState, match, handlerStart, handlerEnd);
      if(handlerUpdatedTr) {
        referenceTransaction = handlerUpdatedTr;
      } /* else -- handler could not be applied */
    });
  });

  return referenceTransaction;
};

/** apply the given {@link PasteRuleMatcher} to the given string */
const applyPasteRuleMatcher = (text: string, matcher: PasteRuleMatcher): RegExpMatchArray[] => {
  if(isValidRegExp(matcher)) {
    return [...text.matchAll(matcher)];
  } /* else -- matcher is not a RegExp */

  const matches = matcher(text);
  if(!matches) {
    return [/*no matches*/];
  } /* else -- there are matches */

  return matches.map((pasteRuleMatch) => {
    const resultingArray: RegExpMatchArray = [/*default empty*/];
          resultingArray.push(pasteRuleMatch.text);
          resultingArray.index = pasteRuleMatch.index;
          resultingArray.input = text;

    if(pasteRuleMatch.replaceWith) {
      if(!pasteRuleMatch.text.includes(pasteRuleMatch.replaceWith)) {
        console.warn('pasteRuleMatch.replaceWith must be part of pasteRuleMatch.text');
      } /* else -- pasteRuleMatch is part of the matched Text */

      resultingArray.push(pasteRuleMatch.replaceWith);
    } /* else -- not specifying a string to replaceWith */

    return resultingArray;
  });
};

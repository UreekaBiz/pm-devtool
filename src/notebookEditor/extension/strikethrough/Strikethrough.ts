import { Mark } from '@tiptap/core';

import { StrikethroughMarkRendererSpec } from 'common';

import { getMarkOutputSpec } from 'notebookEditor/extension/util/attribute';
import { markInputRule, markPasteRule } from 'notebookEditor/extension/util/mark';
import { safeParseTag } from 'notebookEditor/extension/util/parse';
import { NoOptions, NoStorage } from 'notebookEditor/model/type';

import { setStrikeCommand, toggleStrikeCommand, unsetStrikeCommand } from './command';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-bold/src/bold.ts

// == RegEx =======================================================================
const strikethroughInputRegEx = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))$/;
const strikethroughPasteRegEx = /(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/g;

// == Mark ========================================================================
export const Strikethrough = Mark.create<NoOptions, NoStorage>({
  ...StrikethroughMarkRendererSpec,

  // -- Command -------------------------------------------------------------------
  addCommands() {
    return {
      setStrike: setStrikeCommand,
      unsetStrike: unsetStrikeCommand,
      toggleStrike: toggleStrikeCommand,
    };
  },
  addKeyboardShortcuts() { return { 'Mod-Shift-x': () => this.editor.commands.toggleStrike() }; },

  // -- Input ---------------------------------------------------------------------
  // TODO: Document
  addInputRules() { return [ markInputRule(strikethroughInputRegEx, this.type ) ]; },
  addPasteRules() { return [ markPasteRule(strikethroughPasteRegEx, this.type ) ]; },

  // -- View ----------------------------------------------------------------------
  parseHTML() {
    return [
      safeParseTag('s'),
      safeParseTag('del'),
      safeParseTag('strike'),
    ];
  },
  renderHTML({ mark, HTMLAttributes }) { return getMarkOutputSpec(mark, HTMLAttributes); },
});

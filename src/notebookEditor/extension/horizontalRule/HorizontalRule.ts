import { keymap } from 'prosemirror-keymap';

import { getHorizontalRuleNodeType, getNodeOutputSpec, HorizontalRuleNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { blockArrowDownCommand, blockArrowUpCommand, shortcutCommandWrapper } from 'notebookEditor/command';
import { createNodeInputRule } from 'notebookEditor/plugin/inputRule';

import { createExtensionParseRules, getExtensionAttributesObject, NodeExtension, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { HorizontalRuleAttrs } from './attribute';
import './horizontalRule.css';
import { insertOrToggleHorizontalRuleCommand } from './command';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ueberdosis/tiptap/blob/main/packages/extension-horizontal-rule/src/horizontal-rule.ts
const horizontalRuleRegEx = /^(?:---|—-|___\s|\*\*\*\s)$/;

// == Node ========================================================================
export const HorizontalRule = new NodeExtension({
  name: NodeName.HORIZONTAL_RULE,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => HorizontalRuleAttrs,
  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...HorizontalRuleNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `hr[${DATA_NODE_TYPE}="${NodeName.HORIZONTAL_RULE}"]` }, { tag: 'hr' }], HorizontalRuleAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HorizontalRuleAttrs), true/*is Leaf*/),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createNodeInputRule(horizontalRuleRegEx, getHorizontalRuleNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap({
      // toggle a HorizontalRule
      'Mod-h': () => insertOrToggleHorizontalRuleCommand(editor.view.state, editor.view.dispatch),
      'Mod-H': () => insertOrToggleHorizontalRuleCommand(editor.view.state, editor.view.dispatch),

      // set GapCursor if necessary
      'ArrowUp': () => shortcutCommandWrapper(editor, blockArrowUpCommand(NodeName.HORIZONTAL_RULE)),
      'ArrowDown': () => shortcutCommandWrapper(editor, blockArrowDownCommand(NodeName.HORIZONTAL_RULE)),
    }),
  ],
});

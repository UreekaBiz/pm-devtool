import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, UnorderedListNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority, ParseRulePriority } from 'notebookEditor/model';

import { toggleListCommand } from '../command/toggleListCommand';
import { createListWrapInputRule } from '../inputRule';
import { UnorderedListAttrs } from './attribute';

// ********************************************************************************

// == Node ========================================================================
export const UnorderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.UNORDERED_LIST,
  priority: ExtensionPriority.UNORDERED_LIST,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => (UnorderedListAttrs),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...UnorderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([
      { tag: `ul[${DATA_NODE_TYPE}="${NodeName.UNORDERED_LIST}"]`, priority: ParseRulePriority.UNORDERED_LIST },
      { tag: 'ul', priority: ParseRulePriority.UNORDERED_LIST }],
      UnorderedListAttrs),

    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, UnorderedListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createListWrapInputRule(NodeName.UNORDERED_LIST)],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-8': toggleListCommand(NodeName.UNORDERED_LIST, {/*no attrs*/ }) })],
});

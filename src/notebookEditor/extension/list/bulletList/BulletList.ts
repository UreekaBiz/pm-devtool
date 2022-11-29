import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, BulletListNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';
import { ExtensionPriority, ParseRulePriority } from 'notebookEditor/model';

import { toggleListCommand } from '../command/toggleListCommand';
import { createListWrapInputRule } from '../inputRule';
import { BulletListAttrs } from './attribute';

// ********************************************************************************

// == Node ========================================================================
export const BulletList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.BULLET_LIST,
  priority: ExtensionPriority.BULLET_LIST,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => (BulletListAttrs),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...BulletListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([
      { tag: `ul[${DATA_NODE_TYPE}="${NodeName.BULLET_LIST}"]`, priority: ParseRulePriority.BULLET_LIST },
      { tag: 'ul', priority: ParseRulePriority.BULLET_LIST }],
      BulletListAttrs),

    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, BulletListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createListWrapInputRule(NodeName.BULLET_LIST)],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-8': toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/ }) })],
});

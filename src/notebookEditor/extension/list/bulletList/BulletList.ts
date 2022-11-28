import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, BulletListNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { toggleListCommand } from '../command/toggleListCommand';
import { BulletListAttrs } from './attribute';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
// (SEE: addInputRules below)
const bulletListRegEx = /^\s*([-+*])\s$/;

// == Node ========================================================================
export const BulletList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.BULLET_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => (BulletListAttrs),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...BulletListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([ { tag: `ul[${DATA_NODE_TYPE}="${NodeName.BULLET_LIST}"]` }, { tag: 'ul' }], BulletListAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, BulletListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [wrappingInputRule(bulletListRegEx, editor.view.state.schema.nodes[NodeName.BULLET_LIST])],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-8': toggleListCommand(NodeName.BULLET_LIST, {/*no attrs*/}) })],
});

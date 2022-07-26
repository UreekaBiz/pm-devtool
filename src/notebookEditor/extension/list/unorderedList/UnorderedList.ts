import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, UnorderedListNodeSpec, NodeName, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { toggleListCommand } from '../command/list/toggle/toggleListCommand';
import { createListWrapInputRule } from '../listInputRule';
import './unorderedList.css';

// ********************************************************************************

// == Node ========================================================================
export const UnorderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.UNORDERED_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => ({/*currently no attrs*/}),

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...UnorderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([{ tag: `div[${DATA_NODE_TYPE}="${NodeName.UNORDERED_LIST}"]` }, { tag: 'ul' }], {/*currently no attrs*/}),

    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*currently no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [createListWrapInputRule(NodeName.UNORDERED_LIST)],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-8': toggleListCommand(NodeName.UNORDERED_LIST, {/*no attrs*/ }) })],
});

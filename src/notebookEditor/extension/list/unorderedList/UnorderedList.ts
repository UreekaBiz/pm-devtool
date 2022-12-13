import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { getNodeOutputSpec, getUnorderedListNodeType, NodeName, UnorderedListNodeSpec, DATA_NODE_TYPE } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

// ********************************************************************************
// == RegEx =======================================================================
const unorderedListRegEx = /^\s*([-+*])\s$/;

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
    parseDOM: createExtensionParseRules([{ tag: `ul[${DATA_NODE_TYPE}="${NodeName.UNORDERED_LIST}"]` }, { tag: 'ul' }], {/*currently no attrs*/}),

    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, {/*currently no attrs*/})),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [wrappingInputRule(unorderedListRegEx, getUnorderedListNodeType(editor.view.state.schema))],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({})],
});

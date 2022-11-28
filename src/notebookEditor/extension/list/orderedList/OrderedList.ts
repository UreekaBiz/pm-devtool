import { wrappingInputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, NodeName, OrderedListNodeSpec, DATA_NODE_TYPE, AttributeType } from 'common';

import { DEFAULT_EXTENSION_PRIORITY } from 'notebookEditor/extension/type/Extension/type';
import { createExtensionParseRules, getExtensionAttributesObject } from 'notebookEditor/extension/type/Extension/util';
import { NodeExtension } from 'notebookEditor/extension/type/NodeExtension/NodeExtension';

import { toggleListCommand } from '../command/toggleListCommand';
import { OrderedListAttrs } from './attribute';

// ********************************************************************************
// == RegEx =======================================================================
// NOTE: this is inspired by https://github.com/ProseMirror/prosemirror-example-setup/blob/master/src/inputrules.ts
// (SEE: addInputRules below)
const orderedListRegex = /^(\d+)\.\s$/;

// == Node ========================================================================
export const OrderedList = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.ORDERED_LIST,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => OrderedListAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...OrderedListNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules([ { tag: `ol[${DATA_NODE_TYPE}="${NodeName.ORDERED_LIST}"]` }, { tag: 'ol' }], OrderedListAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, OrderedListAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [
    wrappingInputRule(orderedListRegex,
    editor.view.state.schema.nodes[NodeName.ORDERED_LIST],

    // getAttrs function
    (match) => ({ [AttributeType.StartValue]: Number(match[1/*the typed number*/]) }),

    // join predicate function
    (match, node) => node.childCount + node.attrs[AttributeType.StartValue] === Number(match[1/*the typed number*/])),
  ],

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Shift-7': toggleListCommand(NodeName.ORDERED_LIST, {/*no attrs*/}) })],
});

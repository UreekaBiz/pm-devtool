import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, NodeName, ParagraphNodeSpec, DATA_NODE_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model/type';

import { createExtensionParseRules } from '../type';
import { NodeExtension } from '../type/NodeExtension';
import { setParagraphCommand } from './command';
import { ParagraphAttrs } from './attribute';

// ********************************************************************************
// == Node ========================================================================
export const Paragraph = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.PARAGRAPH,
  priority: ExtensionPriority.PARAGRAPH,

  // -- Spec ----------------------------------------------------------------------
  nodeSpec: {
    ...ParagraphNodeSpec,

    attrs: ParagraphAttrs,

    parseDOM: createExtensionParseRules([ { tag: `div[${DATA_NODE_TYPE}="${NodeName.PARAGRAPH}"]` }, { tag: 'p' }], ParagraphAttrs),
    toDOM: (node) => getNodeOutputSpec(node, {/*no additional attrs*/}),
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) })],
});

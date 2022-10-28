import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, AttributeType, NodeName, ParagraphNodeSpec, SetAttributeType, DATA_NODE_TYPE } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { ExtensionPriority } from 'notebookEditor/model/type';

import { NodeExtension } from '../type/NodeExtension';
import { setAttributeParsingBehavior } from '../util';
import { setParagraphCommand } from './command';

// ********************************************************************************
// == Node ========================================================================
export const Paragraph = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.PARAGRAPH,
  priority: ExtensionPriority.PARAGRAPH,

  // -- Spec ----------------------------------------------------------------------
  nodeSpec: {
    ...ParagraphNodeSpec,

    attrs: {
      [AttributeType.BackgroundColor]: setAttributeParsingBehavior(AttributeType.BackgroundColor, SetAttributeType.STYLE),
      [AttributeType.Color]: setAttributeParsingBehavior(AttributeType.Color, SetAttributeType.STYLE),
      [AttributeType.FontSize]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STYLE),

      [AttributeType.PaddingTop]: setAttributeParsingBehavior(AttributeType.PaddingTop, SetAttributeType.STYLE),
      [AttributeType.PaddingBottom]: setAttributeParsingBehavior(AttributeType.PaddingBottom, SetAttributeType.STYLE),
      [AttributeType.PaddingLeft]: setAttributeParsingBehavior(AttributeType.PaddingLeft, SetAttributeType.STYLE),
      [AttributeType.PaddingRight]: setAttributeParsingBehavior(AttributeType.PaddingRight, SetAttributeType.STYLE),

      [AttributeType.MarginTop]: setAttributeParsingBehavior(AttributeType.MarginTop, SetAttributeType.STYLE),
      [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STYLE),
      [AttributeType.MarginBottom]: setAttributeParsingBehavior(AttributeType.MarginBottom, SetAttributeType.STYLE),
      [AttributeType.MarginRight]: setAttributeParsingBehavior(AttributeType.MarginRight, SetAttributeType.STYLE),
    },

    parseDOM:[
      { tag: `div[${DATA_NODE_TYPE}="${NodeName.PARAGRAPH}"]` },
      { tag: 'p' },
    ],
    toDOM: (node) => getNodeOutputSpec(node, {/*no attrs*/}),
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [keymap({ 'Mod-Alt-0': () => shortcutCommandWrapper(editor, setParagraphCommand) })],
});

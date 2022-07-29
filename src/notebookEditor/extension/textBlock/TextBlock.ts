import { Node } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

import { Attributes, AttributeType, TextBlockNodeSpec, SetAttributeType } from 'common';

import { getNodeOutputSpec, setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';
import { safeParseTag } from 'notebookEditor/extension/util/parse';
import { ExtensionPriority, NoStorage } from 'notebookEditor/model/type';

import { setTextBlockCommand } from './command';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-textBlock/src/textBlock.ts

// == Node ========================================================================
interface TextBlockOptions { HTMLAttributes: Attributes; }
export const TextBlock = Node.create<TextBlockOptions, NoStorage>({
  ...TextBlockNodeSpec,
  priority: ExtensionPriority.TEXT_BLOCK,

  // -- Attribute -----------------------------------------------------------------
  addAttributes() {
    return {
      [AttributeType.FontSize]: setAttributeParsingBehavior(AttributeType.FontSize, SetAttributeType.STRING),
      [AttributeType.TextColor]: setAttributeParsingBehavior(AttributeType.TextColor, SetAttributeType.STRING),

      [AttributeType.PaddingTop]: setAttributeParsingBehavior(AttributeType.PaddingTop, SetAttributeType.STRING),
      [AttributeType.PaddingBottom]: setAttributeParsingBehavior(AttributeType.PaddingBottom, SetAttributeType.STRING),
      [AttributeType.PaddingLeft]: setAttributeParsingBehavior(AttributeType.PaddingLeft, SetAttributeType.STRING),
      [AttributeType.PaddingRight]: setAttributeParsingBehavior(AttributeType.PaddingRight, SetAttributeType.STRING),

      [AttributeType.MarginTop]: setAttributeParsingBehavior(AttributeType.MarginTop, SetAttributeType.STRING),
      [AttributeType.MarginLeft]: setAttributeParsingBehavior(AttributeType.MarginLeft, SetAttributeType.STRING),
      [AttributeType.MarginBottom]: setAttributeParsingBehavior(AttributeType.MarginBottom, SetAttributeType.STRING),
      [AttributeType.MarginRight]: setAttributeParsingBehavior(AttributeType.MarginRight, SetAttributeType.STRING),
    };
  },
  addOptions() { return { HTMLAttributes: {/*currently nothing*/} }; },

  // -- Command -------------------------------------------------------------------
  addCommands() { return { setTextBlock: setTextBlockCommand }; },
  addKeyboardShortcuts() { return { 'Mod-Alt-0': () => this.editor.commands.setTextBlock() }; },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() {
    return [
      new Plugin({
        // -- Transaction ---------------------------------------------------------
        // ensure textBlocks do not carry marks from setDefaultMarks plugin
        // SEE: setDefaultMarks
        appendTransaction: (_transactions, oldState, newState) => {
          if(newState.doc === oldState.doc) return/*no changes*/;
          const { tr } = newState;

          // ensure textBlocks do not have default bold style carried from headings
          // or any previous Node
          if(newState.selection.$anchor.parent.type.name !== oldState.selection.$anchor.parent.type.name) {
            const marks = tr.storedMarks;
            if(!marks) return/*nothing to do*/;
            marks.forEach(mark => tr.removeStoredMark(mark));
          } /* else -- no Marks active, do nothing */

          return tr;
        },
      }),
    ];
  },

  // -- View ----------------------------------------------------------------------
  parseHTML() { return [safeParseTag('div')]; },
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes); },
});

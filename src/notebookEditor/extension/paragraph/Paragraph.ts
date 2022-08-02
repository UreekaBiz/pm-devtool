import { Node } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

import { getNodeOutputSpec, Attributes, AttributeType, NotebookSchemaType, ParagraphNodeSpec, SetAttributeType } from 'common';

import { setAttributeParsingBehavior } from 'notebookEditor/extension/util/attribute';
import { safeParseTag } from 'notebookEditor/extension/util/parse';
import { ExtensionPriority, NoStorage } from 'notebookEditor/model/type';

import { setParagraphCommand } from './command';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-paragraph/src/paragraph.ts

// == Node ========================================================================
interface ParagraphOptions { HTMLAttributes: Attributes; }
export const Paragraph = Node.create<ParagraphOptions, NoStorage>({
  ...ParagraphNodeSpec,
  priority: ExtensionPriority.PARAGRAPH,

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
  addCommands() { return { setParagraph: setParagraphCommand }; },
  addKeyboardShortcuts() { return { 'Mod-Alt-0': () => this.editor.commands.setParagraph() }; },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins() {
    return [
      new Plugin<NotebookSchemaType>({
        // -- Transaction ---------------------------------------------------------
        // ensure paragraphs do not have Marks carried from headings other Nodes
        appendTransaction: (_transactions, oldState, newState) => {
          if(newState.doc === oldState.doc) return/*no changes*/;
          const { tr } = newState;

          if(newState.selection.$anchor.parent.type.name !== oldState.selection.$anchor.parent.type.name) {
            tr.setStoredMarks([/*remove stored Marks for new paragraph*/]);
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

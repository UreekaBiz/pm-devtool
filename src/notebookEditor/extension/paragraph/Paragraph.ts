import { Node } from '@tiptap/core';

import { ParagraphNodeSpec } from 'common';

import { getNodeOutputSpec } from 'notebookEditor/extension/util/attribute';
import { safeParseTag } from 'notebookEditor/extension/util/parse';
import { ExtensionPriority, NoOptions, NoStorage } from 'notebookEditor/model/type';

// ********************************************************************************
// REF: https://github.com/ueberdosis/tiptap/blob/main/packages/extension-paragraph/src/paragraph.ts

// == Node ========================================================================
export const Paragraph = Node.create<NoOptions, NoStorage>({
  ...ParagraphNodeSpec,
  priority: ExtensionPriority.PARAGRAPH,

  // -- View ----------------------------------------------------------------------
  parseHTML() { return [safeParseTag('div')]; },
  renderHTML({ node, HTMLAttributes }) { return getNodeOutputSpec(node, HTMLAttributes); },
});

import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, AttributeType, HeadingLevel, HeadingNodeSpec, NodeName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { createExtensionParseRules, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { NodeExtension } from '../type/NodeExtension';
import { HeadingAttrs } from './attribute';
import { setHeadingCommand } from './command';

// ********************************************************************************
// == Constant ====================================================================
const headingLevels = Object.values(HeadingLevel);
const headingTags = headingLevels.map(level => ({ tag: `h${level}` }));

// == Node ========================================================================
export const Heading = new NodeExtension({
  // -- Definition ----------------------------------------------------------------
  name: NodeName.HEADING,
  priority: DEFAULT_EXTENSION_PRIORITY,

  // -- Spec ----------------------------------------------------------------------
  nodeSpec: {
    ...HeadingNodeSpec,

    attrs: HeadingAttrs,

    parseDOM: createExtensionParseRules(headingTags, HeadingAttrs),
    toDOM: (node) => getNodeOutputSpec(node, {/*no additional attrs*/ }),
  },

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    keymap(
      headingLevels.reduce((keyboardShortcuts, level) => ({
        ...keyboardShortcuts, ...{ [`Mod-Alt-${level}`]: () => shortcutCommandWrapper(editor, setHeadingCommand({ [AttributeType.Level]: Number(level) })) },
      }), {/*default empty*/})
    ),
  ],
});

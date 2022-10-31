import { keymap } from 'prosemirror-keymap';

import { getNodeOutputSpec, AttributeType, HeadingLevel, HeadingNodeSpec, NodeName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { createExtensionParseRules, getExtensionAttributesObject, DEFAULT_EXTENSION_PRIORITY } from '../type';
import { NodeExtension } from '../type/NodeExtension';
import { HeadingAttrs } from './attribute';
import { setHeadingCommand } from './command';
import { headingPlugin } from './plugin';

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
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HeadingAttrs)),
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) => [/*none*/],

  // -- Plugin --------------------------------------------------------------------
  addProseMirrorPlugins: (editor) => [
    headingPlugin(),
    keymap(
      headingLevels.reduce((keyboardShortcuts, level) => ({
        ...keyboardShortcuts, ...{ [`Mod-Alt-${level}`]: () => shortcutCommandWrapper(editor, setHeadingCommand({ [AttributeType.Level]: Number(level) })) },
      }), {/*default empty*/})
    ),
  ],
});

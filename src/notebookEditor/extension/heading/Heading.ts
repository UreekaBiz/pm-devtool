import { InputRule } from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';

import { getHeadingNodeType, generateNodeId, getNodeOutputSpec, AncestorDepth, AttributeType, HeadingLevel, HeadingNodeSpec, NodeName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';

import { createExtensionParseRules, getExtensionAttributesObject } from '../type/Extension/util';
import { DEFAULT_EXTENSION_PRIORITY } from '../type/Extension/type';
import { NodeExtension } from '../type/NodeExtension/NodeExtension';
import { HeadingAttrs } from './attribute';
import { setHeadingCommand } from './command';
import './heading.css';
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

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => HeadingAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: { ...HeadingNodeSpec },

  // -- DOM -----------------------------------------------------------------------
  defineDOMBehavior: (extensionStorage) => ({
    parseDOM: createExtensionParseRules(headingTags, HeadingAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HeadingAttrs)),
  }),

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) =>
    headingLevels.map(level => {
      return new InputRule( new RegExp(`^(#{1,${level}})\\s$`), (state, match, start, end) => {
        const headingType = getHeadingNodeType(state.schema);

        const $resolvedStart = state.doc.resolve(start);
        if(!$resolvedStart.node(AncestorDepth.GrandParent).canReplaceWith($resolvedStart.index(AncestorDepth.GrandParent), $resolvedStart.indexAfter(-1/*top level*/), headingType)) {
          return null/*the resulting Node Content is not valid, do nothing*/;
        } /* else -- the resulting Node Content is valid, set Heading Block Type */

        const { tr } = state;
        tr.delete(start, end)
          .setBlockType(start, start, headingType, { [AttributeType.Id]: generateNodeId(), [AttributeType.Level]: level });
        return tr/*modified*/;
      });
    }),

  // -- Paste ---------------------------------------------------------------------
  pasteRules: (editor) => [/*none*/],

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

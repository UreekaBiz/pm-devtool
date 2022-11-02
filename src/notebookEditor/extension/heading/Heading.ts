import { keymap } from 'prosemirror-keymap';

import { createBoldMark, createMarkHolderNode, getBlockNodeRange, getHeadingNodeType, generateNodeId, getNodeOutputSpec, stringifyMarksArray, AttributeType, HeadingLevel, HeadingNodeSpec, NodeName } from 'common';

import { shortcutCommandWrapper } from 'notebookEditor/command/util';
import { InputRule } from 'notebookEditor/plugin/inputRule';

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

  // -- Attribute -----------------------------------------------------------------
  defineNodeAttributes: (extensionStorage) => HeadingAttrs,

  // -- Spec ----------------------------------------------------------------------
  partialNodeSpec: {
    ...HeadingNodeSpec,

    parseDOM: createExtensionParseRules(headingTags, HeadingAttrs),
    toDOM: (node) => getNodeOutputSpec(node, getExtensionAttributesObject(node, HeadingAttrs)),
  },

  // -- Input ---------------------------------------------------------------------
  inputRules: (editor) =>
    headingLevels.map(level => {
      return new InputRule( new RegExp(`^(#{1,${level}})\\s$`), (state, match, start, end) => {
        const headingType = getHeadingNodeType(state.schema);

        const $resolvedStart = state.doc.resolve(start);
        if(!$resolvedStart.node(-1/*top level*/).canReplaceWith($resolvedStart.index(-1/*top level*/), $resolvedStart.indexAfter(-1/*top level*/), headingType)) {
          return null/*the resulting Node Content is not valid, do nothing*/;
        } /* else -- the resulting Node Content is valid, set Heading Block Type */

        const { tr } = state;
        const boldMark = createBoldMark(state.schema);
        const storedMarks = stringifyMarksArray([boldMark]);

        tr.delete(start, end)
          .setBlockType(start, start, headingType, { [AttributeType.Id]: generateNodeId(), [AttributeType.Level]: level });

          if(tr.selection.$from.parent.content.childCount === 0/*empty parent*/) {
            // add MarkHolder
            tr.insert(tr.selection.anchor, createMarkHolderNode(state.schema, { storedMarks } ));
          } else {
            // apply default Bold Mark
            const { from, to } = getBlockNodeRange(tr.selection);
            tr.addMark(from, to, boldMark);
        }

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

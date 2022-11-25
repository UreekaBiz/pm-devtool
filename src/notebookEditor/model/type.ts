import { EditorState, Transaction } from 'prosemirror-state';

// ********************************************************************************
// == Option & Storage ============================================================
export type NoStorage = unknown/*alias*/;

// == Plugin ======================================================================
export class NoPluginState {
  constructor() {/*currently nothing*/ }
  apply(tr: Transaction, thisPluginState: NoPluginState, oldEditorState: EditorState, newEditorState: EditorState) { return this; }
}

// == Extension ===================================================================
export enum ExtensionName {
  ASYNC_NODE = 'asyncNode',
  BASIC_KEYMAP = 'basicKeymap',
  DEFAULT_INPUT_RULES = 'defaultInputRules',
  EMOJI_SUGGESTION = 'emojiSuggestion',
  GAP_CURSOR = 'gapCursor',
  HISTORY = 'history',
  NESTED_VIEW_NODE = 'nestedViewNode',
  SELECTION_HANDLING = 'selectionHandling',
}

// == Priority ====================================================================
// NOTE: priority can affect Extensions, Nodes and Marks

// -- Extension -------------------------------------------------------------------
// NOTE: if Extension priority is left unspecified, it defaults to 100
// NOTE: names match Extension, Node or Mark names for sanity
export enum ExtensionPriority {

  /**
   * since MarkHolder handles removal of MarkHolder Nodes, on keydown
   * and paste, it should have a higher priority than other Extensions that are
   * not blocks
   */
  MARK_HOLDER = 120,

  // NOTE: Paragraph must have a higher priority than other block Nodes since it
  //       is the 'default' block Node (by convention). If its priority is left
  //       unspecified, the default block Node on document creation will be the
  //       first block Node encountered in the editor Extension array
  // SEE: notebookEditor/type.ts
  PARAGRAPH = 119,

  // NOTE: since the Plugins added by Tables handle Keydown and Mouse events,
  //       they should run before other Plugins
  TABLE = 118,

  // NOTE: Link must have a higher priority than other marks so that it gets
  //       preference over them when creating, pasting or applying parse rules
  LINK = 116/*T&E*/,

  // NOTE: since Suggestions have specific behavior for the Enter and arrow
  //       keydown events, they must run before other Extensions with these
  //       keydown handlers run
  EMOJI_SUGGESTION = 115,

  // NOTE: asyncNodes must check if they are dirty after the codeBlocks have
  //       been modified accordingly (e.g. codeBlockReferences and hashes) have
  //       been recomputed. Hence this must run before other Extensions
  ASYNC_NODE = 114,

  // NOTE: since Blocks make use of several specific Commands, they must not
  //       be executed in default order
  CODEBLOCK = 113,

  // NOTE: (SEE: ExtensionPriority.CodeBlock)
  DEMO_ASYNC_NODE_2 = 112,

  // NOTE: (SEE: ExtensionPriority.CodeBlock)
  // NOTE: since Blockquote shares the Mod-B keybinding with Bold, it must have
  //       a priority higher than it so that it gets inserted without toggling it
  BLOCKQUOTE = 111,

  // NOTE: since EditableInlineNodeWithContent shares the Mod-E keybinding
  //       with Code, it must have a priority higher than it so that it
  //       gets inserted without toggling it
  EDITABLE_INLINE_NODE_WITH_CONTENT = 110,

  // NOTE: for consistency with EditableInlineNodeWithContent
  NESTED_VIEW_BLOCK_NODE = 109/*same as EditableInlineNodeWithContent*/,

  // NOTE: since the Commands added by Lists handle Keydown,
  //       they should run before other Plugins that also do so, but after
  //       other TextBlock Nodes
  LIST_ITEM = 108,

  // NOTE: since the Text Extension adds '\t' whenever Tab is pressed, but this
  //       behavior is not always guaranteed to be the desired one (e.g. when
  //       going through a list Node), the Text Extension runs last. This ensures
  //       that the shortcuts defined in the Text Extension run only if their
  //       trigger was not handled by another Extension previously
  // SEE: NOTE above for default Extension priority
  TEXT = 99,

  // -- Mark ----------------------------------------------------------------------
  // Currently nothing
}
